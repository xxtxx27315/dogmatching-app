-- =============================================
-- テスト用ダミーユーザー作成
-- Supabase SQL Editorで実行してください
-- =============================================

-- auth.usersにテストユーザーを追加
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES
(
  gen_random_uuid(),
  'test-user-a@spark.app',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"display_name":"さくら","birth_date":"1998-05-15","gender":"female","username":"sakura_test"}',
  'authenticated',
  'authenticated'
),
(
  gen_random_uuid(),
  'test-user-b@spark.app',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"display_name":"たくみ","birth_date":"1996-03-20","gender":"male","username":"takumi_test"}',
  'authenticated',
  'authenticated'
),
(
  gen_random_uuid(),
  'test-user-c@spark.app',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"display_name":"みおな","birth_date":"2000-08-10","gender":"female","username":"miona_test"}',
  'authenticated',
  'authenticated'
);

-- ※ profilesテーブルはトリガーで自動作成されます
-- 自己紹介とタグを追加
UPDATE public.profiles SET
  bio = '映画と旅行が大好きです。週末はカフェ巡りをしています☕',
  prefecture = '東京都',
  tags = ARRAY['映画', '旅行', 'カフェ', '料理']
WHERE username = 'sakura_test';

UPDATE public.profiles SET
  bio = 'スポーツ全般が好きで、特にサッカーとテニスをよくやります。アウトドア派です！',
  prefecture = '大阪府',
  tags = ARRAY['スポーツ', 'サッカー', 'テニス', 'アウトドア']
WHERE username = 'takumi_test';

UPDATE public.profiles SET
  bio = '音楽が好きで、ピアノを弾いています🎹 読書も趣味で小説をよく読みます。',
  prefecture = '神奈川県',
  tags = ARRAY['音楽', 'ピアノ', '読書', '映画']
WHERE username = 'miona_test';
