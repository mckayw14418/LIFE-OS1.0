-- Database Functions for Life OS
-- Automated calculations and business logic

-- Function to calculate habit streak
CREATE OR REPLACE FUNCTION calculate_habit_streak(habit_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    habit_freq habit_frequency;
    last_date DATE;
    check_date DATE;
    days_to_check INTEGER;
BEGIN
    -- Get habit frequency
    SELECT frequency INTO habit_freq FROM habits WHERE id = habit_uuid;
    
    -- Get the most recent completion date
    SELECT MAX(completion_date) INTO last_date 
    FROM habit_completions 
    WHERE habit_id = habit_uuid;
    
    IF last_date IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Determine how many days to check based on frequency
    CASE habit_freq
        WHEN 'daily' THEN days_to_check := 1;
        WHEN 'weekly' THEN days_to_check := 7;
        WHEN 'monthly' THEN days_to_check := 30;
        ELSE days_to_check := 1;
    END CASE;
    
    check_date := CURRENT_DATE;
    
    -- Count consecutive completions
    WHILE check_date >= last_date LOOP
        IF EXISTS (
            SELECT 1 FROM habit_completions 
            WHERE habit_id = habit_uuid 
            AND completion_date = check_date
        ) THEN
            current_streak := current_streak + 1;
            check_date := check_date - INTERVAL '1 day' * days_to_check;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate completion rate (last 30 days)
CREATE OR REPLACE FUNCTION calculate_completion_rate(habit_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_days INTEGER;
    completed_days INTEGER;
    habit_freq habit_frequency;
    start_date DATE;
BEGIN
    -- Get habit frequency and start date
    SELECT frequency, GREATEST(habits.start_date, CURRENT_DATE - INTERVAL '30 days')
    INTO habit_freq, start_date
    FROM habits 
    WHERE id = habit_uuid;
    
    -- Calculate expected days based on frequency
    CASE habit_freq
        WHEN 'daily' THEN 
            total_days := CURRENT_DATE - start_date + 1;
        WHEN 'weekly' THEN 
            total_days := CEIL((CURRENT_DATE - start_date + 1) / 7.0);
        WHEN 'monthly' THEN 
            total_days := CEIL((CURRENT_DATE - start_date + 1) / 30.0);
        ELSE 
            total_days := CURRENT_DATE - start_date + 1;
    END CASE;
    
    -- Count actual completions
    SELECT COUNT(*) INTO completed_days
    FROM habit_completions
    WHERE habit_id = habit_uuid
    AND completion_date >= start_date
    AND completion_date <= CURRENT_DATE;
    
    IF total_days = 0 THEN
        RETURN 0.00;
    END IF;
    
    RETURN ROUND((completed_days::DECIMAL / total_days::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update word count for journal entries
CREATE OR REPLACE FUNCTION update_journal_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count := array_length(string_to_array(trim(NEW.content), ' '), 1);
    NEW.reading_time := CEIL(NEW.word_count / 200.0); -- Assuming 200 words per minute
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Increment usage for new tags
        FOREACH tag_name IN ARRAY NEW.tags LOOP
            INSERT INTO journal_tags (user_id, name, usage_count)
            VALUES (NEW.user_id, tag_name, 1)
            ON CONFLICT (user_id, name)
            DO UPDATE SET 
                usage_count = journal_tags.usage_count + 1,
                updated_at = NOW();
        END LOOP;
        
        -- Decrement usage for removed tags (UPDATE only)
        IF TG_OP = 'UPDATE' THEN
            FOREACH tag_name IN ARRAY OLD.tags LOOP
                IF NOT (tag_name = ANY(NEW.tags)) THEN
                    UPDATE journal_tags 
                    SET usage_count = GREATEST(usage_count - 1, 0),
                        updated_at = NOW()
                    WHERE user_id = OLD.user_id AND name = tag_name;
                END IF;
            END LOOP;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        FOREACH tag_name IN ARRAY OLD.tags LOOP
            UPDATE journal_tags 
            SET usage_count = GREATEST(usage_count - 1, 0),
                updated_at = NOW()
            WHERE user_id = OLD.user_id AND name = tag_name;
        END LOOP;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update habit statistics
CREATE OR REPLACE FUNCTION update_habit_stats()
RETURNS TRIGGER AS $$
DECLARE
    new_streak INTEGER;
    new_rate DECIMAL(5,2);
    best_streak_val INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Calculate new streak and completion rate
        new_streak := calculate_habit_streak(NEW.habit_id);
        new_rate := calculate_completion_rate(NEW.habit_id);
        
        -- Get current best streak
        SELECT best_streak INTO best_streak_val FROM habits WHERE id = NEW.habit_id;
        
        -- Update habit statistics
        UPDATE habits SET
            streak_count = new_streak,
            best_streak = GREATEST(best_streak_val, new_streak),
            completion_rate = new_rate,
            total_completions = (
                SELECT COUNT(*) FROM habit_completions WHERE habit_id = NEW.habit_id
            ),
            last_completed_date = NEW.completion_date,
            updated_at = NOW()
        WHERE id = NEW.habit_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Recalculate after deletion
        new_streak := calculate_habit_streak(OLD.habit_id);
        new_rate := calculate_completion_rate(OLD.habit_id);
        
        UPDATE habits SET
            streak_count = new_streak,
            completion_rate = new_rate,
            total_completions = (
                SELECT COUNT(*) FROM habit_completions WHERE habit_id = OLD.habit_id
            ),
            last_completed_date = (
                SELECT MAX(completion_date) FROM habit_completions WHERE habit_id = OLD.habit_id
            ),
            updated_at = NOW()
        WHERE id = OLD.habit_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard statistics
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'journals', json_build_object(
            'total_entries', (SELECT COUNT(*) FROM journals WHERE user_id = user_uuid),
            'this_month', (SELECT COUNT(*) FROM journals WHERE user_id = user_uuid AND entry_date >= date_trunc('month', CURRENT_DATE)),
            'current_streak', (
                SELECT COUNT(*) FROM (
                    SELECT entry_date FROM journals 
                    WHERE user_id = user_uuid 
                    AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
                    ORDER BY entry_date DESC
                ) t
            ),
            'total_words', (SELECT COALESCE(SUM(word_count), 0) FROM journals WHERE user_id = user_uuid),
            'avg_mood', (
                SELECT ROUND(AVG(
                    CASE mood
                        WHEN 'very_low' THEN 1
                        WHEN 'low' THEN 2
                        WHEN 'neutral' THEN 3
                        WHEN 'high' THEN 4
                        WHEN 'very_high' THEN 5
                    END
                ), 2) FROM journals WHERE user_id = user_uuid AND mood IS NOT NULL
            )
        ),
        'tasks', json_build_object(
            'total_tasks', (SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid),
            'completed', (SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid AND status = 'completed'),
            'in_progress', (SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid AND status = 'in_progress'),
            'overdue', (
                SELECT COUNT(*) FROM tasks 
                WHERE user_id = user_uuid 
                AND status != 'completed' 
                AND due_date < NOW()
            ),
            'completed_this_month', (
                SELECT COUNT(*) FROM tasks 
                WHERE user_id = user_uuid 
                AND status = 'completed' 
                AND completed_at >= date_trunc('month', CURRENT_DATE)
            )
        ),
        'habits', json_build_object(
            'total_habits', (SELECT COUNT(*) FROM habits WHERE user_id = user_uuid AND is_active = true),
            'avg_completion_rate', (
                SELECT ROUND(AVG(completion_rate), 2) 
                FROM habits 
                WHERE user_id = user_uuid AND is_active = true
            ),
            'active_streaks', (
                SELECT COUNT(*) FROM habits 
                WHERE user_id = user_uuid 
                AND is_active = true 
                AND streak_count > 0
            ),
            'completed_today', (
                SELECT COUNT(*) FROM habit_completions hc
                JOIN habits h ON hc.habit_id = h.id
                WHERE hc.user_id = user_uuid 
                AND hc.completion_date = CURRENT_DATE
                AND h.is_active = true
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
