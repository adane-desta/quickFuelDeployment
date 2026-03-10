# QuickFuel Database Setup Guide

This guide will help you set up the complete QuickFuel database on Supabase.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Basic understanding of SQL and PostgreSQL

## Step-by-Step Setup

### 1. Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Fill in the project details:
   - **Name**: QuickFuel (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to Ethiopia (e.g., Frankfurt, EU Central)
   - **Pricing Plan**: Choose based on your needs (Free tier works for development)
5. Click "Create new project"
6. Wait for the project to be provisioned (this may take a few minutes)

### 2. Run the Database Schema

1. Once your project is ready, go to the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Copy the **entire contents** of the file `/database/schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
6. You should see a success message indicating all tables, indexes, and functions were created

**Note**: The schema includes:
- 11 core tables (users, stations, reservations, fuel_prices, etc.)
- 30+ performance indexes
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps
- Views for common queries
- Utility functions for nearby stations and pricing

### 3. Insert Initial Fuel Prices

After the schema is created, you need to add initial fuel prices. Run this SQL:

```sql
-- Insert initial fuel prices (adjust values as needed)
INSERT INTO fuel_prices (fuel_type, price_per_liter, effective_from, updated_by)
VALUES 
  ('Petrol', 65.00, CURRENT_DATE, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  ('Diesel', 58.00, CURRENT_DATE, (SELECT id FROM users WHERE role = 'admin' LIMIT 1));
```

**Important**: You'll need to create an admin user first or update this query after your first admin logs in.

### 4. Configure Authentication

1. Go to **Authentication** → **Settings** in the Supabase dashboard
2. Under **Email Auth**:
   - Enable email authentication
   - Configure email templates (optional but recommended)
3. Under **Auth Providers**:
   - You can keep the default settings or add additional providers
4. Under **URL Configuration**:
   - Set your site URL (e.g., http://localhost:5173 for development)

### 5. Set Row Level Security (RLS) Policies

The schema already includes RLS policies, but verify they're enabled:

1. Go to **Database** → **Tables** in the Supabase dashboard
2. For each table, click on it and check the **RLS** tab
3. Ensure "Enable RLS" is turned ON for all tables
4. The policies should already be visible (created by the schema)

### 6. Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

### 7. Configure Your Application

1. In your QuickFuel project root, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Save the file

### 8. Restart Your Development Server

If you're running the dev server, restart it to pick up the new environment variables:

```bash
npm run dev
```

## Verification

To verify everything is set up correctly:

1. **Check Tables**: Go to Supabase Dashboard → Database → Tables. You should see 11 tables.
2. **Check Indexes**: In the SQL Editor, run:
   ```sql
   SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
   ```
   You should see 30+ indexes.

3. **Test Authentication**: Try registering a new user in your app.
4. **Check RLS**: Try querying a table:
   ```sql
   SELECT * FROM fuel_prices;
   ```
   This should return the fuel prices you inserted.

## Database Structure Overview

### Core Tables

1. **users** - Stores all user data (drivers, operators, admins)
2. **stations** - Fuel stations with location and stock info
3. **reservations** - Fuel reservations made by drivers
4. **fuel_prices** - System-wide fuel pricing (admin-controlled)
5. **fuel_analytics** - Aggregated fuel dispensing analytics
6. **notifications** - User notifications
7. **queue_reports** - Real-time queue reports from drivers
8. **system_activity** - Audit trail for all system actions
9. **user_sessions** - Active user sessions for real-time sync
10. **reviews** - Driver reviews and feedback
11. **payment_transactions** - Payment records for audit

### Key Features

- **Scalability**: Optimized for 800K+ users with comprehensive indexing
- **Real-time**: Built-in support for Supabase real-time subscriptions
- **Audit Trail**: Complete logging of all critical actions
- **Security**: Row Level Security policies for data protection
- **Performance**: Optimized queries with materialized views
- **Data Integrity**: Constraints and triggers for data validation

## Switching from Mock to Real Database

Once your Supabase database is set up:

1. The app will automatically detect the real credentials in `.env`
2. It will switch from localStorage (mock mode) to Supabase
3. All data operations will use the real database
4. Real-time subscriptions will work across devices

## Troubleshooting

### "relation does not exist" errors
- Make sure you ran the complete schema.sql file
- Check that you're connected to the correct database

### RLS policy errors
- Verify RLS is enabled on all tables
- Check that policies were created (view in RLS tab for each table)

### Authentication issues
- Verify email auth is enabled in Supabase settings
- Check that your site URL is configured correctly

### Connection errors
- Verify your VITE_SUPABASE_URL is correct
- Verify your VITE_SUPABASE_ANON_KEY is correct
- Make sure there are no extra spaces in the .env file

## Maintenance

### Regular Tasks

1. **Clean old sessions** (run weekly):
   ```sql
   SELECT cleanup_expired_sessions();
   ```

2. **Archive old activity** (run monthly):
   ```sql
   SELECT archive_old_activity();
   ```

3. **Monitor performance**: Check slow queries in Supabase Dashboard → Database → Query Performance

### Backup

Supabase provides automatic backups on paid plans. For the free tier:
- Export data regularly using the Supabase Dashboard
- Or use pg_dump if you have direct database access

## Next Steps

1. Create your first admin user through the app's registration
2. Log in as admin and set fuel prices
3. Add fuel stations through the operator registration
4. Test the complete reservation flow
5. Monitor system analytics

## Support

For issues specific to:
- **Supabase**: Check https://supabase.com/docs
- **QuickFuel**: Check the project documentation or contact the development team

---

**Database Version**: 1.0.0  
**Last Updated**: March 3, 2026  
**Compatible with**: Supabase PostgreSQL 14+
