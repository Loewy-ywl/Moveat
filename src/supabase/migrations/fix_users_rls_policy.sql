-- 修复用户档案保存失败问题
-- 原因：Supabase 默认对新表开启行级安全策略(RLS)，未配置策略时会导致已登录用户也无法写入
-- 操作：确保 users 表存在，并关闭该表的 RLS，使应用层能正常读写用户档案

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

-- 禁用 users 表的行级安全策略，允许正常读写
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
