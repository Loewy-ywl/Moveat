import { createClient } from '@supabase/supabase-js';

// NoCode 平台专属 Supabase 已失效，请替换为你自己的 Supabase 配置
// 1. 访问 https://supabase.com/ 创建项目
// 2. 在项目设置 → API 中获取 URL 和 Anon Key

// 方式一：直接填写配置（适合本地开发）
const SUPABASE_URL = "https://vlbsnvsiakbgftepfedd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsYnNudnNpYWtiZ2Z0ZXBmZWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDg4MDgsImV4cCI6MjA5NTQyNDgwOH0.ezgrXl4ARI8jPVuXtdoeEtUuhXZ17KtlpH5jYNhLpj0";

// 方式二：使用环境变量（推荐）
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

