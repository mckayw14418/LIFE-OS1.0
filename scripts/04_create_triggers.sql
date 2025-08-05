-- Database Triggers for Life OS
-- Automatic data maintenance and calculations

-- Trigger to update timestamps on profile changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_completions_updated_at
    BEFORE UPDATE ON habit_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_tags_updated_at
    BEFORE UPDATE ON journal_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at
    BEFORE UPDATE ON user_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically calculate word count for journal entries
CREATE TRIGGER journal_word_count_trigger
    BEFORE INSERT OR UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_word_count();

-- Trigger to update tag usage counts
CREATE TRIGGER journal_tag_usage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage();

-- Trigger to update habit statistics when completions change
CREATE TRIGGER habit_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON habit_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_habit_stats();

-- Trigger to create user statistics record when profile is created
CREATE OR REPLACE FUNCTION create_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_statistics (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_stats_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_statistics();

-- Trigger to prevent circular task dependencies
CREATE OR REPLACE FUNCTION prevent_circular_dependencies()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if adding this dependency would create a cycle
    IF EXISTS (
        WITH RECURSIVE dependency_chain AS (
            -- Start with the task that would depend on NEW.task_id
            SELECT NEW.depends_on_task_id as task_id, 1 as depth
            
            UNION ALL
            
            -- Follow the chain of dependencies
            SELECT td.depends_on_task_id, dc.depth + 1
            FROM task_dependencies td
            JOIN dependency_chain dc ON td.task_id = dc.task_id
            WHERE dc.depth < 10 -- Prevent infinite recursion
        )
        SELECT 1 FROM dependency_chain WHERE task_id = NEW.task_id
    ) THEN
        RAISE EXCEPTION 'Cannot create circular dependency between tasks';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_deps_trigger
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_dependencies();

-- Trigger to automatically complete parent tasks when all subtasks are done
CREATE OR REPLACE FUNCTION check_parent_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    parent_id UUID;
    incomplete_subtasks INTEGER;
BEGIN
    -- Only process when a task is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        parent_id := NEW.parent_task_id;
        
        -- If this task has a parent, check if all siblings are complete
        IF parent_id IS NOT NULL THEN
            SELECT COUNT(*) INTO incomplete_subtasks
            FROM tasks
            WHERE parent_task_id = parent_id
            AND status != 'completed'
            AND id != NEW.id;
            
            -- If no incomplete subtasks remain, complete the parent
            IF incomplete_subtasks = 0 THEN
                UPDATE tasks
                SET status = 'completed',
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = parent_id
                AND status != 'completed';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_parent_completion_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_parent_task_completion();

-- Trigger to update task completion timestamp
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Clear completed_at when status changes from completed
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_completion_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_completion();
