import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHomeData } from '@/hooks/useHomeData';
import { useHomeAiAnalysis } from '@/hooks/useAiAnalysis';
import HomeStats from '@/components/home/HomeStats';
import FoodRecommendCard from '@/components/home/FoodRecommendCard';
import { getGoalInfo, getGreeting, getFallbackAdvice } from '@/lib/home-helpers';
import { toast } from 'sonner';

const Home = () => {
  const {
    steps,
    calories,
    profile,
    cardioMinutes,
    strengthMinutes,
    dietSummary,
    nutritionGoals,
    refresh,
  } = useHomeData();
  const { aiData, refreshAnalysis, loading: aiLoading } = useHomeAiAnalysis();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFoodCard, setShowFoodCard] = useState(() => {
    // 从 localStorage 读取是否已生成过推荐
    return localStorage.getItem('moveat_show_food_card') === 'true';
  });
  const [foodRefreshing, setFoodRefreshing] = useState(false);
  const refreshRef = useRef(refreshAnalysis);
  refreshRef.current = refreshAnalysis;

  const goalInfo = getGoalInfo(profile?.goal);
  const greeting = getGreeting();
  const currentHour = new Date().getHours();

  const totalTraining = (cardioMinutes || 0) + (strengthMinutes || 0);

  const { calorieGoal, proteinGoal, carbGoal, fatGoal } = nutritionGoals;
  const intakeCalories = dietSummary?.calorie || 0;
  const netCalories = calorieGoal - intakeCalories;

  const proteinPercent = proteinGoal > 0 ? Math.min(100, Math.round((dietSummary.protein / proteinGoal) * 100)) : 0;
  const carbPercent = carbGoal > 0 ? Math.min(100, Math.round((dietSummary.carb / carbGoal) * 100)) : 0;
  const fatPercent = fatGoal > 0 ? Math.min(100, Math.round((dietSummary.fat / fatGoal) * 100)) : 0;


  useEffect(() => {
    const checkAutoRefresh = async () => {
      if (document.visibilityState !== 'visible') return;
      // 如果已经有推荐数据，不再自动刷新
      if (aiData?.recommend_list?.length > 0) return;
      
      const lastTime = parseInt(localStorage.getItem('moveat_ai_auto_refresh_time') || '0');
      if (Date.now() - lastTime > 10 * 60 * 1000) {
        if (!aiLoading) {
          try {
            localStorage.setItem('moveat_ai_auto_refresh_time', String(Date.now()));
            await refreshRef.current();
          } catch (err) {
            console.error('自动刷新失败:', err);
          }
        }
      }
    };
    checkAutoRefresh();
    document.addEventListener('visibilitychange', checkAutoRefresh);
    return () => document.removeEventListener('visibilitychange', checkAutoRefresh);
  }, [aiLoading, aiData]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      localStorage.setItem('moveat_ai_auto_refresh_time', String(Date.now()));
      await refresh();
      await refreshAnalysis();
      setShowFoodCard(false);
      localStorage.removeItem('moveat_show_food_card');
      toast.success('数据已更新');
    } catch {
      toast.error('刷新失败，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateFood = async () => {
    if (aiLoading || isRefreshing) return;
    setShowFoodCard(true);
    localStorage.setItem('moveat_show_food_card', 'true');
    
    // 如果已经有推荐数据，直接使用缓存，不再请求
    if (aiData?.recommend_list?.length > 0) {
      return;
    }
    
    setFoodRefreshing(true);
    try {
      await refreshAnalysis();
    } catch {
      toast.error('生成失败，请重试');
    } finally {
      setFoodRefreshing(false);
    }
  };

  const handleFoodRefresh = async () => {
    if (foodRefreshing) return;
    setFoodRefreshing(true);
    try {
      await refreshAnalysis();
      toast.success('推荐已更新');
    } catch {
      toast.error('刷新失败，请重试');
    } finally {
      setFoodRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 py-6 pb-24">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{greeting.text}，Moveat用户</p>
        <h1 className="text-2xl font-bold">{greeting.title}</h1>
      </header>

      <HomeStats calories={calories} steps={steps} />

      <Card className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell size={18} />
              <span className="font-medium">AI 今日身体状态</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              aria-label="刷新数据"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-sm text-white/90 mb-4">
            {isRefreshing ? '正在重新分析你的数据...' : (aiData?.daily_summary || `你今天进行了${cardioMinutes}分钟有氧训练、${strengthMinutes}分钟力量训练，累计消耗${calories}千卡。`)}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>蛋白质</span>
              <span>{dietSummary.protein}g / {proteinGoal}g</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${proteinPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span>碳水</span>
              <span>{dietSummary.carb}g / {carbGoal}g</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${carbPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span>脂肪</span>
              <span>{dietSummary.fat}g / {fatGoal}g</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>
          {totalTraining > 0 ? (
            <div className="mt-4 pt-3 border-t border-white/20 text-xs text-white/90">
              今日运动时长：{cardioMinutes}分钟（有氧）/{strengthMinutes}分钟（无氧）
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-white/20 text-xs text-white/90">
              今日运动时长：0分钟
            </div>
          )}
          {dietSummary?.calorie > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/90 leading-relaxed">
              今日已摄入 {intakeCalories} kcal，蛋白质 {dietSummary.protein}g、碳水 {dietSummary.carb}g、脂肪 {dietSummary.fat}g。
              {proteinGoal > dietSummary.protein && ` 还需补充蛋白质 ${proteinGoal - dietSummary.protein}g。`}
              {carbGoal > dietSummary.carb && ` 还需补充碳水 ${carbGoal - dietSummary.carb}g。`}
              {fatGoal > dietSummary.fat && ` 还需补充脂肪 ${fatGoal - dietSummary.fat}g。`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">热量缺口</span>
            <span className={`font-bold ${netCalories > 0 ? 'text-emerald-600' : netCalories < 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {netCalories > 0 ? `还可摄入 ${netCalories}` : netCalories < 0 ? `已超标 ${-netCalories}` : '已达标'} kcal
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            {aiData?.heat_analysis || `${goalInfo.label}：${goalInfo.desc}`}
          </div>
          {intakeCalories > 0 && (
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              今日目标 {calorieGoal} kcal，已摄入 {intakeCalories} kcal，运动消耗 {calories} kcal
            </div>
          )}
        </CardContent>
      </Card>

      <h3 className="font-bold mb-3">AI 今日饮食建议</h3>
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {aiData?.ai_tip || getFallbackAdvice(currentHour, dietSummary, nutritionGoals)}
          </p>
          {!showFoodCard ? (
            <Button
              onClick={handleGenerateFood}
              disabled={aiLoading}
              className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
            >
              {aiLoading ? 'AI分析中...' : '一键生成今日专属外卖'}
            </Button>
          ) : aiLoading && !aiData?.recommend_list?.[0] ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              <span className="text-sm text-muted-foreground">AI正在根据你的实时数据生成专属推荐...</span>
            </div>
          ) : (
            <FoodRecommendCard
              food={aiData?.recommend_list?.[0]}
              onRefresh={handleFoodRefresh}
              refreshing={foodRefreshing || aiLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
