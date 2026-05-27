import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLocalDateStr } from '@/lib/date';

const ActivityLogDialog = ({ open, onOpenChange, onSuccess }) => {
  const [steps, setSteps] = useState('');
  const [calories, setCalories] = useState('');
  const [cardio, setCardio] = useState('');
  const [strength, setStrength] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSteps(''); setCalories(''); setCardio(''); setStrength(''); setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!steps || !calories) {
      toast.error('请填写步数和卡路里消耗');
      return;
    }
    setLoading(true);
    try {
      const today = getLocalDateStr();
      const guestId = localStorage.getItem('moveat_guest_id');
      if (guestId) {
        const payload = {
          user_id: guestId, date: today,
          steps: parseInt(steps) || 0, calories_burned: parseInt(calories) || 0,
          cardio_minutes: parseInt(cardio) || 0, strength_minutes: parseInt(strength) || 0,
        };
        localStorage.setItem('moveat_guest_activity', JSON.stringify(payload));
        toast.success('运动数据保存成功（游客模式）');
        onSuccess?.(); onOpenChange(false); return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('未登录，请先登录'); return; }
      const { data: existing } = await supabase.from('activity_logs').select('id').eq('user_id', user.id).eq('date', today).maybeSingle();
      const payload = {
        user_id: user.id, date: today,
        steps: parseInt(steps) || 0, calories_burned: parseInt(calories) || 0,
        cardio_minutes: parseInt(cardio) || 0, strength_minutes: parseInt(strength) || 0,
      };
      if (existing) {
        const { error } = await supabase.from('activity_logs').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('activity_logs').insert(payload);
        if (error) throw error;
      }
      toast.success('运动数据保存成功');
      onSuccess?.(); onOpenChange(false);
    } catch (err) {
      console.error('保存运动数据失败:', err);
      toast.error(err.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>手动录入今日运动</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label>步数</Label><Input type="number" placeholder="12000" value={steps} onChange={(e) => setSteps(e.target.value)} /></div>
          <div><Label>卡路里消耗 (kcal)</Label><Input type="number" placeholder="680" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
          <div><Label>有氧时长 (分钟)</Label><Input type="number" placeholder="45" value={cardio} onChange={(e) => setCardio(e.target.value)} /></div>
          <div><Label>无氧力量时长 (分钟)</Label><Input type="number" placeholder="30" value={strength} onChange={(e) => setStrength(e.target.value)} /></div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]">
          {loading ? '保存中...' : '确认录入'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogDialog;
