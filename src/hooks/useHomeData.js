import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDietLogs } from './useDietLogs';
import { getLocalDateStr } from '@/lib/date';

const MOCK_ACTIVITY = {
  steps: 12000,
  calories_burned: 680,
  cardio_minutes: 45,
  strength_minutes: 30,
};

const calculateNutritionGoals = (profile) => {
  if (!profile) {
    return { calorieGoal: 2000, proteinGoal: 120, carbGoal: 250, fatGoal: 60, bmr: 1600, neat: 1920 };
  }

  const weight = profile.weight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || '男';

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === '女' ? -161 : 5;
  bmr = Math.round(bmr);

  const neat = Math.round(bmr * 1.2);

  const freqMap = { '1-2次': 1.375, '3-4次': 1.55, '5次以上': 1.725 };
  const multiplier = freqMap[profile.sport_frequency] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  const goal = profile.goal;
  if (goal === 'fat_loss') tdee -= 500;
  else if (goal === 'muscle_gain') tdee += 300;

  let proteinGoal;
  if (goal === 'fat_loss') proteinGoal = Math.round(weight * 2.0);
  else if (goal === 'muscle_gain') proteinGoal = Math.round(weight * 2.2);
  else proteinGoal = Math.round(weight * 1.6);

  const fatGoal = Math.round(tdee * 0.25 / 9);
  const carbGoal = Math.round((tdee - proteinGoal * 4 - fatGoal * 9) / 4);

  return {
    calorieGoal: Math.max(tdee, 1200),
    proteinGoal: Math.max(proteinGoal, 50),
    carbGoal: Math.max(carbGoal, 50),
    fatGoal: Math.max(fatGoal, 20),
    bmr,
    neat,
  };
};

const buildDietLogsPayload = (logs) =>
  logs.map((log) => ({
    meal_period: log.meal_period,
    food_name: log.food_name,
    calorie: log.calorie,
    protein: log.protein,
    carb: log.carb,
    fat: log.fat,
  }));

export const useHomeData = () => {
  const [nickname, setNickname] = useState('Moveat 用户');
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [cardioMinutes, setCardioMinutes] = useState(0);
  const [strengthMinutes, setStrengthMinutes] = useState(0);
  const [profile, setProfile] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const { dietLogs, todaySummary, refresh: refreshDiet } = useDietLogs();

  const nutritionGoals = useMemo(() => calculateNutritionGoals(profile), [profile]);
  const dietSummary = useMemo(() => todaySummary(), [todaySummary, dietLogs]);

  const loadData = useCallback(async () => {
    const today = getLocalDateStr();
    const gaps = {
      calorie: nutritionGoals.calorieGoal - dietSummary.calorie,
      protein: nutritionGoals.proteinGoal - dietSummary.protein,
      carb: nutritionGoals.carbGoal - dietSummary.carb,
      fat: nutritionGoals.fatGoal - dietSummary.fat,
    };
    const currentHour = new Date().getHours();
    const guestId = localStorage.getItem('moveat_guest_id');
    if (guestId) {
      const guestActivity = JSON.parse(localStorage.getItem('moveat_guest_activity') || 'null');
      const guestProfile = JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null');
      if (guestActivity && guestActivity.date === today) {
        setActivityLog(guestActivity);
        setSteps(guestActivity.steps ?? 0);
        setCalories(guestActivity.calories_burned ?? 0);
        setCardioMinutes(guestActivity.cardio_minutes ?? 0);
        setStrengthMinutes(guestActivity.strength_minutes ?? 0);
      } else {
        setActivityLog(null);
        setSteps(0);
        setCalories(0);
        setCardioMinutes(0);
        setStrengthMinutes(0);
      }
      setNickname(localStorage.getItem('moveat_guest_name') || '游客用户');
      setProfile(guestProfile);
      return {
        profile: guestProfile,
        activityLog: guestActivity,
        structuredJson: {
          user_profile: guestProfile,
          today_activity: guestActivity && guestActivity.date === today ? guestActivity : { date: today, steps: 0, calories_burned: 0, cardio_minutes: 0, strength_minutes: 0 },
          today_diet: dietSummary,
          today_diet_logs: buildDietLogsPayload(dietLogs),
          nutrition_goals: nutritionGoals,
          nutrition_gaps: gaps,
          current_hour: currentHour,
        },
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData } = await supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
      if (userData) {
        setProfile(userData);
        if (userData.name) setNickname(userData.name);
      }

      const { data: act } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (act) {
        setActivityLog(act);
        setSteps(act.steps ?? 0);
        setCalories(act.calories_burned ?? 0);
        setCardioMinutes(act.cardio_minutes ?? 0);
        setStrengthMinutes(act.strength_minutes ?? 0);
      } else {
        setActivityLog(null);
        setSteps(0);
        setCalories(0);
        setCardioMinutes(0);
        setStrengthMinutes(0);
      }

      const structuredJsonResult = {
        user_profile: userData
          ? {
              height: userData.height,
              weight: userData.weight,
              age: userData.age,
              gender: userData.gender,
              goal: userData.goal,
              diet_preference: userData.diet_preference,
              forbidden_food: userData.forbidden_food,
              sport_frequency: userData.sport_frequency,
            }
          : null,
        today_activity: act
          ? {
              date: act.date,
              steps: act.steps,
              calories_burned: act.calories_burned,
              cardio_minutes: act.cardio_minutes,
              strength_minutes: act.strength_minutes,
            }
          : { date: today, steps: 0, calories_burned: 0, cardio_minutes: 0, strength_minutes: 0 },
        today_diet: dietSummary,
        today_diet_logs: buildDietLogsPayload(dietLogs),
        nutrition_goals: nutritionGoals,
        nutrition_gaps: gaps,
        current_hour: currentHour,
      };

      return { profile: userData, activityLog: act, structuredJson: structuredJsonResult };
    } catch (err) {
      console.error('加载首页数据出错:', err);
      return null;
    }
  }, [dietSummary, nutritionGoals, dietLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleDietUpdate = () => {
      refreshDiet();
    };
    window.addEventListener('moveat-diet-update', handleDietUpdate);
    return () => window.removeEventListener('moveat-diet-update', handleDietUpdate);
  }, [refreshDiet]);

  const saveNickname = async (val) => {
    const name = val.trim() || 'Moveat 用户';
    setNickname(name);
    localStorage.setItem('moveat_nickname', name);
    if (localStorage.getItem('moveat_guest_id')) {
      localStorage.setItem('moveat_guest_name', name);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('users').update({ name }).eq('user_id', user.id);
    } catch (err) {
      console.error('保存昵称失败:', err);
    }
  };

  const refresh = useCallback(async () => {
    const freshDietLogs = await refreshDiet();
    const freshDietSummary = freshDietLogs.reduce(
      (acc, log) => ({
        calorie: acc.calorie + (log.calorie || 0),
        protein: acc.protein + (log.protein || 0),
        carb: acc.carb + (log.carb || 0),
        fat: acc.fat + (log.fat || 0),
      }),
      { calorie: 0, protein: 0, carb: 0, fat: 0 }
    );
    const result = await loadData();
    const goals = result?.structuredJson?.nutrition_goals || nutritionGoals;
    const hour = new Date().getHours();
    const gaps = {
      calorie: (goals?.calorieGoal || 0) - freshDietSummary.calorie,
      protein: (goals?.proteinGoal || 0) - freshDietSummary.protein,
      carb: (goals?.carbGoal || 0) - freshDietSummary.carb,
      fat: (goals?.fatGoal || 0) - freshDietSummary.fat,
    };
    return {
      ...result,
      structuredJson: {
        ...result?.structuredJson,
        today_diet: freshDietSummary,
        today_diet_logs: buildDietLogsPayload(freshDietLogs),
        nutrition_gaps: gaps,
        current_hour: hour,
      },
    };
  }, [loadData, refreshDiet, nutritionGoals]);

  const structuredJson = useMemo(() => ({
    user_profile: profile,
    today_activity: activityLog || { date: getLocalDateStr(), steps: 0, calories_burned: 0, cardio_minutes: 0, strength_minutes: 0 },
    today_diet: dietSummary,
    today_diet_logs: buildDietLogsPayload(dietLogs),
    nutrition_goals: nutritionGoals,
    nutrition_gaps: {
      calorie: nutritionGoals.calorieGoal - dietSummary.calorie,
      protein: nutritionGoals.proteinGoal - dietSummary.protein,
      carb: nutritionGoals.carbGoal - dietSummary.carb,
      fat: nutritionGoals.fatGoal - dietSummary.fat,
    },
    current_hour: new Date().getHours(),
  }), [profile, activityLog, dietSummary, nutritionGoals, dietLogs]);

  return {
    nickname,
    setNickname,
    steps,
    calories,
    cardioMinutes,
    strengthMinutes,
    profile,
    activityLog,
    structuredJson,
    dietLogs,
    dietSummary,
    nutritionGoals,
    saveNickname,
    refresh,
  };
};
