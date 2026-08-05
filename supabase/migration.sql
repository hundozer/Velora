-- ============================================================
-- INTIMO PLATFORM — SUPABASE DATABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Member',
  username TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  member_tier TEXT NOT NULL DEFAULT 'PREMIUM',
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  verification_level TEXT DEFAULT 'LEVEL_3_PROFILE_BIOMETRIC',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  cover_photo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  date_of_birth TEXT,
  age INTEGER DEFAULT 28,
  gender TEXT DEFAULT 'FEMALE',
  sexual_orientation TEXT DEFAULT 'BISEXUAL',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  location TEXT DEFAULT '',
  languages JSONB DEFAULT '["English"]'::jsonb,
  headline TEXT DEFAULT 'Intimo Member',
  bio TEXT DEFAULT 'Private member profile.',
  interests JSONB DEFAULT '["Discreet Encounters", "Fine Dining"]'::jsonb,
  lifestyle_tags JSONB DEFAULT '["Luxury Lifestyle"]'::jsonb,
  hobbies JSONB DEFAULT '[]'::jsonb,
  relationship_status TEXT DEFAULT 'SINGLE',
  looking_for JSONB DEFAULT '["Connections"]'::jsonb,
  is_couple_profile BOOLEAN DEFAULT false,
  partner_display_name TEXT,
  partner_age INTEGER,
  partner_gender TEXT,
  pubic_hair_grooming TEXT,
  piercing TEXT,
  tattoo TEXT,
  erogenous_zones JSONB DEFAULT '[]'::jsonb,
  favourite_sex_places JSONB DEFAULT '[]'::jsonb,
  favourite_sex_positions JSONB DEFAULT '[]'::jsonb,
  sex_hobbies JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  monthly_subscription_price NUMERIC,
  followers_count INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  total_content_count INTEGER DEFAULT 0,
  public_profile_visibility BOOLEAN DEFAULT true,
  photo_visibility_default TEXT DEFAULT 'PUBLIC',
  location_precision TEXT DEFAULT 'CITY',
  show_online_status BOOLEAN DEFAULT true,
  show_distance BOOLEAN DEFAULT true,
  allow_direct_messages BOOLEAN DEFAULT true,
  require_verification_to_message BOOLEAN DEFAULT false,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================
-- 2. DATING ADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dating_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  is_verified BOOLEAN DEFAULT true,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  photo_url TEXT,
  validity_days INTEGER DEFAULT 7,
  country TEXT,
  region TEXT,
  allowed_reply_genders JSONB DEFAULT '["♀"]'::jsonb,
  transgender_option TEXT DEFAULT 'Including trans',
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  require_vip BOOLEAN DEFAULT false,
  require_media BOOLEAN DEFAULT false,
  require_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dating_ads_author ON dating_ads(author_id);
CREATE INDEX IF NOT EXISTS idx_dating_ads_status ON dating_ads(status);

-- ============================================================
-- 3. PHOTO ALBUMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  photo_count INTEGER DEFAULT 0,
  monetization TEXT DEFAULT 'FREE',
  credits_price INTEGER,
  category TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'On web',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_albums_owner ON photo_albums(owner_id);

-- ============================================================
-- 4. VIDEOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  monetization TEXT DEFAULT 'FREE',
  credits_price INTEGER,
  category TEXT,
  comment_permission TEXT DEFAULT 'ANYONE',
  voting_permission TEXT DEFAULT 'ANYONE',
  topics JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'On web',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner_id);

-- ============================================================
-- 5. CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  sender_gender TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

-- ============================================================
-- 6. CONNECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'follow',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, followed_id, connection_type)
);

CREATE INDEX IF NOT EXISTS idx_connections_follower ON connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_followed ON connections(followed_id);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_name TEXT,
  actor_avatar TEXT,
  target_link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================================
-- 8. DIRECT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  attachment_type TEXT,
  is_disappearing BOOLEAN DEFAULT false,
  disappear_timer_sec INTEGER,
  is_opened BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'SENT',
  is_locked BOOLEAN DEFAULT false,
  unlock_price NUMERIC,
  is_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dating_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Permissive policies (anon key access for MVP — tighten with auth later)
CREATE POLICY "Allow all select on profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on profiles" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Allow all select on dating_ads" ON dating_ads FOR SELECT USING (true);
CREATE POLICY "Allow all insert on dating_ads" ON dating_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on dating_ads" ON dating_ads FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on dating_ads" ON dating_ads FOR DELETE USING (true);

CREATE POLICY "Allow all select on photo_albums" ON photo_albums FOR SELECT USING (true);
CREATE POLICY "Allow all insert on photo_albums" ON photo_albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on photo_albums" ON photo_albums FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on photo_albums" ON photo_albums FOR DELETE USING (true);

CREATE POLICY "Allow all select on videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Allow all insert on videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on videos" ON videos FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on videos" ON videos FOR DELETE USING (true);

CREATE POLICY "Allow all select on chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow all insert on chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all select on connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Allow all insert on connections" ON connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on connections" ON connections FOR DELETE USING (true);

CREATE POLICY "Allow all select on notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow all insert on notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on notifications" ON notifications FOR UPDATE USING (true);

CREATE POLICY "Allow all select on direct_messages" ON direct_messages FOR SELECT USING (true);
CREATE POLICY "Allow all insert on direct_messages" ON direct_messages FOR INSERT WITH CHECK (true);

-- DONE!
