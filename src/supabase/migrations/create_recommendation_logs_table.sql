-- AI 推荐记录表，存储每日身体状态总结与外卖推荐
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  summary TEXT DEFAULT '',
  nutrition_focus TEXT DEFAULT '',
  recommend_food TEXT DEFAULT '',
  recommend_reason TEXT DEFAULT '',
  meal_type TEXT DEFAULT ''
);
