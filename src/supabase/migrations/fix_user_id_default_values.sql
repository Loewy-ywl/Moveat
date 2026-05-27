-- 修复 activity_logs 和 recommendation_logs 表的 user_id 列默认值
-- 目的：移除错误的 gen_random_uuid() 默认值，确保 user_id 必须由应用层传入，与 auth.users.id 保持一致
DO $$
BEGIN
  -- 修正 activity_logs 表
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    ALTER TABLE public.activity_logs ALTER COLUMN user_id DROP DEFAULT;
  END IF;

  -- 修正 recommendation_logs 表
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'recommendation_logs'
  ) THEN
    ALTER TABLE public.recommendation_logs ALTER COLUMN user_id DROP DEFAULT;
  END IF;
END $$;
