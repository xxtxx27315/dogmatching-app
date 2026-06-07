-- =============================================
-- わんとも MVP - Supabase Schema
-- =============================================
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. profiles（犬プロフィール）
-- =============================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  dog_name        text not null default '名無しわんこ',
  breed           text,                        -- 犬種
  age_years       int,                         -- 年齢
  size            text check (size in ('small','medium','large')),
  personality     text[] default '{}',         -- 性格タグ
  bio             text,
  avatar_url      text,
  location        text,                        -- 居住エリア（都道府県）
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =============================================
-- 2. likes（いいね）
-- =============================================
create table public.likes (
  id          uuid primary key default uuid_generate_v4(),
  from_dog    uuid not null references public.profiles(id) on delete cascade,
  to_dog      uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (from_dog, to_dog),
  check (from_dog <> to_dog)
);

-- =============================================
-- 3. matches（マッチング）
-- =============================================
create table public.matches (
  id          uuid primary key default uuid_generate_v4(),
  dog1_id     uuid not null references public.profiles(id) on delete cascade,
  dog2_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (dog1_id, dog2_id),
  check (dog1_id < dog2_id)
);

-- =============================================
-- 4. messages（チャット）
-- =============================================
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- =============================================
-- 5. posts（タイムライン投稿）
-- =============================================
create table public.posts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  image_url   text,
  created_at  timestamptz default now()
);

-- =============================================
-- 6. post_likes（投稿へのいいね）
-- =============================================
create table public.post_likes (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- =============================================
-- 7. spots（犬スポット）
-- =============================================
create table public.spots (
  id          uuid primary key default uuid_generate_v4(),
  posted_by   uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  category    text not null check (category in ('restaurant','cafe','park','shop','hotel','other')),
  prefecture  text,
  address     text,
  note        text,
  image_url   text,
  created_at  timestamptz default now()
);

-- =============================================
-- インデックス
-- =============================================
create index on public.likes (to_dog);
create index on public.likes (from_dog);
create index on public.matches (dog1_id);
create index on public.matches (dog2_id);
create index on public.messages (match_id, created_at desc);
create index on public.posts (user_id, created_at desc);
create index on public.spots (category);

-- =============================================
-- updated_at トリガー
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- =============================================
-- 新規ユーザー時プロフィール自動作成
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, dog_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'dog_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'dog_name', '名無しわんこ')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- 相互いいねでマッチ自動生成
-- =============================================
create or replace function public.handle_match_on_like()
returns trigger as $$
declare u1 uuid; u2 uuid;
begin
  if exists (
    select 1 from public.likes where from_dog = new.to_dog and to_dog = new.from_dog
  ) then
    u1 := least(new.from_dog, new.to_dog);
    u2 := greatest(new.from_dog, new.to_dog);
    insert into public.matches (dog1_id, dog2_id) values (u1, u2) on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_created
  after insert on public.likes
  for each row execute function public.handle_match_on_like();

-- =============================================
-- RLS
-- =============================================
alter table public.profiles enable row level security;
create policy "プロフィールは全員閲覧可" on public.profiles for select using (is_active = true);
create policy "自分のプロフィールのみ作成可" on public.profiles for insert with check (auth.uid() = id);
create policy "自分のプロフィールのみ更新可" on public.profiles for update using (auth.uid() = id);

alter table public.likes enable row level security;
create policy "自分のいいねのみ閲覧可" on public.likes for select using (auth.uid() = from_dog or auth.uid() = to_dog);
create policy "自分からのいいねのみ作成可" on public.likes for insert with check (auth.uid() = from_dog);
create policy "自分のいいねのみ削除可" on public.likes for delete using (auth.uid() = from_dog);

alter table public.matches enable row level security;
create policy "自分のマッチのみ閲覧可" on public.matches for select using (auth.uid() = dog1_id or auth.uid() = dog2_id);

alter table public.messages enable row level security;
create policy "マッチ参加者のみメッセージ閲覧可" on public.messages for select
  using (exists (select 1 from public.matches where id = messages.match_id and (dog1_id = auth.uid() or dog2_id = auth.uid())));
create policy "マッチ参加者のみメッセージ送信可" on public.messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from public.matches where id = messages.match_id and (dog1_id = auth.uid() or dog2_id = auth.uid())));
create policy "受信者のみ既読更新可" on public.messages for update
  using (auth.uid() != sender_id and exists (select 1 from public.matches where id = messages.match_id and (dog1_id = auth.uid() or dog2_id = auth.uid())))
  with check (is_read = true);

alter table public.posts enable row level security;
create policy "投稿は全員閲覧可" on public.posts for select using (true);
create policy "自分の投稿のみ作成可" on public.posts for insert with check (auth.uid() = user_id);
create policy "自分の投稿のみ削除可" on public.posts for delete using (auth.uid() = user_id);

alter table public.post_likes enable row level security;
create policy "投稿いいねは全員閲覧可" on public.post_likes for select using (true);
create policy "自分の投稿いいねのみ作成可" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "自分の投稿いいねのみ削除可" on public.post_likes for delete using (auth.uid() = user_id);

alter table public.spots enable row level security;
create policy "スポットは全員閲覧可" on public.spots for select using (true);
create policy "ログイン済みのみスポット登録可" on public.spots for insert with check (auth.uid() = posted_by);

-- Storage バケット設定（Dashboardで実行）
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
-- insert into storage.buckets (id, name, public) values ('spots', 'spots', true);
