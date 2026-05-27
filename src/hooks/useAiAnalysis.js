import { useState, useEffect, useRef, useCallback } from 'react';
import { useHomeData } from './useHomeData';
import { analyzeUserData } from '@/lib/glm';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr } from '@/lib/date';

const CACHE_KEY = 'moveat_ai_analysis';
const CACHE_DATE_KEY = 'moveat_ai_analysis_date';

const DEFAULT_RESULT = {
  daily_summary: '你今天进行了有氧运动和力量训练，整体运动消耗充足，状态不错。',
  heat_analysis: '当前热量缺口约-320kcal，符合减脂节奏，继续保持。',
  nutrition_suggest: '建议优先补充优质蛋白，适量摄入慢碳，控制脂肪摄入。',
  ai_tip: '根据你今天的运动表现，晚餐建议摄入25g蛋白质和适量慢碳，避免高脂食物影响恢复。',
  recommend_list: [
    { food_name: '低卡蔬菜沙拉轻食', food_type: '轻食', heat: '280', nutrition_ratio: '20g/25g/8g', reason: '低卡清爽，适合控制热量摄入的晚餐选择。' },
    { food_name: '高蛋白鸡胸肉健身餐', food_type: '健身餐', heat: '450', nutrition_ratio: '40g/35g/12g', reason: '高蛋白低脂组合，帮助运动后肌肉恢复。' },
    { food_name: '清淡海鲜粥品简餐', food_type: '简餐', heat: '320', nutrition_ratio: '18g/45g/6g', reason: '清淡易消化，适合晚上食用且不会加重肠胃负担。' },
  ],
};

export const useAiAnalysis = () => {
  const { structuredJson, refresh: refreshHomeData } = useHomeData();
  const [aiData, setAiData] = useState(DEFAULT_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!structuredJson?.user_profile && !localStorage.getItem('moveat_guest_id')) {
      setAiData(DEFAULT_RESULT);
      hasFetchedRef.current = false;
      return;
    }

    const today = getLocalDateStr();
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached && cachedDate === today) {
      try {
        setAiData(JSON.parse(cached));
        hasFetchedRef.current = true;
        return;
      } catch {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_DATE_KEY);
      }
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await analyzeUserData(structuredJson);
        const merged = { ...DEFAULT_RESULT, ...result };
        if (!Array.isArray(merged.recommend_list)) {
          merged.recommend_list = DEFAULT_RESULT.recommend_list;
        }
        setAiData(merged);
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        localStorage.setItem(CACHE_DATE_KEY, today);
      } catch (err) {
        console.error('AI分析失败:', err);
        setError(err.message);
        setAiData(DEFAULT_RESULT);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [structuredJson]);

  const refreshAnalysis = useCallback(async (mode = null) => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const latest = await refreshHomeData();
      const context = { ...(latest?.structuredJson || structuredJson) };
      if (!context.nutrition_gaps && context.today_diet && context.nutrition_goals) {
        const g = context.nutrition_goals;
        const d = context.today_diet;
        context.nutrition_gaps = {
          calorie: (g.calorieGoal || 0) - (d.calorie || 0),
          protein: (g.proteinGoal || 0) - (d.protein || 0),
          carb: (g.carbGoal || 0) - (d.carb || 0),
          fat: (g.fatGoal || 0) - (d.fat || 0),
        };
      }

      if (!context?.user_profile && !localStorage.getItem('moveat_guest_id')) {
        throw new Error('用户档案数据不完整');
      }

      const today = getLocalDateStr();
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_DATE_KEY);

      const result = await analyzeUserData(context, mode);
      const merged = { ...DEFAULT_RESULT, ...result };
      if (!Array.isArray(merged.recommend_list)) {
        merged.recommend_list = DEFAULT_RESULT.recommend_list;
      }

      if (currentId !== requestIdRef.current) return;

      setAiData(merged);
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_DATE_KEY, today);

      const guestId = localStorage.getItem('moveat_guest_id');
      if (guestId) {
        return merged;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from('recommendation_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        const payload = {
          user_id: user.id,
          date: today,
          summary: merged.daily_summary || '',
          nutrition_focus: merged.nutrition_suggest || '',
          recommend_food: JSON.stringify(merged.recommend_list || []),
          recommend_reason: merged.ai_tip || '',
          meal_type: merged.recommend_list?.[0]?.food_type || '',
        };

        if (existing) {
          const { error: updateError } = await supabase.from('recommendation_logs').update(payload).eq('id', existing.id);
          if (updateError) console.error('更新推荐记录失败:', updateError);
        } else {
          const { error: insertError } = await supabase.from('recommendation_logs').insert(payload);
          if (insertError) console.error('插入推荐记录失败:', insertError);
        }
      }

      return merged;
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      console.error('AI分析刷新失败:', err);
      setError(err.message);
      throw err;
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [structuredJson, refreshHomeData]);

  return { aiData, loading, error, refreshAnalysis };
};
