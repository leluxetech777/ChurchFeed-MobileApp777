-- Migration to fix get_church_feed function type mismatch
-- This fixes the "varchar(255) does not match expected type text" error

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
            a.name::text as author_name,
            a.role::text as author_role,
            c.name::text as church_name
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
            a.name::text as author_name,
            a.role::text as author_role,
            c.name::text as church_name
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