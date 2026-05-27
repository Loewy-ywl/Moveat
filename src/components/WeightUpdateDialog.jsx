import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeightLog } from '@/hooks/useWeightLog';

const WeightUpdateDialog = ({ open, onOpenChange, onSuccess }) => {
  const [weight, setWeight] = useState('');
  const { saveWeight, loading } = useWeightLog();

  const handleSubmit = async () => {
    const success = await saveWeight(weight);
    if (success) {
      setWeight('');
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>更新体重</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>当前体重 (kg)</Label>
            <Input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]">
          {loading ? '保存中...' : '确认更新'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WeightUpdateDialog;
