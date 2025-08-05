# Supabase Database Setup Guide

This guide will walk you through setting up the complete Life OS database schema in Supabase.

## Prerequisites

- A Supabase account and project
- Access to the Supabase Dashboard or CLI
- Basic understanding of SQL and database concepts

## Quick Setup (Recommended)

### Option 1: Using Supabase Dashboard

1. **Navigate to SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Execute Scripts in Order**
   Run the following scripts in the exact order listed:

   \`\`\`sql
   -- 1. Create Tables and Types
   -- Copy and paste the content from scripts/01_create_tables.sql
   
   -- 2. Create Indexes
   -- Copy and paste the content from scripts/02_create_indexes.sql
   
   -- 3. Create Functions
   -- Copy and paste the content from scripts/03_create_functions.sql
   
   -- 4. Create Triggers
   -- Copy and paste the content from scripts/04_create_triggers.sql
   
   -- 5. Create RLS Policies
   -- Copy and paste the content from scripts/05_create_rls_policies.sql
   
   -- 6. Create Views
   -- Copy and paste the content from scripts/06_create_views.sql
   \`\`\`

3. **Verify Installation**
   - Check that all tables are created in the "Table Editor"
   - Verify that RLS is enabled on all tables
   - Test that views are accessible

### Option 2: Using Supabase CLI

1. **Install Supabase CLI**
   \`\`\`bash
   npm install -g supabase
   \`\`\`

2. **Login and Link Project**
   \`\`\`bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   \`\`\`

3. **Run Migrations**
   \`\`\`bash
   # Copy the SQL files to supabase/migrations/
   supabase db push
   \`\`\`

## Manual Setup Steps

### Step 1: Environment Variables

Ensure you have the following environment variables set:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### Step 2: Database Schema

The database includes the following main components:

#### Core Tables
- **profiles**: Extended user profiles with preferences
- **journals**: Daily journal entries with mood tracking
- **tasks**: Task management with dependencies and time tracking
- **habits**: Habit tracking with flexible frequencies
- **habit_completions**: Individual habit completion records

#### Supporting Tables
- **journal_tags**: Reusable tags for journal entries
- **task_dependencies**: Task relationships and dependencies
- **user_statistics**: Cached user statistics for performance
- **notifications**: System notifications and reminders

#### Views
- **journal_entries_with_stats**: Enhanced journal entries with metrics
- **tasks_with_dependencies**: Tasks with dependency information
- **habits_with_stats**: Habits with comprehensive statistics
- **user_dashboard_stats**: Aggregated dashboard metrics

### Step 3: Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Proper authentication is required for all operations
- Data integrity is maintained across relationships

### Step 4: Functions and Triggers

The database includes several automated functions:
- **Habit streak calculation**: Automatic streak tracking
- **Completion rate analytics**: Rolling completion percentages
- **Word count automation**: Automatic journal word counting
- **Tag usage tracking**: Smart tag popularity metrics

## Configuration

### Authentication Setup

1. **Enable Authentication Providers**
   - Go to Authentication > Settings in Supabase Dashboard
   - Enable your preferred providers (Email, Google, GitHub, etc.)

2. **Configure Email Templates**
   - Customize confirmation and recovery email templates
   - Set up custom SMTP if needed

### Storage Setup (Optional)

If you plan to use file attachments:

1. **Create Storage Buckets**
   \`\`\`sql
   -- Create buckets for user uploads
   INSERT INTO storage.buckets (id, name, public) VALUES 
   ('avatars', 'avatars', true),
   ('attachments', 'attachments', false);
   \`\`\`

2. **Set Storage Policies**
   \`\`\`sql
   -- Allow users to upload their own avatars
   CREATE POLICY "Users can upload own avatar" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   \`\`\`

## Usage Examples

### TypeScript Integration

\`\`\`typescript
import { supabase } from '@/lib/supabase/client'
import { JournalService, TaskService, HabitService } from '@/lib/supabase'

// Create a journal entry
const journal = await JournalService.createJournal({
  user_id: user.id,
  title: "My Day",
  content: "Today was a great day!",
  mood: "high",
  energy_level: "high",
  tags: ["gratitude", "productivity"]
})

// Create a task
const task = await TaskService.createTask({
  user_id: user.id,
  title: "Complete project",
  description: "Finish the Life OS integration",
  priority: "high",
  due_date: new Date().toISOString()
})

// Create a habit
const habit = await HabitService.createHabit({
  user_id: user.id,
  name: "Morning Exercise",
  frequency: "daily",
  target_value: 1,
  category: "health"
})
\`\`\`

### React Hooks Usage

\`\`\`typescript
import { useJournals, useTasks, useHabits, useDashboard } from '@/lib/supabase/hooks'

function MyComponent() {
  const { journals, loading, createJournal } = useJournals()
  const { tasks, completeTask } = useTasks({ status: ['todo', 'in_progress'] })
  const { habits, completeHabit } = useHabits({ isActive: true })
  const { dashboardData } = useDashboard()

  // Component logic here
}
\`\`\`

## Performance Optimization

### Indexing Strategy

The database includes comprehensive indexes for:
- User-specific queries (all tables have user_id indexes)
- Date-based queries (entry_date, due_date, completion_date)
- Status and priority filtering
- Full-text search capabilities
- Tag-based filtering using GIN indexes

### Query Optimization

- Use the provided views for complex queries
- Leverage the service classes for consistent data access
- Implement pagination for large datasets
- Use real-time subscriptions judiciously

## Security Considerations

### Row Level Security

- All tables have RLS enabled
- Policies ensure data isolation per user
- Service role access is restricted to admin functions

### Data Validation

- Database constraints prevent invalid data
- Triggers maintain data consistency
- Foreign key relationships ensure referential integrity

### API Security

- Use the provided service classes for consistent security
- Validate user permissions in API routes
- Implement rate limiting for public endpoints

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure user is authenticated
   - Check that policies are correctly applied
   - Verify user_id matches authenticated user

2. **Function Execution Errors**
   - Check function permissions
   - Verify parameter types match expectations
   - Review function logs in Supabase Dashboard

3. **Real-time Subscription Issues**
   - Ensure RLS policies allow SELECT operations
   - Check that the subscription filter is correct
   - Verify network connectivity

### Performance Issues

1. **Slow Queries**
   - Check if appropriate indexes exist
   - Use EXPLAIN ANALYZE to identify bottlenecks
   - Consider using views for complex queries

2. **High Memory Usage**
   - Implement proper pagination
   - Limit the number of real-time subscriptions
   - Use selective column queries

### Migration Issues

1. **Script Execution Order**
   - Always run scripts in the specified order
   - Check for dependency errors between scripts
   - Verify all extensions are enabled

2. **Permission Errors**
   - Ensure you have sufficient database privileges
   - Check that service role key is correctly configured
   - Verify RLS policies don't block necessary operations

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Life OS GitHub Repository](https://github.com/your-repo/life-os)

## Next Steps

After setting up the database:

1. **Test the Integration**
   - Run the provided TypeScript service classes
   - Test CRUD operations for each module
   - Verify real-time subscriptions work

2. **Customize for Your Needs**
   - Add custom fields to existing tables
   - Create additional views for specific queries
   - Implement custom business logic functions

3. **Deploy to Production**
   - Set up proper backup strategies
   - Configure monitoring and alerting
   - Implement proper CI/CD for schema changes

The database schema is designed to be production-ready and scalable. It provides a solid foundation for building comprehensive life tracking and productivity applications.
