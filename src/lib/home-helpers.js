export const getGoalInfo = (goal) => {
  const map = {
    fat_loss: { label: '减脂', desc: '热量缺口，利于燃脂', advice: '晚餐建议摄入 25g 蛋白质和适量慢碳，避免高脂食物影响恢复。' },
    muscle_gain: { label: '增肌', desc: '热量盈余，利于增肌', advice: '晚餐建议摄入 40g 蛋白质和足量碳水，促进肌肉合成恢复。' },
    maintain: { label: '保持体型', desc: '热量平衡，利于维持当前体型', advice: '晚餐建议均衡摄入蛋白质与碳水，保持当前良好的身体状态。' },
  };
  return map[goal] || map.fat_loss;
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return { text: '夜深了，Moveat提醒你注意休息', title: '注意休息 🌙' };
  if (hour >= 6 && hour < 12) return { text: '早上好，开启元气满满的一天', title: '早上好 ☀️' };
  if (hour >= 12 && hour < 18) return { text: '下午好，今天也要保持状态', title: '保持状态 💪' };
  return { text: '晚上好，今天状态不错', title: '今天状态不错 💪' };
};

export const getFallbackAdvice = (hour, diet, goals) => {
  const gapCal = (goals?.calorieGoal || 0) - (diet?.calorie || 0);
  const gapPro = (goals?.proteinGoal || 0) - (diet?.protein || 0);
  if (hour >= 0 && hour < 6) {
    return '当前时间较晚，若需加餐可选择清淡高蛋白的食物，避免加重肠胃负担。';
  }
  if (hour >= 6 && hour < 12) {
    return `早上好，${diet?.calorie > 0 ? `你已摄入 ${diet.calorie} kcal，` : ''}建议早餐补充优质蛋白和适量碳水，开启元气满满的一天。`;
  }
  if (hour >= 12 && hour < 18) {
    return `下午好，${diet?.calorie > 0 ? `今日已摄入 ${diet.calorie} kcal，` : ''}午餐/下午茶建议关注蛋白质和膳食纤维，保持下午工作状态。`;
  }
  return `晚上好，${diet?.calorie > 0 ? `今日已摄入 ${diet.calorie} kcal，` : ''}热量${gapCal > 0 ? `还可摄入 ${gapCal} kcal` : `已超标 ${-gapCal} kcal`}，建议晚餐${gapPro > 0 ? `补充 ${gapPro}g 蛋白质` : '控制热量摄入'}，避免高脂食物影响恢复。`;
};
