import { Flame, ExternalLink, Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const parseNutrition = (ratio) => {
  if (!ratio) return { p: '-', c: '-', f: '-' };
  const parts = ratio.split('/').map((s) => s.trim());
  return { p: parts[0] || '-', c: parts[1] || '-', f: parts[2] || '-' };
};

const FoodImage = ({ foodName }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <ImageOff size={32} className="mx-auto mb-2 opacity-50" />
          <span className="text-xs">{foodName}</span>
        </div>
      </div>
    );
  }

  // 使用 Unsplash Source 作为图片源（根据食物关键词搜索）
  const getImageUrl = (keyword) => {
    // 提取核心关键词用于图片搜索
    const cleanKeyword = keyword
      .replace(/健身餐|轻食|简餐|套餐/g, '')
      .replace(/高蛋白|低卡|清淡|低脂/g, '')
      .trim();
    return `https://source.unsplash.com/400x200/?food,${encodeURIComponent(cleanKeyword || 'healthy food')}`;
  };

  return (
    <img
      src={getImageUrl(foodName)}
      alt={foodName}
      className="w-full h-32 mx-auto object-cover"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

const FoodRecommendCard = ({ food, onRefresh, refreshing = false }) => {
  if (!food) return null;
  const nutri = parseNutrition(food.nutrition_ratio);

  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg overflow-hidden">
        <FoodImage foodName={food.food_name} />
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
