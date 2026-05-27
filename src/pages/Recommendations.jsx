
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ThumbsUp, ExternalLink, Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';

const filters = ['AI排序', '低卡模式', '高蛋白模式'];

const FoodImage = ({ foodName }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
        <div className="text-center">
          <ImageOff size={40} className="mx-auto mb-2 opacity-50" />
          <span className="text-xs">{foodName}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={`https://nocode.meituan.com/photo/search?keyword=${encodeURIComponent(foodName)}&width=400&height=200`}
      alt={foodName}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

const parseNutrition = (ratio) => {
  if (!ratio) return { p: '-', c: '-', f: '-' };
  const parts = ratio.split('/').map((s) => s.trim());
  return { p: parts[0] || '-', c: parts[1] || '-', f: parts[2] || '-' };
};

const Recommendations = () => {
  const [activeFilter, setActiveFilter] = useState('AI排序');
  const { aiData, loading, refreshAnalysis } = useAiAnalysis();

  const handleFilterClick = async (f) => {
    if (loading || f === activeFilter) return;
    setActiveFilter(f);
    await refreshAnalysis(f);
  };

  const handleLoadMore = async () => {
    if (loading) return;
    await refreshAnalysis(activeFilter);
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

      {loading &&
      <div className="flex items-center justify-center gap-2 py-3 mb-4 text-sm text-muted-foreground bg-muted/40 rounded-lg">
          <Loader2 className="animate-spin" size={16} />
          {foods.length > 0 ? '正在生成新推荐...' : '正在为你生成推荐...'}
        </div>
      }

      <div className="space-y-4">
        {foods.map((food, i) => {
          const nutri = parseNutrition(food.nutrition_ratio);
          return (
            <Card key={`${food.food_name}-${i}`} className="overflow-hidden">
              <div className="h-32 bg-muted relative">
                <FoodImage foodName={food.food_name} />
                
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

      {foods.length > 0 &&
      <button
        onClick={handleLoadMore}
        disabled={loading}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-[#FFC300] text-gray-900 shadow-lg flex items-center justify-center hover:bg-[#e6b000] active:scale-95 transition-all disabled:opacity-60 z-50">
        
          {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
        </button>
      }
    </div>);

};

export default Recommendations;

