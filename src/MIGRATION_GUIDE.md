# Migration Guide: From Mock Mode to Production

This guide explains how to migrate your QuickFuel application from development (mock/localStorage mode) to production (Supabase mode).

## Overview

QuickFuel has two modes:

1. **Mock Mode** (Default)
   - Uses browser localStorage for data
   - No internet/database required
   - Perfect for development and demos
   - Data persists across browser sessions

2. **Production Mode** (Supabase)
   - Uses PostgreSQL database via Supabase
   - Real-time sync across devices
   - Scalable for 800K+ users
   - Production-ready with backups

## How Mode Detection Works

The app automatically detects which mode to use based on your `.env` file:

```javascript
// In lib/supabase/config.ts
export const isMockMode = 
  supabaseConfig.url === 'https://your-project.supabase.co' || 
  supabaseConfig.anonKey === 'your-anon-key-here' ||
  import.meta.env.VITE_USE_MOCK === 'true';
```

**Mock Mode triggers when:**
- No .env file exists
- VITE_SUPABASE_URL is not set or has default value
- VITE_SUPABASE_ANON_KEY is not set or has default value
- VITE_USE_MOCK is explicitly set to 'true'

**Production Mode triggers when:**
- Valid VITE_SUPABASE_URL is set
- Valid VITE_SUPABASE_ANON_KEY is set
- VITE_USE_MOCK is not 'true'

## Step-by-Step Migration

### Prerequisites

✅ Node.js 18+ installed  
✅ QuickFuel app running in mock mode  
✅ Supabase account created  
✅ Basic PostgreSQL knowledge

### Step 1: Prepare Your Supabase Project

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Click "New Project"
   - Choose name and region (recommend: Frankfurt for Ethiopia)
   - Set strong database password
   - Wait for provisioning (2-3 minutes)

2. **Run Database Schema**
   - Open SQL Editor in Supabase
   - Copy entire contents of `/database/schema.sql`
   - Paste and run in SQL Editor
   - Verify success (you should see all tables created)

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Enable Email provider
   - Set Site URL to your app URL
   - Configure email templates (optional)

4. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy "Project URL" (e.g., https://xxxxx.supabase.co)
   - Copy "anon public" key (long string)

### Step 2: Update Your Application

1. **Create .env file**
   ```bash
   cp .env.example .env
   ```

2. **Add Supabase credentials**
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

3. **Restart development server**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

### Step 3: Verify Production Mode

1. **Check Console Logs**
   - Open browser DevTools → Console
   - You should NOT see "Running in mock mode" messages
   - You should see Supabase connection logs

2. **Test Authentication**
   - Register a new user
   - Check Supabase Dashboard → Authentication → Users
   - Your new user should appear there

3. **Test Database Operations**
   - Create a reservation as a driver
   - Check Supabase Dashboard → Table Editor → reservations
   - Your reservation should appear there

### Step 4: Migrate Existing Data (Optional)

If you have important test data in localStorage that you want to migrate:

#### Option A: Manual Migration (Recommended for small datasets)

1. **Export from localStorage**
   ```javascript
   // Run in browser console
   const data = {
     users: localStorage.getItem('quickfuel_users'),
     stations: localStorage.getItem('quickfuel_stations'),
     reservations: localStorage.getItem('quickfuel_reservations'),
     // ... other tables
   };
   console.log(JSON.stringify(data, null, 2));
   // Copy the output
   ```

2. **Import to Supabase**
   - Go to Supabase Table Editor
   - Select table
   - Click "Insert" → "Insert row"
   - Paste data (you may need to insert one row at a time)

#### Option B: Script Migration (For larger datasets)

Create a migration script:

```javascript
// migration-script.js
import { supabase } from './lib/supabase/client';
import { LocalStorage } from './lib/supabase/storage';
import { STORAGE_KEYS } from './lib/supabase/config';

async function migrateData() {
  // Get data from localStorage
  const users = LocalStorage.getArray(STORAGE_KEYS.USERS);
  const stations = LocalStorage.getArray(STORAGE_KEYS.STATIONS);
  
  // Insert into Supabase
  for (const user of users) {
    await supabase.from('users').insert(user);
  }
  
  for (const station of stations) {
    await supabase.from('stations').insert(station);
  }
  
  console.log('Migration complete!');
}

migrateData();
```

**Note**: For production use, it's recommended to start fresh rather than migrating mock data.

### Step 5: Test Real-time Features

1. **Open app in two browser tabs**
2. **Login as different users in each tab**
3. **Make a change in one tab** (e.g., create reservation)
4. **Verify it appears in the other tab** in real-time

### Step 6: Configure Production Environment

For deployment to production:

1. **Set environment variables in hosting platform**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - Others: Check documentation

2. **Build the app**
   ```bash
   npm run build
   ```

3. **Test the build**
   ```bash
   npm run preview
   ```

4. **Deploy**
   ```bash
   # Deploy dist folder to your hosting service
   ```

## Switching Back to Mock Mode

If you need to switch back to mock mode (for testing):

### Temporary (current session only)
```bash
# Set environment variable before starting
VITE_USE_MOCK=true npm run dev
```

### Permanent
```env
# In .env file
VITE_USE_MOCK=true
```

Or simply remove/rename your .env file:
```bash
mv .env .env.backup
npm run dev
```

## Troubleshooting

### "Cannot connect to database"
**Cause**: Invalid credentials or Supabase project not ready  
**Solution**: 
- Verify VITE_SUPABASE_URL is correct
- Verify VITE_SUPABASE_ANON_KEY is correct
- Check Supabase project status

### "RLS policy violation"
**Cause**: Row Level Security policies blocking access  
**Solution**:
- Verify RLS policies were created (from schema.sql)
- Check user is authenticated
- Verify user role matches policy requirements

### "Table does not exist"
**Cause**: Database schema not run  
**Solution**:
- Run complete schema.sql in Supabase SQL Editor
- Check for error messages during schema creation

### Data not syncing in real-time
**Cause**: Real-time not enabled or subscription failed  
**Solution**:
- Check Supabase Dashboard → Database → Replication
- Verify tables have RLS enabled
- Check browser console for subscription errors

### Environment variables not loaded
**Cause**: .env file not read or server not restarted  
**Solution**:
- Ensure .env is in project root (not in subdirectory)
- Restart development server
- Clear cache and rebuild: `rm -rf node_modules/.vite && npm run dev`

## Performance Considerations

### Mock Mode
- ✅ Instant operations (no network)
- ✅ Works offline
- ❌ Limited to ~5-10 MB of data
- ❌ Data lost if localStorage cleared
- ❌ No cross-device sync

### Production Mode
- ✅ Unlimited data storage
- ✅ Cross-device sync
- ✅ Automatic backups
- ✅ Designed for 800K+ users
- ⚠️ Requires internet connection
- ⚠️ ~50-200ms latency per query (depending on region)

## Best Practices

### During Development
1. Use mock mode for rapid prototyping
2. Switch to production mode for integration testing
3. Use separate Supabase projects for dev/staging/production
4. Never commit .env with real credentials

### For Production
1. Use production Supabase project with backups
2. Enable email rate limiting
3. Configure proper RLS policies
4. Monitor database performance
5. Set up error tracking (Sentry, etc.)
6. Configure CORS properly
7. Use environment-specific configs

### Data Management
1. Regular backups (Supabase handles this on paid plans)
2. Monitor database size
3. Archive old data periodically
4. Clean expired sessions regularly
5. Monitor slow queries

## Rollback Plan

If you need to rollback to mock mode after migration:

1. **Backup current .env**
   ```bash
   cp .env .env.production
   ```

2. **Switch to mock mode**
   ```bash
   rm .env
   # or
   echo "VITE_USE_MOCK=true" > .env
   ```

3. **Restart server**
   ```bash
   npm run dev
   ```

4. **Restore from backup if needed**
   ```bash
   mv .env.production .env
   ```

## Support Checklist

Before asking for help:

- [ ] Verified .env file exists and has correct values
- [ ] Restarted development server
- [ ] Checked browser console for errors
- [ ] Verified Supabase project is active
- [ ] Ran complete schema.sql
- [ ] Checked RLS policies are enabled
- [ ] Tested with a fresh browser session (cleared cache)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed database setup
- [README.md](./README.md) - Project overview
- [Supabase Dashboard](https://app.supabase.com)

## Version Compatibility

| Component | Mock Mode | Production Mode |
|-----------|-----------|----------------|
| Authentication | ✅ Simulated | ✅ Supabase Auth |
| Database | ✅ localStorage | ✅ PostgreSQL |
| Real-time | ✅ localStorage events | ✅ WebSocket |
| File Storage | ❌ Not supported | ✅ Supabase Storage |
| Functions | ❌ Not supported | ✅ Edge Functions |

---

**Need Help?**  
- Check troubleshooting section above
- Review DATABASE_SETUP.md
- Check Supabase docs
- Contact development team

**Migration Status**: Complete ✅  
**Last Updated**: March 3, 2026
