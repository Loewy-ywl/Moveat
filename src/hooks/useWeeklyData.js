import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const getPast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// 全局缓存
let globalWeeklyCache = null;
let globalWeeklyCacheTime = 0;
const WEEKLY_CACHE_TTL = 30 * 1000; // 30秒

export const useWeeklyData = () => {
  const [data, setData] = useState(() => {
    if (globalWeeklyCache && Date.now() - globalWeeklyCacheTime < WEEKLY_CACHE_TTL) {
      return globalWeeklyCache;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    const isGuest = !!localStorage.getItem('moveat_guest_id');
    if (isGuest) {
      const guestDiet = JSON.parse(localStorage.getItem('moveat_guest_diet_logs') || '[]');
      const guestActivity = JSON.parse(localStorage.getItem('moveat_guest_activity') || 'null');
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBurn = guestActivity?.calories_burned || 0;
      const dates = getPast7Days();
      const result = dates.map((dateStr) => {
        const intake = guestDiet.filter((d) => d.date === dateStr).reduce((s, d) => s + (d.calorie || 0), 0);
        const burn = dateStr === todayStr ? todayBurn : 0;
        return { day: dayNames[new Date(dateStr).getDay()], intake, burn, weight: 0 };
      });
      setData(result);
      globalWeeklyCache = result;
      globalWeeklyCacheTime = Date.now();
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setData([]); return; }
      const dates = getPast7Days();
      const [dietRes, actRes, weightRes, profileRes] = await Promise.all([
        supabase.from('diet_intake').select('date, calorie').eq('user_id', user.id).gte('date', dates[0]).lte('date', dates[6]),
        supabase.from('activity_logs').select('date, calories_burned').eq('user_id', user.id).gte('date', dates[0]).lte('date', dates[6]),
        supabase.from('weight_logs').select('date, weight').eq('user_id', user.id).gte('date', dates[0]).lte('date', dates[6]).order('date', { ascending: true }),
        supabase.from('users').select('weight').eq('user_id', user.id).maybeSingle(),
      ]);
      const currentWeight = profileRes.data?.weight || 70;
      const result = dates.map((dateStr) => {
        const intake = dietRes.data?.filter((d) => d.date === dateStr).reduce((s, d) => s + (d.calorie || 0), 0) || 0;
        const burn = actRes.data?.find((d) => d.date === dateStr)?.calories_burned || 0;
        const wRecord = weightRes.data?.find((d) => d.date === dateStr);
        let weight = currentWeight;
        if (wRecord) weight = wRecord.weight;
        else {
          const prev = weightRes.data?.filter((d) => d.date < dateStr);
          if (prev && prev.length) weight = prev[prev.length - 1].weight;
        }
        return { day: dayNames[new Date(dateStr).getDay()], intake, burn, weight };
      });
      setData(result);
      globalWeeklyCache = result;
      globalWeeklyCacheTime = Date.now();
    } catch (err) {
      console.error('加载周数据失败:', err);
      setData([]);
    }
  }, []);

  const load = useCallback(async () => {
    if (globalWeeklyCache && Date.now() - globalWeeklyCacheTime < WEEKLY_CACHE_TTL) {
      setData(globalWeeklyCache);
      refreshData();
      return;
    }
    setLoading(true);
    await refreshData();
    setLoading(false);
  }, [refreshData]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, refresh: load };
};
