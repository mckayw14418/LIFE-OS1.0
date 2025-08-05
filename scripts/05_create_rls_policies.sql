-- Row Level Security Policies for Life OS
-- Ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Journals policies
CREATE POLICY "Users can view own journals" ON journals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals" ON journals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals" ON journals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals" ON journals
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
    FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
CREATE POLICY "Users can view own habit completions" ON habit_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions" ON habit_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit completions" ON habit_completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions" ON habit_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Journal tags policies
CREATE POLICY "Users can view own journal tags" ON journal_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal tags" ON journal_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal tags" ON journal_tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal tags" ON journal_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Task dependencies policies
CREATE POLICY "Users can view own task dependencies" ON task_dependencies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task dependencies" ON task_dependencies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task dependencies" ON task_dependencies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task dependencies" ON task_dependencies
    FOR DELETE USING (auth.uid() = user_id);

-- User statistics policies
CREATE POLICY "Users can view own statistics" ON user_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON user_statistics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert user statistics" ON user_statistics
    FOR INSERT WITH CHECK (true); -- Handled by trigger

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- System-generated

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Additional security: Prevent users from accessing other users' data through joins
-- This is handled by the RLS policies above, but we can add additional checks

-- Create a security definer function for admin operations
CREATE OR REPLACE FUNCTION admin_get_user_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow this function to be called by service role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN (SELECT COUNT(*) FROM auth.users);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant service role permissions for admin functions
GRANT EXECUTE ON FUNCTION admin_get_user_count() TO service_role;
