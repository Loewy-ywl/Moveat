
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLocalDateStr } from '@/lib/date';

const GUEST_DIET_KEY = 'moveat_guest_diet_logs';

const getTodayStr = () => getLocalDateStr();

export const useDietLogs = (date) => {
  const [dietLogs, setDietLogs] = useState([]);
  const [loading, setLoading] = useState(true); // 初始为 true，显示加载状态
  const isGuest = !!localStorage.getItem('moveat_guest_id');
  const targetDate = date || getTodayStr();

  const loadDietLogs = useCallback(async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_DIET_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const filtered = all.filter((log) => log.date === targetDate).reverse();
        setDietLogs(filtered);
        return filtered;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDietLogs([]);
        return [];
      }
      const { data, error } = await supabase
        .from('diet_intake')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .order('id', { ascending: false });
      if (error) throw error;
      setDietLogs(data || []);
      return data || [];
    } catch (err) {
      console.error('加载饮食记录失败:', err);
      toast.error('加载饮食记录失败');
      setDietLogs([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isGuest, targetDate]);

  useEffect(() => {
    loadDietLogs();
  }, [loadDietLogs]);

  const addDietLog = async (payload) => {
    const record = { ...payload };
    if (!record.date) record.date = getTodayStr();
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_DIET_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const newRecord = { ...record, id: `guest_diet_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
        all.push(newRecord);
        localStorage.setItem(GUEST_DIET_KEY, JSON.stringify(all));
        if (record.date === targetDate) {
          setDietLogs((prev) => [newRecord, ...prev]);
        }
        window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: record.date } }));
        toast.success('饮食记录保存成功');
        return newRecord;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('未登录，请先登录');
        return null;
      }
      const insertPayload = { ...record, user_id: user.id };
      const { data, error } = await supabase.from('diet_intake').insert(insertPayload).select().single();
      if (error) throw error;
      if (record.date === targetDate) {
        setDietLogs((prev) => [data, ...prev]);
      }
      window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: record.date } }));
      toast.success('饮食记录保存成功');
      return data;
    } catch (err) {
      console.error('保存饮食记录失败:', err);
      toast.error(err.message || '保存失败');
      return null;
    }
  };

  const updateDietLog = async (id, payload) => {
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_DIET_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const idx = all.findIndex((log) => log.id === id);
        if (idx === -1) return;
        all[idx] = { ...all[idx], ...payload };
        localStorage.setItem(GUEST_DIET_KEY, JSON.stringify(all));
        if (all[idx].date === targetDate) {
          setDietLogs((prev) => prev.map((log) => (log.id === id ? all[idx] : log)));
        } else {
          setDietLogs((prev) => prev.filter((log) => log.id !== id));
        }
        window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: all[idx].date } }));
        toast.success('饮食记录更新成功');
        return all[idx];
      }
      const { data, error } = await supabase.from('diet_intake').update(payload).eq('id', id).select().single();
      if (error) throw error;
      if (data.date === targetDate) {
        setDietLogs((prev) => prev.map((log) => (log.id === id ? data : log)));
      } else {
        setDietLogs((prev) => prev.filter((log) => log.id !== id));
      }
      window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: data.date } }));
      toast.success('饮食记录更新成功');
      return data;
    } catch (err) {
      console.error('更新饮食记录失败:', err);
      toast.error(err.message || '更新失败');
      return null;
    }
  };

  const deleteDietLog = async (id) => {
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_DIET_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const item = all.find((log) => log.id === id);
        const filtered = all.filter((log) => log.id !== id);
        localStorage.setItem(GUEST_DIET_KEY, JSON.stringify(filtered));
        setDietLogs((prev) => prev.filter((log) => log.id !== id));
        if (item) {
          window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: item.date } }));
        }
        toast.success('饮食记录已删除');
        return;
      }
      const { data: item } = await supabase.from('diet_intake').select('date').eq('id', id).single();
      const { error } = await supabase.from('diet_intake').delete().eq('id', id);
      if (error) throw error;
      setDietLogs((prev) => prev.filter((log) => log.id !== id));
      if (item) {
        window.dispatchEvent(new CustomEvent('moveat-diet-update', { detail: { date: item.date } }));
      }
      toast.success('饮食记录已删除');
    } catch (err) {
      console.error('删除饮食记录失败:', err);
      toast.error(err.message || '删除失败');
    }
  };

  const todaySummary = useCallback(() => {
    const total = dietLogs.reduce(
      (acc, log) => ({
        calorie: acc.calorie + (log.calorie || 0),
        protein: acc.protein + (log.protein || 0),
        carb: acc.carb + (log.carb || 0),
        fat: acc.fat + (log.fat || 0),
      }),
      { calorie: 0, protein: 0, carb: 0, fat: 0 }
    );
    return total;
  }, [dietLogs]);

  return { dietLogs, loading, addDietLog, updateDietLog, deleteDietLog, todaySummary, refresh: loadDietLogs };
};

