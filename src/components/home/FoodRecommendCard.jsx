import { Flame, ExternalLink, Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { searchFoodImage } from '@/lib/unsplash';

const parseNutrition = (ratio) => {
  if (!ratio) return { p: '-', c: '-', f: '-' };
  const parts = ratio.split('/').map((s) => s.trim());
  return { p: parts[0] || '-', c: parts[1] || '-', f: parts[2] || '-' };
};

const FoodImage = ({ food }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const fetchImage = async () => {
      const query = food?.food_name_en || food?.food_name;
      try {
        const url = await searchFoodImage(query);
        if (!cancelled) {
          if (url) {
            setImageUrl(url);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();
    return () => { cancelled = true; };
  }, [food?.food_name_en, food?.food_name]);

  if (loading) {
    return (
      <div className="relative w-full h-32 flex items-center justify-center bg-muted text-muted-foreground">
        <Loader2 size={24} className="animate-spin opacity-50" />
        <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] py-1.5">
          <p className="text-center text-[10px] text-white/80 tracking-wide">
            图片仅供参考，一切以下单实物为准
          </p>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="relative w-full h-32 flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <ImageOff size={32} className="mx-auto mb-2 opacity-50" />
          <span className="text-xs">{food?.food_name}</span>
        </div>
        <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] py-1.5">
          <p className="text-center text-[10px] text-white/80 tracking-wide">
            图片仅供参考，一切以下单实物为准
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-32">
      <img
        src={imageUrl}
        alt={food?.food_name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
      <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] py-1.5">
        <p className="text-center text-[10px] text-white/80 tracking-wide">
          图片仅供参考，一切以下单实物为准
        </p>
      </div>
    </div>
  );
};

const FoodRecommendCard = ({ food, onRefresh, refreshing = false }) => {
  if (!food) return null;
  const nutri = parseNutrition(food.nutrition_ratio);

  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg overflow-hidden">
        <FoodImage food={food} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">{food.food_name}</h4>
          <p className="text-xs text-muted-foreground">{food.food_type}</p>
        </div>
        <div className="flex items-center text-orange-500 text-sm font-medium">
          <Flame size={14} className="mr-1" />
          {food.heat}
        </div>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>蛋白质 {nutri.p}</span>
        <span>碳水 {nutri.c}</span>
        <span>脂肪 {nutri.f}</span>
      </div>
      <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-800 leading-relaxed">
        {food.reason}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
          onClick={() => window.open(`https://h5.waimai.meituan.com/waimai/mindex/searchresults?queryType=12002&keyword=${encodeURIComponent(food.food_name)}&entranceId=0&qwTypeId=0&mode=search`, '_blank')}
        >
          <ExternalLink size={14} className="mr-1" /> 一键跳转美团下单
        </Button>
        <button
          onClick={() => onRefresh?.()}
          disabled={refreshing}
          className="w-9 h-9 rounded-full bg-[#FFC300] text-gray-900 flex items-center justify-center hover:bg-[#e6b000] active:scale-95 transition-all disabled:opacity-60 shrink-0"
          aria-label="刷新推荐"
        >
          {refreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>
    </div>
  );
};

export default FoodRecommendCard;
