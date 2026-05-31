import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateWeeklySummary } from '@/lib/glm';
import { toast } from 'sonner';

const CACHE_KEY = 'moveat_weekly_summary';
const CACHE_HASH_KEY = 'moveat_weekly_summary_hash';

const getUserInfo = async () => {
  const guestId = localStorage.getItem('moveat_guest_id');
  if (guestId) return { id: guestId, isGuest: true };
  const { data: { user } } = await supabase.auth.getUser();
  return { id: user?.id || 'unknown', isGuest: false };
};

const buildGuestPayload = () => {
  const act = JSON.parse(localStorage.getItem('moveat_guest_activity') || 'null');
  const diet = JSON.parse(localStorage.getItem('moveat_guest_diet_logs') || '[]');
  const prof = JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null');
  const today = new Date().toISOString().split('T')[0];
  const td = diet.filter((d) => d.date === today);
  return {
    days: [{
      date: today, intake: td.reduce((s, d) => s + (d.calorie || 0), 0),
      burn: act?.calories_burned || 0, steps: act?.steps || 0,
      protein: td.reduce((s, d) => s + (d.protein || 0), 0),
      carb: td.reduce((s, d) => s + (d.carb || 0), 0),
      fat: td.reduce((s, d) => s + (d.fat || 0), 0),
    }],
    profile: prof,
  };
};

const buildUserPayload = async (userId) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0];
  });
  const [aRes, dRes, pRes] = await Promise.all([
    supabase.from('activity_logs').select('*').eq('user_id', userId).gte('date', dates[0]).lte('date', dates[6]),
    supabase.from('diet_intake').select('*').eq('user_id', userId).gte('date', dates[0]).lte('date', dates[6]),
    supabase.from('users').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  return {
    days: dates.map((date) => {
      const act = aRes.data?.find((x) => x.date === date);
      const ds = dRes.data?.filter((x) => x.date === date) || [];
      return {
        date, intake: ds.reduce((s, x) => s + (x.calorie || 0), 0),
        burn: act?.calories_burned || 0, steps: act?.steps || 0,
        protein: ds.reduce((s, x) => s + (x.protein || 0), 0),
        carb: ds.reduce((s, x) => s + (x.carb || 0), 0),
        fat: ds.reduce((s, x) => s + (x.fat || 0), 0),
      };
    }),
    profile: pRes.data,
  };
};

// 简单哈希函数，用于判断数据是否变化
const hashPayload = (payload) => {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
};

export const useWeeklySummary = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    // 检查本地缓存，如果有缓存先显示，不阻塞 UI
    const { id } = await getUserInfo();
    const ck = `${CACHE_KEY}_${id}`;
    const chk = `${CACHE_HASH_KEY}_${id}`;
    const cached = localStorage.getItem(ck);

    // 如果不是强制刷新，先尝试用缓存，不设置 loading
    if (!forceRefresh && cached) {
      setSummary(cached);
      setInitialized(true);
    }

    // 只有在需要重新生成时才设置 loading
    const payload = id.startsWith('guest_') ? buildGuestPayload() : await buildUserPayload(id);
    const currentHash = hashPayload(payload);

    // 如果数据没变且不是强制刷新，直接返回（缓存已显示）
    if (!forceRefresh && localStorage.getItem(chk) === currentHash && cached) {
      return;
    }

    // 需要重新生成，显示 loading
    setLoading(true);
    try {
      const result = await generateWeeklySummary(payload);
      setSummary(result);
      localStorage.setItem(ck, result);
      localStorage.setItem(chk, currentHash);
    } catch (err) {
      console.error('周总结生成失败:', err);
      setSummary('本周数据已记录，继续保持健康的生活习惯，合理搭配饮食与运动。');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  // 监听饮食/运动数据变化，自动刷新 AI 总结
  useEffect(() => {
    const handleDataChange = async () => {
      // 强制重新生成，因为数据已变化
      await load(true);
    };
    window.addEventListener('moveat-diet-update', handleDataChange);
    window.addEventListener('moveat-activity-update', handleDataChange);
    return () => {
      window.removeEventListener('moveat-diet-update', handleDataChange);
      window.removeEventListener('moveat-activity-update', handleDataChange);
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
    toast.success('周总结已更新');
  }, [load]);

  return { summary, loading, refresh };
};
