-- =============================================
-- Storageバケット作成 & ポリシー設定
-- Supabase SQL Editorで実行してください
-- =============================================

-- avatarsバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- 誰でも画像を閲覧できる
CREATE POLICY "avatars_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 自分のフォルダにのみアップロード可
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 自分のファイルのみ更新可
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
