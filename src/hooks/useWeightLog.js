import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWeightLog = () => {
  const [loading, setLoading] = useState(false);

  const saveWeight = useCallback(async (weightValue) => {
    const weight = parseInt(weightValue);
    if (!weight || weight <= 0) { toast.error('请输入有效的体重'); return false; }
    setLoading(true);
    try {
      const isGuest = !!localStorage.getItem('moveat_guest_id');
      const today = new Date().toISOString().split('T')[0];
      if (isGuest) {
        const guestProfile = JSON.parse(localStorage.getItem('moveat_guest_profile') || '{}');
        guestProfile.weight = weight;
        localStorage.setItem('moveat_guest_profile', JSON.stringify(guestProfile));
        toast.success('体重更新成功');
        return true;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('请先登录'); return false; }
      const { error: e1 } = await supabase.from('weight_logs').insert({ user_id: user.id, date: today, weight });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('users').update({ weight }).eq('user_id', user.id);
      if (e2) throw e2;
      toast.success('体重更新成功');
      return true;
    } catch (err) {
      console.error('保存体重失败:', err);
      toast.error(err.message || '保存失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveWeight, loading };
};
