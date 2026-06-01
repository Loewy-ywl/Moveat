
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ThumbsUp, ExternalLink, Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecommendAiAnalysis } from '@/hooks/useAiAnalysis';
import { searchFoodImage } from '@/lib/unsplash';

const filters = ['AI排序', '低卡模式', '高蛋白模式'];

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
      <div className="relative w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
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
      <div className="relative w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <ImageOff size={40} className="mx-auto mb-2 opacity-50" />
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
    <div className="relative w-full h-full">
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

const parseNutrition = (ratio) => {
  if (!ratio) return { p: '-', c: '-', f: '-' };
  const parts = ratio.split('/').map((s) => s.trim());
  return { p: parts[0] || '-', c: parts[1] || '-', f: parts[2] || '-' };
};

const filterToMode = {
  'AI排序': 'default',
  '低卡模式': '低卡模式',
  '高蛋白模式': '高蛋白模式',
};

const Recommendations = () => {
  const [activeFilter, setActiveFilter] = useState('AI排序');
  const { aiData, loading, refreshAnalysis, switchMode, activeMode } = useRecommendAiAnalysis();

  const handleFilterClick = async (f) => {
    if (loading || f === activeFilter) return;
    setActiveFilter(f);
    
    // 切换模式
    const mode = filterToMode[f];
    switchMode(mode);
    
    // 如果该模式没有数据，才请求
    if (!aiData?.recommend_list || aiData.recommend_list.length === 0) {
      await refreshAnalysis(mode);
    }
  };

  const handleLoadMore = async () => {
    if (loading) return;
    await refreshAnalysis(filterToMode[activeFilter]);
  };

  const foods = aiData?.recommend_list || [];

  return (
    <div className="h-[100dvh] overflow-y-auto bg-background max-w-md mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Moveat外卖推荐</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((f) =>
        <button
          key={f}
          onClick={() => handleFilterClick(f)}
          disabled={loading}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
          activeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted'}`
          }>
          
            {f}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={24} />
          </div>
          <p className="text-sm text-gray-500">AI 正在根据你的实时数据生成专属推荐...</p>
        </div>
      ) : foods.length > 0 ? (
        <div className="space-y-4">
          {foods.map((food, i) => {
            const nutri = parseNutrition(food.nutrition_ratio);
            return (
              <Card key={`${food.food_name}-${i}`} className="overflow-hidden">
                <div className="h-32 bg-muted relative">
                  <FoodImage food={food} />
                  
                  <Badge className="absolute top-2 right-2 bg-emerald-500">
                    <ThumbsUp size={12} className="mr-1" />{food.food_type}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold">{food.food_name}</h3>
                      <p className="text-xs text-muted-foreground">{food.food_type}</p>
                    </div>
                    <div className="flex items-center text-orange-500 text-sm font-medium">
                      <Flame size={14} className="mr-1" />{food.heat}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                    <span>蛋白质 {nutri.p}</span>
                    <span>碳水 {nutri.c}</span>
                    <span>脂肪 {nutri.f}</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground mb-3">
                    <span className="text-primary font-medium">推荐理由：</span>{food.reason}
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
                    onClick={() => window.open(`https://h5.waimai.meituan.com/waimai/mindex/searchresults?queryType=12002&keyword=${encodeURIComponent(food.food_name)}&entranceId=0&qwTypeId=0&mode=search`, '_blank')}>
                    
                    <ExternalLink size={14} className="mr-1" /> 一键跳转美团外卖下单
                  </Button>
                </CardContent>
              </Card>);

          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ImageOff size={24} className="opacity-50" />
          </div>
          <p className="text-sm">暂无推荐数据</p>
          <p className="text-xs">切换到首页生成今日专属推荐</p>
        </div>
      )}

      {foods.length > 0 && !loading &&
      <button
        onClick={handleLoadMore}
        disabled={loading}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-[#FFC300] text-gray-900 shadow-lg flex items-center justify-center hover:bg-[#e6b000] active:scale-95 transition-all disabled:opacity-60 z-50">
        
          <RefreshCw size={20} />
        </button>
      }
    </div>);

};

export default Recommendations;

