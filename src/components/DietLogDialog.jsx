import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const mealOptions = ['早餐', '午餐', '晚餐', '加餐'];

const DietLogDialog = ({ open, onOpenChange, editingItem, onSubmit }) => {
  const [mealPeriod, setMealPeriod] = useState('晚餐');
  const [foodName, setFoodName] = useState('');
  const [calorie, setCalorie] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setMealPeriod(editingItem.meal_period || '晚餐');
        setFoodName(editingItem.food_name || '');
        setCalorie(String(editingItem.calorie ?? ''));
        setProtein(String(editingItem.protein ?? ''));
        setCarb(String(editingItem.carb ?? ''));
        setFat(String(editingItem.fat ?? ''));
      } else {
        setMealPeriod('晚餐');
        setFoodName('');
        setCalorie('');
        setProtein('');
        setCarb('');
        setFat('');
      }
      setLoading(false);
    }
  }, [open, editingItem]);

  const handleSubmit = async () => {
    if (!foodName.trim()) {
      toast.error('请填写餐食名称');
      return;
    }
    if (!calorie.trim()) {
      toast.error('请填写热量摄入');
      return;
    }
    const payload = {
      meal_period: mealPeriod,
      food_name: foodName.trim(),
      calorie: parseInt(calorie) || 0,
      protein: parseInt(protein) || 0,
      carb: parseInt(carb) || 0,
      fat: parseInt(fat) || 0,
    };
    setLoading(true);
    try {
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingItem ? '编辑饮食记录' : '记录饮食'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>餐次</Label>
            <div className="flex gap-2 mt-2">
              {mealOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setMealPeriod(m)}
                  className={`flex-1 border rounded-lg py-2 text-sm transition-colors ${mealPeriod === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-accent'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>餐食名称</Label>
            <Input placeholder="例如：鸡胸肉沙拉" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
          </div>
          <div>
            <Label>热量 (kcal) *</Label>
            <Input type="number" placeholder="500" value={calorie} onChange={(e) => setCalorie(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>蛋白质 (g)</Label>
              <Input type="number" placeholder="20" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>
            <div>
              <Label>碳水 (g)</Label>
              <Input type="number" placeholder="50" value={carb} onChange={(e) => setCarb(e.target.value)} />
            </div>
            <div>
              <Label>脂肪 (g)</Label>
              <Input type="number" placeholder="10" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]">
          {loading ? '保存中...' : (editingItem ? '更新' : '提交')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DietLogDialog;
