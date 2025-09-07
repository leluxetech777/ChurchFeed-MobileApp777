-- ===================================================
-- REACTIONS TABLE SETUP FOR CHURCHFEED
-- ===================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire SQL script
-- 4. Click "Run" to execute
-- 
-- This will create the reactions table with proper security policies
-- ===================================================

-- Create the reactions table
-- IMPORTANT: Each user can only have ONE reaction per post
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'like', 'prayer', 'praise', 'heart_hands')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)  -- This ensures one reaction per user per post
);

-- Create indexes for better performance
CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- Enable Row Level Security
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view reactions on posts they have access to
CREATE POLICY "Reactions are viewable by members and admins of the church" ON reactions
    FOR SELECT USING (
        post_id IN (
            SELECT posts.id FROM posts 
            WHERE posts.church_id IN (
                SELECT church_id FROM admins WHERE user_id = auth.uid()
            ) OR posts.church_id IN (
                SELECT church_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policy: Users can add reactions to posts they can see
CREATE POLICY "Reactions can be created by authenticated users" ON reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        post_id IN (
            SELECT posts.id FROM posts 
            WHERE posts.church_id IN (
                SELECT church_id FROM admins WHERE user_id = auth.uid()
            ) OR posts.church_id IN (
                SELECT church_id FROM members WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON reactions
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policy: Users can update their own reactions (for changing reaction type)
CREATE POLICY "Users can update their own reactions" ON reactions
    FOR UPDATE USING (user_id = auth.uid());

-- Success message
SELECT 'Reactions table created successfully! 🎉' as status;