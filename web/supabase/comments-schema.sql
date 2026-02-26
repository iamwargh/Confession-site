-- ================================================================
--   CONFESSION SITE — COMMENTS SYSTEM SCHEMA
--   
--   RUN THIS IN: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
--   TABLES: comments, comment_likes, comment_reports
-- ================================================================

-- ================================================================
-- 1. COMMENTS TABLE
-- ================================================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500 AND char_length(content) > 0),
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX idx_comments_confession_id ON comments(confession_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

-- ================================================================
-- 2. COMMENT LIKES TABLE
-- ================================================================

CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevent duplicate likes
    UNIQUE(comment_id, user_id)
);

-- Indexes for comment_likes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- ================================================================
-- 3. COMMENT REPORTS TABLE
-- ================================================================

CREATE TABLE comment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(reason) <= 500 AND char_length(reason) > 0),
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevent duplicate reports from the same user on the same comment
    UNIQUE(comment_id, reported_by)
);

CREATE INDEX idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);

-- ================================================================
-- 3.5. ADD COMMENTS COUNT TO CONFESSIONS
-- ================================================================

ALTER TABLE confessions ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0);

CREATE INDEX IF NOT EXISTS idx_confessions_comments_count ON confessions(comments_count DESC);

-- ================================================================
-- 4. TRIGGERS FOR LIKE COUNTS
-- ================================================================

-- Increment likes_count when a comment like is added
CREATE OR REPLACE FUNCTION increment_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_like_added
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_comment_likes_count();

-- Decrement likes_count when a comment like is removed
CREATE OR REPLACE FUNCTION decrement_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_like_removed
    AFTER DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_comment_likes_count();

-- Increment comments_count when a comment is added
CREATE OR REPLACE FUNCTION increment_confession_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE confessions
    SET comments_count = comments_count + 1
    WHERE id = NEW.confession_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_added
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION increment_confession_comments_count();

-- Decrement comments_count when a comment is removed
CREATE OR REPLACE FUNCTION decrement_confession_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE confessions
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.confession_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_removed
    AFTER DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION decrement_confession_comments_count();

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────
-- 5a. COMMENTS POLICIES
-- ────────────────────────────────────

-- Anyone can read non-deleted comments
CREATE POLICY "comments_select_public"
    ON comments FOR SELECT
    USING (is_deleted = false);

-- Authenticated, non-suspended users can create comments
CREATE POLICY "comments_insert_auth"
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND is_suspended = true
        )
    );

-- Users can mark their own comments as deleted
CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update/delete any comment
CREATE POLICY "comments_update_admin"
    ON comments FOR UPDATE
    USING (is_admin_or_above(auth.uid()))
    WITH CHECK (is_admin_or_above(auth.uid()));

-- Cascade delete support
CREATE POLICY "comments_delete_cascade"
    ON comments FOR DELETE
    USING (
        auth.uid() = user_id 
        OR is_superadmin(auth.uid())
    );

-- ────────────────────────────────────
-- 5b. COMMENT LIKES POLICIES
-- ────────────────────────────────────

-- Anyone can read comment likes
CREATE POLICY "comment_likes_select_public"
    ON comment_likes FOR SELECT
    USING (true);

-- Authenticated users can insert likes
CREATE POLICY "comment_likes_insert_auth"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "comment_likes_delete_own"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ────────────────────────────────────
-- 5c. COMMENT REPORTS POLICIES
-- ────────────────────────────────────

-- Authenticated users can insert reports
CREATE POLICY "comment_reports_insert_auth"
    ON comment_reports FOR INSERT
    WITH CHECK (
        auth.uid() = reported_by
        AND NOT EXISTS (
            SELECT 1 FROM comments
            WHERE id = comment_id AND user_id = auth.uid()
        )
    );

-- Admins can view and update reports
CREATE POLICY "comment_reports_select_admin"
    ON comment_reports FOR SELECT
    USING (is_admin_or_above(auth.uid()));

CREATE POLICY "comment_reports_update_admin"
    ON comment_reports FOR UPDATE
    USING (is_admin_or_above(auth.uid()))
    WITH CHECK (is_admin_or_above(auth.uid()));
