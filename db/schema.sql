-- PostgreSQL DDL Script for Velora Architecture

CREATE TYPE user_role AS ENUM ('MEMBER', 'CREATOR', 'COUPLE', 'ADMIN');
CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'TRANSGENDER', 'COUPLE_MF', 'COUPLE_FF', 'COUPLE_MM', 'OTHER');
CREATE TYPE sexual_orientation AS ENUM ('HETEROSEXUAL', 'BISEXUAL', 'HOMOSEXUAL', 'PANSEXUAL', 'FLUID', 'QUEER');
CREATE TYPE relationship_status AS ENUM ('SINGLE', 'ATTACHED', 'OPEN_RELATIONSHIP', 'COUPLE', 'SWINGER', 'POLYAMOROUS');
CREATE TYPE visibility_level AS ENUM ('PUBLIC', 'PRIVATE_MEMBERS', 'FAVORITES_ONLY', 'SUBSCRIBERS_ONLY', 'PAID_PER_VIEW');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'ALBUM', 'LIVE_STREAM');
CREATE TYPE report_reason AS ENUM ('UNDERAGE_SUSPICION', 'NON_CONSENTUAL_CONTENT', 'HARASSMENT', 'FAKE_PROFILE', 'IMPERSONATION', 'SPAM_SOLICITATION', 'OFFSITE_PAYMENT');
CREATE TYPE report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_ACTION_TAKEN', 'DISMISSED');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 18),
    gender gender NOT NULL,
    sexual_orientation sexual_orientation NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bio TEXT,
    interests TEXT[],
    relationship_status relationship_status NOT NULL,
    looking_for TEXT[],
    is_couple_profile BOOLEAN DEFAULT FALSE,
    partner_display_name VARCHAR(100),
    partner_age INT CHECK (partner_age IS NULL OR partner_age >= 18),
    partner_gender gender,
    show_online_status BOOLEAN DEFAULT TRUE,
    show_distance BOOLEAN DEFAULT TRUE,
    allow_direct_messages BOOLEAN DEFAULT TRUE,
    require_verification_to_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preferences Table
CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    min_age INT DEFAULT 18 CHECK (min_age >= 18),
    max_age INT DEFAULT 99,
    max_distance_km INT DEFAULT 100,
    preferred_genders gender[],
    preferred_orientations sexual_orientation[],
    verified_only BOOLEAN DEFAULT FALSE,
    creators_only BOOLEAN DEFAULT FALSE,
    photos_available_only BOOLEAN DEFAULT TRUE,
    online_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    preview_url TEXT,
    type media_type DEFAULT 'IMAGE',
    visibility visibility_level DEFAULT 'PUBLIC',
    price NUMERIC(10, 2) DEFAULT 0.00,
    title VARCHAR(255),
    description TEXT,
    is_profile_photo BOOLEAN DEFAULT FALSE,
    is_cover_photo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator Profiles Table
CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monthly_price NUMERIC(10, 2) DEFAULT 19.99,
    bio TEXT,
    welcome_message TEXT,
    followers_count INT DEFAULT 0,
    subscribers_count INT DEFAULT 0,
    total_earnings NUMERIC(12, 2) DEFAULT 0.00,
    payout_method VARCHAR(100),
    payout_details TEXT,
    is_live_now BOOLEAN DEFAULT FALSE,
    next_scheduled_live TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_media_visibility ON media(visibility);
