import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateWeeklySummary } from '@/lib/glm';
import { toast } from 'sonner';

const CACHE_KEY = 'moveat_weekly_summary';
const CACHE_DATE_KEY = 'moveat_weekly_summary_date';

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

export const useWeeklySummary = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { id, isGuest } = await getUserInfo();
      const today = new Date().toISOString().split('T')[0];
      const ck = `${CACHE_KEY}_${id}`;
      const cd = `${CACHE_DATE_KEY}_${id}`;
      if (localStorage.getItem(cd) === today && localStorage.getItem(ck)) {
        setSummary(localStorage.getItem(ck));
        return;
      }
      const payload = isGuest ? buildGuestPayload() : await buildUserPayload(id);
      const result = await generateWeeklySummary(payload);
      setSummary(result);
      localStorage.setItem(ck, result);
      localStorage.setItem(cd, today);
    } catch (err) {
      console.error('周总结生成失败:', err);
      setSummary('本周数据已记录，继续保持健康的生活习惯，合理搭配饮食与运动。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 监听饮食/运动数据变化，自动刷新 AI 总结
  useEffect(() => {
    const handleDataChange = async () => {
      const { id } = await getUserInfo();
      // 清除缓存，下次 load 时会重新生成
      localStorage.removeItem(`${CACHE_KEY}_${id}`);
      localStorage.removeItem(`${CACHE_DATE_KEY}_${id}`);
      // 立即重新生成
      await load();
    };
    window.addEventListener('moveat-diet-update', handleDataChange);
    window.addEventListener('moveat-activity-update', handleDataChange);
    return () => {
      window.removeEventListener('moveat-diet-update', handleDataChange);
      window.removeEventListener('moveat-activity-update', handleDataChange);
    };
  }, [load]);

  const refresh = useCallback(async () => {
    const { id } = await getUserInfo();
    localStorage.removeItem(`${CACHE_KEY}_${id}`);
    localStorage.removeItem(`${CACHE_DATE_KEY}_${id}`);
    await load();
    toast.success('周总结已更新');
  }, [load]);

  return { summary, loading, refresh };
};
