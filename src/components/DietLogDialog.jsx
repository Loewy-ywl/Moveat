import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Loader2, X, Wand2, Upload } from 'lucide-react';
import { analyzeFoodImage, fileToBase64 } from '@/lib/mimo';
import { supabase } from '@/integrations/supabase/client';

const mealOptions = ['早餐', '午餐', '晚餐', '加餐'];

const DietLogDialog = ({ open, onOpenChange, editingItem, onSubmit }) => {
  const [mealPeriod, setMealPeriod] = useState('晚餐');
  const [foodName, setFoodName] = useState('');
  const [calorie, setCalorie] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setMealPeriod(editingItem.meal_period || '晚餐');
        setFoodName(editingItem.food_name || '');
        setCalorie(String(editingItem.calorie ?? ''));
        setProtein(String(editingItem.protein ?? ''));
        setCarb(String(editingItem.carb ?? ''));
        setFat(String(editingItem.fat ?? ''));
        setImagePreview(editingItem.image_url || null);
      } else {
        setMealPeriod('晚餐');
        setFoodName('');
        setCalorie('');
        setProtein('');
        setCarb('');
        setFat('');
        setImagePreview(null);
        setImageFile(null);
      }
      setLoading(false);
      setAiAnalyzing(false);
      setUploading(false);
    }
  }, [open, editingItem]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    try {
      // 显示预览
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);

      // AI 分析
      setAiAnalyzing(true);
      toast.info('正在分析食物图片...');

      const base64 = await fileToBase64(file);
      const result = await analyzeFoodImage(base64);

      // 自动填充识别结果
      if (result.food_name) setFoodName(result.food_name);
      if (result.calorie) setCalorie(String(result.calorie));
      if (result.protein) setProtein(String(result.protein));
      if (result.carb) setCarb(String(result.carb));
      if (result.fat) setFat(String(result.fat));

      toast.success('AI 识别完成，请核对信息');
    } catch (err) {
      console.error('AI 分析失败:', err);
      toast.error('AI 识别失败，请手动输入');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `diet-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('moveat')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('moveat')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('图片上传失败:', err);
      toast.error('图片上传失败，继续保存无图记录');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!foodName.trim()) {
      toast.error('请填写餐食名称');
      return;
    }
    if (!calorie.trim()) {
      toast.error('请填写热量摄入');
      return;
    }
    setLoading(true);
    try {
      // 如果有新图片，先上传
      let imageUrl = imagePreview;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const payload = {
        meal_period: mealPeriod,
        food_name: foodName.trim(),
        calorie: parseInt(calorie) || 0,
        protein: parseInt(protein) || 0,
        carb: parseInt(carb) || 0,
        fat: parseInt(fat) || 0,
        image_url: imageUrl || null,
      };
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? '编辑饮食记录' : '记录饮食'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 图片上传区域 */}
          <div>
            <Label>食物照片（可选）</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="食物预览"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X size={16} />
                  </button>
                  {aiAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                >
                  <Camera size={24} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">点击上传食物照片</span>
                  <span className="text-xs text-muted-foreground/60">AI 将自动识别营养成分</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* AI 识别提示 */}
          {imagePreview && !aiAnalyzing && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
              <Wand2 size={14} />
              <span>AI 已自动识别，请核对信息</span>
            </div>
          )}

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
        <Button onClick={handleSubmit} disabled={loading || aiAnalyzing || uploading} className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]">
          {uploading ? (
            <>
              <Upload className="animate-bounce mr-2" size={16} />
              上传图片中...
            </>
          ) : aiAnalyzing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              AI 识别中...
            </>
          ) : loading ? (
            '保存中...'
          ) : (
            editingItem ? '更新' : '提交'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DietLogDialog;
