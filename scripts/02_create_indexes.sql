-- Performance Indexes for Life OS Database
-- Optimized for common query patterns

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Journal indexes
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_entry_date ON journals(entry_date DESC);
CREATE INDEX idx_journals_user_date ON journals(user_id, entry_date DESC);
CREATE INDEX idx_journals_mood ON journals(mood) WHERE mood IS NOT NULL;
CREATE INDEX idx_journals_energy ON journals(energy_level) WHERE energy_level IS NOT NULL;
CREATE INDEX idx_journals_tags ON journals USING GIN(tags);
CREATE INDEX idx_journals_favorite ON journals(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_journals_search ON journals USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_journals_word_count ON journals(word_count DESC);
CREATE INDEX idx_journals_created_at ON journals(created_at DESC);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_category ON tasks(category) WHERE category IS NOT NULL;
CREATE INDEX idx_tasks_project ON tasks(project) WHERE project IS NOT NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_tasks_order ON tasks(user_id, order_index);
CREATE INDEX idx_tasks_archived ON tasks(user_id, is_archived);

-- Task dependencies indexes
CREATE INDEX idx_task_deps_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_deps_user_id ON task_dependencies(user_id);

-- Habits indexes
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_habits_frequency ON habits(frequency);
CREATE INDEX idx_habits_category ON habits(category) WHERE category IS NOT NULL;
CREATE INDEX idx_habits_streak ON habits(streak_count DESC);
CREATE INDEX idx_habits_completion_rate ON habits(completion_rate DESC);
CREATE INDEX idx_habits_last_completed ON habits(last_completed_date DESC) WHERE last_completed_date IS NOT NULL;

-- Habit completions indexes
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completion_date DESC);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completion_date DESC);
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completion_date DESC);
CREATE INDEX idx_habit_completions_quality ON habit_completions(quality_rating) WHERE quality_rating IS NOT NULL;

-- Journal tags indexes
CREATE INDEX idx_journal_tags_user_id ON journal_tags(user_id);
CREATE INDEX idx_journal_tags_name ON journal_tags(name);
CREATE INDEX idx_journal_tags_usage ON journal_tags(usage_count DESC);
CREATE INDEX idx_journal_tags_user_name ON journal_tags(user_id, name);

-- User statistics indexes
CREATE INDEX idx_user_stats_user_id ON user_statistics(user_id);
CREATE INDEX idx_user_stats_calculated ON user_statistics(last_calculated_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Composite indexes for common dashboard queries
CREATE INDEX idx_journals_dashboard ON journals(user_id, entry_date DESC, mood, energy_level);
CREATE INDEX idx_tasks_dashboard ON tasks(user_id, status, priority, due_date);
CREATE INDEX idx_habits_dashboard ON habits(user_id, is_active, streak_count DESC, completion_rate DESC);

-- Partial indexes for performance
CREATE INDEX idx_tasks_active ON tasks(user_id, created_at DESC) WHERE status != 'completed' AND is_archived = false;
CREATE INDEX idx_tasks_overdue ON tasks(user_id, due_date) WHERE status != 'completed' AND due_date < NOW();
CREATE INDEX idx_habits_due_reminder ON habits(user_id, reminder_times) WHERE is_active = true AND array_length(reminder_times, 1) > 0;
