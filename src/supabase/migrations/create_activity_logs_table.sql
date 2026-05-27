-- 每日运动数据表，按用户与日期区分独立记录
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  steps INT DEFAULT 0,
  calories_burned INT DEFAULT 0,
  cardio_minutes INT DEFAULT 0,
  strength_minutes INT DEFAULT 0
);
