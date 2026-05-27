-- AI 聊天记录表，存储用户与 AI 的对话消息
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 关闭行级安全策略，确保应用层能正常读写
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;
