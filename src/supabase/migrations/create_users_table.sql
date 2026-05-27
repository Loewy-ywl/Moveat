-- 用户基础档案表，与 Supabase Auth 账号一对一绑定
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  name TEXT DEFAULT '',
  height INT DEFAULT 0,
  weight INT DEFAULT 0,
  age INT DEFAULT 0,
  gender TEXT DEFAULT '',
  goal TEXT DEFAULT 'maintain',
  diet_preference TEXT DEFAULT '',
  forbidden_food TEXT DEFAULT '',
  sport_frequency TEXT DEFAULT ''
);
