-- 创建 moveat storage bucket 用于存储饮食记录图片
-- 在 Supabase SQL Editor 中执行

-- 1. 创建 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('moveat', 'moveat', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置 bucket 为公开（允许匿名访问图片）
UPDATE storage.buckets
SET public = true
WHERE id = 'moveat';

-- 3. 先删除已存在的策略（避免重复创建报错）
DROP POLICY IF EXISTS "Allow all uploads to moveat bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from moveat bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to moveat bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from moveat bucket" ON storage.objects;

-- 4. 允许所有用户上传图片
CREATE POLICY "Allow all uploads to moveat bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'moveat');

-- 5. 允许所有用户读取图片
CREATE POLICY "Allow all reads from moveat bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'moveat');

-- 6. 允许所有用户更新图片
CREATE POLICY "Allow all updates to moveat bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'moveat');

-- 7. 允许所有用户删除图片
CREATE POLICY "Allow all deletes from moveat bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'moveat');
