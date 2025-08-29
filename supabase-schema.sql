-- ChurchFeed Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Churches table
CREATE TABLE churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    is_hq BOOLEAN NOT NULL DEFAULT false,
    parent_hq_id UUID REFERENCES churches(id),
    church_code TEXT UNIQUE NOT NULL,
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('tier1', 'tier2', 'tier3', 'tier4')),
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'past_due', 'canceled', 'trialing')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Head Pastor', 'Pastor', 'Secretary')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    invited_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table (with auth support)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    device_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    author_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    target_branches UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_churches_code ON churches(church_code);
CREATE INDEX idx_churches_hq ON churches(parent_hq_id);
CREATE INDEX idx_admins_church ON admins(church_id);
CREATE INDEX idx_admins_user ON admins(user_id);
CREATE INDEX idx_members_church ON members(church_id);
CREATE INDEX idx_posts_church ON posts(church_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_subscriptions_church ON subscriptions(church_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Churches policies
CREATE POLICY "Churches are viewable by admins of the church" ON churches
    FOR SELECT USING (
        id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Churches can be inserted by authenticated users" ON churches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Churches can be updated by admins of the church" ON churches
    FOR UPDATE USING (
        id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

-- Admins policies
CREATE POLICY "Admins are viewable by admins of the same church" ON admins
    FOR SELECT USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can be inserted by authenticated users" ON admins
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update their own records" ON admins
    FOR UPDATE USING (user_id = auth.uid());

-- Members policies
CREATE POLICY "Members are viewable by admins of the church or the member themselves" ON members
    FOR SELECT USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "Members can be inserted by authenticated users" ON members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can be updated by admins of the church or the member themselves" ON members
    FOR UPDATE USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

-- Posts policies
CREATE POLICY "Posts are viewable by members and admins of the church" ON posts
    FOR SELECT USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        ) OR
        church_id IN (
            SELECT church_id FROM members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Posts can be inserted by admins of the church" ON posts
    FOR INSERT WITH CHECK (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Posts can be updated by the author" ON posts
    FOR UPDATE USING (
        author_id IN (
            SELECT id FROM admins WHERE user_id = auth.uid()
        )
    );

-- Subscriptions policies
CREATE POLICY "Subscriptions are viewable by admins of the church" ON subscriptions
    FOR SELECT USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Subscriptions can be managed by admins of the church" ON subscriptions
    FOR ALL USING (
        church_id IN (
            SELECT church_id FROM admins WHERE user_id = auth.uid()
        )
    );

-- Functions for generating unique church codes
CREATE OR REPLACE FUNCTION generate_unique_church_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character code with letters and numbers
        new_code := upper(
            chr(trunc(random() * 26)::int + 65) ||
            chr(trunc(random() * 26)::int + 65) ||
            trunc(random() * 10)::text ||
            chr(trunc(random() * 26)::int + 65) ||
            trunc(random() * 10)::text ||
            chr(trunc(random() * 26)::int + 65)
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM churches WHERE church_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate church code
CREATE OR REPLACE FUNCTION set_church_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.church_code IS NULL OR NEW.church_code = '' THEN
        NEW.church_code := generate_unique_church_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_church_code
    BEFORE INSERT ON churches
    FOR EACH ROW
    EXECUTE FUNCTION set_church_code();

-- Function to get posts for a specific church including HQ posts if it's a branch
CREATE OR REPLACE FUNCTION get_church_feed(target_church_id UUID)
RETURNS TABLE (
    id UUID,
    church_id UUID,
    author_id UUID,
    content TEXT,
    image_url TEXT,
    target_branches UUID[],
    created_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    author_role TEXT,
    church_name TEXT
) AS $$
DECLARE
    church_record RECORD;
BEGIN
    -- Get church info
    SELECT * INTO church_record FROM churches WHERE churches.id = target_church_id;
    
    -- If church is HQ, return its posts and branch posts
    IF church_record.is_hq THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.church_id,
            p.author_id,
            p.content,
            p.image_url,
            p.target_branches,
            p.created_at,
            a.name as author_name,
            a.role as author_role,
            c.name as church_name
        FROM posts p
        JOIN admins a ON p.author_id = a.id
        JOIN churches c ON p.church_id = c.id
        WHERE p.church_id = target_church_id
           OR (c.parent_hq_id = target_church_id)
        ORDER BY p.created_at DESC;
    ELSE
        -- If church is branch, return its posts and HQ posts targeted to it
        RETURN QUERY
        SELECT 
            p.id,
            p.church_id,
            p.author_id,
            p.content,
            p.image_url,
            p.target_branches,
            p.created_at,
            a.name as author_name,
            a.role as author_role,
            c.name as church_name
        FROM posts p
        JOIN admins a ON p.author_id = a.id
        JOIN churches c ON p.church_id = c.id
        WHERE p.church_id = target_church_id
           OR (p.church_id = church_record.parent_hq_id AND 
               (p.target_branches IS NULL OR target_church_id = ANY(p.target_branches)))
        ORDER BY p.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default data (optional)
-- You can uncomment and modify these for testing
-- INSERT INTO churches (name, address, is_hq, church_code, subscription_tier) 
-- VALUES ('Sample Church HQ', '123 Main St, City, State', true, 'SAMPLE', 'tier2');