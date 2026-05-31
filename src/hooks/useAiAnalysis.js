import { useState, useEffect, useRef, useCallback } from 'react';
import { useHomeData } from './useHomeData';
import { analyzeUserData } from '@/lib/glm';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr } from '@/lib/date';

const CACHE_KEY = 'moveat_ai_analysis';
const CACHE_DATE_KEY = 'moveat_ai_analysis_date';

const DEFAULT_RESULT = {
  daily_summary: '',
  heat_analysis: '',
  nutrition_suggest: '',
  ai_tip: '',
  recommend_list: [],
};

// 全局状态，跨组件共享刷新状态
let globalRefreshing = false;

export const useAiAnalysis = () => {
  const { structuredJson, refresh: refreshHomeData } = useHomeData();
  const [aiData, setAiData] = useState(() => {
    // 初始化时立刻读取缓存
    const today = getLocalDateStr();
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && cachedDate === today) {
      try {
        return JSON.parse(cached);
      } catch {
        return DEFAULT_RESULT;
      }
    }
    return DEFAULT_RESULT;
  });
  const [loading, setLoading] = useState(globalRefreshing);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const today = getLocalDateStr();
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const cached = localStorage.getItem(CACHE_KEY);

    // 如果还没有结构化数据，只尝试从缓存恢复，不重置
    if (!structuredJson?.user_profile && !localStorage.getItem('moveat_guest_id')) {
      // 如果当前没有数据但有缓存，尝试恢复缓存
      const alreadyHasData = aiData?.recommend_list && aiData.recommend_list.length > 0;
      if (!alreadyHasData && cached && cachedDate === today) {
        try {
          const parsed = JSON.parse(cached);
          setAiData(parsed);
        } catch {
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_DATE_KEY);
        }
      }
      return;
    }

    // 检查当前 aiData 是否已经有推荐列表（避免重复 setState 导致闪烁）
    const alreadyHasData = aiData?.recommend_list && aiData.recommend_list.length > 0;

    // 只有当前没有数据时才设置缓存
    if (!alreadyHasData && cached && cachedDate === today) {
      try {
        const parsed = JSON.parse(cached);
        setAiData(parsed);
        hasFetchedRef.current = true;
      } catch {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_DATE_KEY);
      }
    }

    // 如果全局正在刷新，同步 loading 状态
    if (globalRefreshing) {
      setLoading(true);
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // 后台静默获取，不设置 loading，不阻塞 UI
    const fetchData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await analyzeUserData(structuredJson, null, controller.signal);
        if (controller.signal.aborted) return;
        const merged = { ...DEFAULT_RESULT, ...result };
        if (!Array.isArray(merged.recommend_list)) {
          merged.recommend_list = [];
        }
        setAiData(merged);
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        localStorage.setItem(CACHE_DATE_KEY, today);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('AI分析失败:', err);
        setError(err.message);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [structuredJson]);

  const refreshAnalysis = useCallback(async (mode = null) => {
    const currentId = ++requestIdRef.current;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 设置全局刷新状态
    globalRefreshing = true;
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

      const result = await analyzeUserData(context, mode, controller.signal);
      if (controller.signal.aborted) return;

      const merged = { ...DEFAULT_RESULT, ...result };
      if (!Array.isArray(merged.recommend_list)) {
        merged.recommend_list = [];
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
      if (err.name === 'AbortError') return;
      if (currentId !== requestIdRef.current) return;
      console.error('AI分析刷新失败:', err);
      setError(err.message);
      throw err;
    } finally {
      if (currentId === requestIdRef.current && !abortControllerRef.current?.signal.aborted) {
        globalRefreshing = false;
        setLoading(false);
      }
    }
  }, [structuredJson, refreshHomeData]);

  return { aiData, loading, error, refreshAnalysis };
};
