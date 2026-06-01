import { useState, useEffect, useRef, useCallback } from 'react';
import { useHomeData } from './useHomeData';
import { analyzeUserData } from '@/lib/glm';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr } from '@/lib/date';

const DEFAULT_RESULT = {
  daily_summary: '',
  heat_analysis: '',
  nutrition_suggest: '',
  ai_tip: '',
  recommend_list: [],
};

// ============ 通用工具函数 ============

const getToday = () => getLocalDateStr();

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__date === getToday()) {
      return parsed.data;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ __date: getToday(), data }));
  } catch (e) {
    console.warn('localStorage 写入失败:', e);
  }
};

const buildDefaultContext = (today) => ({
  user_profile: {
    height: 175,
    weight: 70,
    age: 25,
    gender: '男',
    goal: 'maintain',
    diet_preference: '中餐',
    forbidden_food: '',
    sport_frequency: '3-4次',
  },
  today_activity: {
    date: today,
    steps: 0,
    calories_burned: 0,
    cardio_minutes: 0,
    strength_minutes: 0,
  },
  today_diet: { calorie: 0, protein: 0, carb: 0, fat: 0 },
  today_diet_logs: [],
  nutrition_goals: {
    calorieGoal: 2200,
    proteinGoal: 140,
    carbGoal: 250,
    fatGoal: 70,
  },
  nutrition_gaps: {
    calorie: 2200,
    protein: 140,
    carb: 250,
    fat: 70,
  },
  current_hour: new Date().getHours(),
});

// ============ 首页专用 Hook ============

const HOME_CACHE_KEY = 'moveat_ai_home_default';

export const useHomeAiAnalysis = () => {
  const { structuredJson, refresh: refreshHomeData } = useHomeData();

  const [aiData, setAiData] = useState(() => readCache(HOME_CACHE_KEY) || DEFAULT_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  const abortRef = useRef(null);

  // 自动加载（有缓存不请求）
  useEffect(() => {
    const cached = readCache(HOME_CACHE_KEY);
    if (cached?.recommend_list?.length > 0) {
      setAiData(cached);
      fetchedRef.current = true;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    const doFetch = async () => {
      setLoading(true);
      try {
        const today = getToday();
        const context = structuredJson || buildDefaultContext(today);
        const result = await analyzeUserData(context, null, controller.signal);
        if (controller.signal.aborted) return;
        const merged = { ...DEFAULT_RESULT, ...result };
        if (!Array.isArray(merged.recommend_list)) merged.recommend_list = [];
        setAiData(merged);
        writeCache(HOME_CACHE_KEY, merged);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('首页AI分析失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    doFetch();

    return () => controller.abort();
  }, [structuredJson]);

  // 手动刷新
  const refreshAnalysis = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const latest = await refreshHomeData();
      const context = { ...(latest?.structuredJson || structuredJson || buildDefaultContext(getToday())) };
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
      const result = await analyzeUserData(context, null, controller.signal);
      if (controller.signal.aborted) return;
      const merged = { ...DEFAULT_RESULT, ...result };
      if (!Array.isArray(merged.recommend_list)) merged.recommend_list = [];
      setAiData(merged);
      writeCache(HOME_CACHE_KEY, merged);
      return merged;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('首页AI刷新失败:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [structuredJson, refreshHomeData]);

  return { aiData, loading, error, refreshAnalysis };
};

// ============ 外卖推荐页专用 Hook ============

const RECOMMEND_MODES = ['default', '低卡模式', '高蛋白模式'];
const getRecommendCacheKey = (mode) => `moveat_ai_recommend_${mode}`;

export const useRecommendAiAnalysis = () => {
  const { structuredJson, refresh: refreshHomeData } = useHomeData();

  // 各模式独立数据
  const [dataMap, setDataMap] = useState(() => {
    const map = {};
    RECOMMEND_MODES.forEach((m) => {
      map[m] = readCache(getRecommendCacheKey(m)) || DEFAULT_RESULT;
    });
    return map;
  });

  // 各模式独立 loading
  const [loadingMap, setLoadingMap] = useState(() => {
    const map = {};
    RECOMMEND_MODES.forEach((m) => (map[m] = false));
    return map;
  });

  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('default');

  const fetchedRef = useRef({});
  const abortRef = useRef(null);

  // 当前模式的数据和 loading
  const aiData = dataMap[activeMode] || DEFAULT_RESULT;
  const loading = loadingMap[activeMode] || false;

  // 切换模式（只切换，不自动请求）
  const switchMode = useCallback((mode) => {
    setActiveMode(mode);
  }, []);

  // 自动加载当前模式（有缓存不请求）
  useEffect(() => {
    const cached = readCache(getRecommendCacheKey(activeMode));
    if (cached?.recommend_list?.length > 0) {
      setDataMap((prev) => ({ ...prev, [activeMode]: cached }));
      fetchedRef.current[activeMode] = true;
      return;
    }
    if (fetchedRef.current[activeMode]) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const doFetch = async (retryCount = 0) => {
      setLoadingMap((prev) => ({ ...prev, [activeMode]: true }));
      try {
        const today = getToday();
        const context = structuredJson || buildDefaultContext(today);
        const modeParam = activeMode === 'default' ? null : activeMode;
        const result = await analyzeUserData(context, modeParam, controller.signal);
        if (controller.signal.aborted) return;
        const merged = { ...DEFAULT_RESULT, ...result };
        if (!Array.isArray(merged.recommend_list)) merged.recommend_list = [];
        setDataMap((prev) => ({ ...prev, [activeMode]: merged }));
        writeCache(getRecommendCacheKey(activeMode), merged);
        fetchedRef.current[activeMode] = true;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('推荐页AI分析失败:', err);
        setError(err.message);
        // 自动重试，最多3次
        if (retryCount < 3) {
          setTimeout(() => {
            if (!controller.signal.aborted) {
              doFetch(retryCount + 1);
            }
          }, 2000 * (retryCount + 1));
          return;
        }
        // 重试用尽，标记为已尝试（允许后续手动刷新）
        fetchedRef.current[activeMode] = true;
      } finally {
        // 只有在不重试时才关闭 loading
        if (fetchedRef.current[activeMode]) {
          setLoadingMap((prev) => ({ ...prev, [activeMode]: false }));
        }
      }
    };

    doFetch();

    return () => controller.abort();
  }, [activeMode, structuredJson]);

  // 手动刷新指定模式（默认当前模式）
  const refreshAnalysis = useCallback(
    async (mode = null) => {
      const targetMode = mode || activeMode;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingMap((prev) => ({ ...prev, [targetMode]: true }));
      setError(null);

      try {
        const latest = await refreshHomeData();
        const context = { ...(latest?.structuredJson || structuredJson || buildDefaultContext(getToday())) };
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
        const modeParam = targetMode === 'default' ? null : targetMode;
        const result = await analyzeUserData(context, modeParam, controller.signal);
        if (controller.signal.aborted) return;
        const merged = { ...DEFAULT_RESULT, ...result };
        if (!Array.isArray(merged.recommend_list)) merged.recommend_list = [];
        setDataMap((prev) => ({ ...prev, [targetMode]: merged }));
        writeCache(getRecommendCacheKey(targetMode), merged);

        // 保存到数据库
        const today = getToday();
        const guestId = localStorage.getItem('moveat_guest_id');
        if (!guestId) {
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
              await supabase.from('recommendation_logs').update(payload).eq('id', existing.id);
            } else {
              await supabase.from('recommendation_logs').insert(payload);
            }
          }
        }

        return merged;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('推荐页AI刷新失败:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoadingMap((prev) => ({ ...prev, [targetMode]: false }));
      }
    },
    [activeMode, structuredJson, refreshHomeData]
  );

  return { aiData, loading, error, refreshAnalysis, switchMode, activeMode };
};
