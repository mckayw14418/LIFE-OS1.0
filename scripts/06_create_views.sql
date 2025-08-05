-- Database Views for Life OS
-- Optimized queries for common data access patterns

-- Journal entries with calculated statistics
CREATE VIEW journal_entries_with_stats AS
SELECT 
    j.*,
    EXTRACT(DOW FROM j.entry_date) as day_of_week,
    EXTRACT(WEEK FROM j.entry_date) as week_of_year,
    EXTRACT(MONTH FROM j.entry_date) as month,
    EXTRACT(YEAR FROM j.entry_date) as year,
    -- Mood as numeric for calculations
    CASE j.mood
        WHEN 'very_low' THEN 1
        WHEN 'low' THEN 2
        WHEN 'neutral' THEN 3
        WHEN 'high' THEN 4
        WHEN 'very_high' THEN 5
        ELSE NULL
    END as mood_numeric,
    -- Energy as numeric for calculations
    CASE j.energy_level
        WHEN 'very_low' THEN 1
        WHEN 'low' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'high' THEN 4
        WHEN 'very_high' THEN 5
        ELSE NULL
    END as energy_numeric,
    -- Tag count
    array_length(j.tags, 1) as tag_count,
    -- Days since entry
    CURRENT_DATE - j.entry_date as days_ago
FROM journals j;

-- Tasks with dependency information
CREATE VIEW tasks_with_dependencies AS
SELECT 
    t.*,
    -- Count of tasks this task depends on
    (SELECT COUNT(*) FROM task_dependencies td WHERE td.task_id = t.id) as depends_on_count,
    -- Count of tasks that depend on this task
    (SELECT COUNT(*) FROM task_dependencies td WHERE td.depends_on_task_id = t.id) as dependents_count,
    -- Array of task IDs this task depends on
    (SELECT array_agg(depends_on_task_id) FROM task_dependencies td WHERE td.task_id = t.id) as depends_on_tasks,
    -- Array of task IDs that depend on this task
    (SELECT array_agg(task_id) FROM task_dependencies td WHERE td.depends_on_task_id = t.id) as dependent_tasks,
    -- Subtask counts
    (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) as subtask_count,
    (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status = 'completed') as completed_subtasks,
    -- Time calculations
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'completed' 
        THEN true 
        ELSE false 
    END as is_overdue,
    CASE 
        WHEN t.due_date IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.due_date - NOW())) / 3600 
        ELSE NULL 
    END as hours_until_due,
    -- Progress calculation for parent tasks
    CASE 
        WHEN (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) > 0
        THEN (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE st.status = 'completed')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
                2
            )
            FROM tasks st WHERE st.parent_task_id = t.id
        )
        ELSE NULL
    END as subtask_completion_percentage
FROM tasks t;

-- Habits with comprehensive statistics
CREATE VIEW habits_with_stats AS
SELECT 
    h.*,
    -- Recent completion data
    (SELECT COUNT(*) FROM habit_completions hc 
     WHERE hc.habit_id = h.id 
     AND hc.completion_date >= CURRENT_DATE - INTERVAL '7 days') as completions_last_7_days,
    (SELECT COUNT(*) FROM habit_completions hc 
     WHERE hc.habit_id = h.id 
     AND hc.completion_date >= CURRENT_DATE - INTERVAL '30 days') as completions_last_30_days,
    -- Average quality rating
    (SELECT ROUND(AVG(quality_rating), 2) FROM habit_completions hc 
     WHERE hc.habit_id = h.id 
     AND quality_rating IS NOT NULL) as avg_quality_rating,
    -- Completion status for today
    EXISTS(SELECT 1 FROM habit_completions hc 
           WHERE hc.habit_id = h.id 
           AND hc.completion_date = CURRENT_DATE) as completed_today,
    -- Days since last completion
    CASE 
        WHEN h.last_completed_date IS NOT NULL 
        THEN CURRENT_DATE - h.last_completed_date 
        ELSE NULL 
    END as days_since_completion,
    -- Expected completions based on frequency
    CASE h.frequency
        WHEN 'daily' THEN 7
        WHEN 'weekly' THEN 1
        WHEN 'monthly' THEN 1
        ELSE 7
    END as expected_weekly_completions,
    -- Weekly completion rate
    CASE h.frequency
        WHEN 'daily' THEN 
            ROUND((
                SELECT COUNT(*)::DECIMAL / 7::DECIMAL * 100
                FROM habit_completions hc 
                WHERE hc.habit_id = h.id 
                AND hc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
            ), 2)
        WHEN 'weekly' THEN
            CASE WHEN EXISTS(
                SELECT 1 FROM habit_completions hc 
                WHERE hc.habit_id = h.id 
                AND hc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
            ) THEN 100.00 ELSE 0.00 END
        ELSE h.completion_rate
    END as weekly_completion_rate
FROM habits h;

-- User dashboard statistics view
CREATE VIEW user_dashboard_stats AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.username,
    -- Journal stats
    (SELECT COUNT(*) FROM journals j WHERE j.user_id = p.id) as total_journal_entries,
    (SELECT COUNT(*) FROM journals j 
     WHERE j.user_id = p.id 
     AND j.entry_date >= date_trunc('month', CURRENT_DATE)) as journal_entries_this_month,
    (SELECT COALESCE(SUM(word_count), 0) FROM journals j WHERE j.user_id = p.id) as total_words_written,
    (SELECT ROUND(AVG(
        CASE mood
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'neutral' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END
    ), 2) FROM journals j WHERE j.user_id = p.id AND j.mood IS NOT NULL) as avg_mood,
    -- Task stats
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = p.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = p.id AND t.status = 'completed') as completed_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.user_id = p.id AND t.status = 'in_progress') as tasks_in_progress,
    (SELECT COUNT(*) FROM tasks t 
     WHERE t.user_id = p.id 
     AND t.status != 'completed' 
     AND t.due_date < NOW()) as overdue_tasks,
    (SELECT COUNT(*) FROM tasks t 
     WHERE t.user_id = p.id 
     AND t.status = 'completed' 
     AND t.completed_at >= date_trunc('month', CURRENT_DATE)) as tasks_completed_this_month,
    -- Habit stats
    (SELECT COUNT(*) FROM habits h WHERE h.user_id = p.id AND h.is_active = true) as active_habits,
    (SELECT ROUND(AVG(completion_rate), 2) 
     FROM habits h WHERE h.user_id = p.id AND h.is_active = true) as avg_habit_completion_rate,
    (SELECT COUNT(*) FROM habits h 
     WHERE h.user_id = p.id 
     AND h.is_active = true 
     AND h.streak_count > 0) as habits_with_streaks,
    (SELECT COUNT(*) FROM habit_completions hc
     JOIN habits h ON hc.habit_id = h.id
     WHERE hc.user_id = p.id 
     AND hc.completion_date = CURRENT_DATE
     AND h.is_active = true) as habits_completed_today,
    -- Activity stats
    (SELECT COUNT(*) FROM notifications n 
     WHERE n.user_id = p.id 
     AND n.is_read = false) as unread_notifications,
    p.created_at as user_since,
    p.updated_at as last_profile_update
FROM profiles p;

-- Weekly habit completion calendar
CREATE VIEW habit_completion_calendar AS
SELECT 
    h.id as habit_id,
    h.user_id,
    h.name as habit_name,
    h.frequency,
    generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::date as date,
    EXISTS(
        SELECT 1 FROM habit_completions hc 
        WHERE hc.habit_id = h.id 
        AND hc.completion_date = generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date
    ) as completed
FROM habits h
WHERE h.is_active = true;

-- Monthly mood and energy trends
CREATE VIEW monthly_mood_energy_trends AS
SELECT 
    user_id,
    DATE_TRUNC('month', entry_date) as month,
    COUNT(*) as entry_count,
    ROUND(AVG(
        CASE mood
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'neutral' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END
    ), 2) as avg_mood,
    ROUND(AVG(
        CASE energy_level
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END
    ), 2) as avg_energy,
    ROUND(AVG(word_count), 0) as avg_word_count
FROM journals
WHERE mood IS NOT NULL OR energy_level IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', entry_date)
ORDER BY user_id, month DESC;

-- Task completion trends
CREATE VIEW task_completion_trends AS
SELECT 
    user_id,
    DATE_TRUNC('week', completed_at) as week,
    COUNT(*) as tasks_completed,
    ROUND(AVG(
        CASE priority
            WHEN 'low' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'high' THEN 3
            WHEN 'urgent' THEN 4
        END
    ), 2) as avg_priority,
    ROUND(AVG(actual_duration), 0) as avg_duration_minutes
FROM tasks
WHERE status = 'completed' 
AND completed_at IS NOT NULL
GROUP BY user_id, DATE_TRUNC('week', completed_at)
ORDER BY user_id, week DESC;

-- Grant permissions on views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
