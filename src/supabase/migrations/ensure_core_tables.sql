-- 严格定义并确保三张核心业务表结构完整
-- 包含：users（用户档案）、activity_logs（每日运动数据）、recommendation_logs（AI 推荐记录）

DO $$
BEGIN
  -- 【表1：users 用户表】
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE users (
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
  END IF;

  -- 【表2：activity_logs 每日运动数据表】
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    CREATE TABLE activity_logs (
      id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      steps INT DEFAULT 0,
      calories_burned INT DEFAULT 0,
      cardio_minutes INT DEFAULT 0,
      strength_minutes INT DEFAULT 0
    );
  END IF;

  -- 【表3：recommendation_logs AI推荐记录表】
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'recommendation_logs'
  ) THEN
    CREATE TABLE recommendation_logs (
      id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      summary TEXT DEFAULT '',
      nutrition_focus TEXT DEFAULT '',
      recommend_food TEXT DEFAULT '',
      recommend_reason TEXT DEFAULT '',
      meal_type TEXT DEFAULT ''
    );
  END IF;
END $$;

-- 如果表已存在，补充可能缺失的字段（防历史迁移文件字段不全）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'cardio_minutes'
    ) THEN
      ALTER TABLE public.activity_logs ADD COLUMN cardio_minutes INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'strength_minutes'
    ) THEN
      ALTER TABLE public.activity_logs ADD COLUMN strength_minutes INT DEFAULT 0;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'recommendation_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'recommendation_logs' AND column_name = 'nutrition_focus'
    ) THEN
      ALTER TABLE public.recommendation_logs ADD COLUMN nutrition_focus TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'recommendation_logs' AND column_name = 'recommend_food'
    ) THEN
      ALTER TABLE public.recommendation_logs ADD COLUMN recommend_food TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'recommendation_logs' AND column_name = 'recommend_reason'
    ) THEN
      ALTER TABLE public.recommendation_logs ADD COLUMN recommend_reason TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'recommendation_logs' AND column_name = 'meal_type'
    ) THEN
      ALTER TABLE public.recommendation_logs ADD COLUMN meal_type TEXT DEFAULT '';
    END IF;
  END IF;
END $$;

-- 关闭行级安全策略（RLS），确保应用层在已认证情况下能正常读写用户专属数据
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recommendation_logs DISABLE ROW LEVEL SECURITY;
