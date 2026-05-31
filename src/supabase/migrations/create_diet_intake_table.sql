-- 饮食摄入记录表，存储用户每日各餐次的饮食打卡数据
CREATE TABLE IF NOT EXISTS diet_intake (
  id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  meal_period TEXT DEFAULT '',
  food_name TEXT DEFAULT '',
  calorie INT DEFAULT 0,
  protein INT DEFAULT 0,
  carb INT DEFAULT 0,
  fat INT DEFAULT 0,
  image_url TEXT DEFAULT ''
);

-- 关闭行级安全策略，确保应用层能正常读写
ALTER TABLE IF EXISTS public.diet_intake DISABLE ROW LEVEL SECURITY;
