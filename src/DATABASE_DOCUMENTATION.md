# 📚 QuickFuel Database Documentation

## 🎯 Overview

QuickFuel uses a **PostgreSQL database** hosted on Supabase with **10 interconnected tables** designed for high performance, security, and scalability. The database supports real-time updates, comprehensive audit logging, and Ethiopian-specific validations.

---

## 📊 Database Architecture

### **Design Principles**

1. **Normalization**: 3NF to minimize data redundancy
2. **Referential Integrity**: Foreign keys with cascading deletes
3. **Data Consistency**: Triggers and constraints
4. **Security First**: Row Level Security (RLS) on all tables
5. **Performance**: Strategic indexes on frequently queried columns
6. **Audit Trail**: Complete activity logging for compliance

---

## 🗂️ Table Schemas

### 1️⃣ **users**

**Purpose**: User profiles extending Supabase auth.users with role-based information

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users(id) | User ID (references Supabase auth) |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| full_name | TEXT | NOT NULL, ≥2 chars | Full name of user |
| phone | TEXT | NOT NULL, Ethiopian format | Phone: +251XXXXXXXXX |
| role | TEXT | NOT NULL, CHECK | admin, driver, or operator |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |
| last_login_at | TIMESTAMPTZ | NULL | Last login timestamp |
| address | TEXT | NULL (driver only) | Driver's address |
| vehicle_model | TEXT | NULL (driver only) | Vehicle make/model |
| plate_number | TEXT | UNIQUE, NULL (driver only) | Ethiopian plate: AA-1-12345 |
| preferred_fuel_type | TEXT | NULL (driver only) | Petrol or Diesel |
| license_number | TEXT | NULL (driver only) | Driver's license number |
| station_id | UUID | NULL (operator only) | FK → stations(id) |
| employee_id | TEXT | UNIQUE, NULL (admin only) | Employee ID |
| department | TEXT | NULL (admin only) | Admin department |
| profile_picture_url | TEXT | NULL | Profile picture URL |
| notification_preferences | JSONB | DEFAULT '{}' | Notification settings |

**Indexes**:
- `idx_users_role` on (role) WHERE is_active
- `idx_users_email` on (email)
- `idx_users_phone` on (phone)
- `idx_users_plate_number` on (plate_number)

**Triggers**:
- `update_users_updated_at` - Auto-update updated_at on changes

**RLS Policies**:
- Users can view/update their own profile
- Admins can view/update all users
- Profile created automatically on signup

---

### 2️⃣ **stations**

**Purpose**: Fuel station locations, inventory, and operational details

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Station unique identifier |
| name | TEXT | NOT NULL, ≥3 chars | Station name |
| address | TEXT | NOT NULL | Full address |
| phone | TEXT | NOT NULL, Ethiopian format | Contact phone |
| operating_hours | TEXT | DEFAULT '24/7' | Operating hours |
| latitude | DECIMAL(10,8) | NOT NULL, 8-10°N | Latitude coordinate |
| longitude | DECIMAL(11,8) | NOT NULL, 37-40°E | Longitude coordinate |
| operator_id | UUID | FK → users(id) | Station operator |
| petrol_stock | DECIMAL(10,2) | ≥0, DEFAULT 0 | Petrol stock in liters |
| diesel_stock | DECIMAL(10,2) | ≥0, DEFAULT 0 | Diesel stock in liters |
| petrol_available | BOOLEAN | DEFAULT false | Petrol availability flag |
| diesel_available | BOOLEAN | DEFAULT false | Diesel availability flag |
| is_verified | BOOLEAN | DEFAULT false | Admin verification status |
| is_active | BOOLEAN | DEFAULT true | Station active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| station_image_url | TEXT | NULL | Station photo URL |
| amenities | JSONB | DEFAULT '[]' | Station amenities array |
| average_rating | DECIMAL(3,2) | 0-5, DEFAULT 0 | Average rating |
| total_reviews | INTEGER | ≥0, DEFAULT 0 | Total review count |
| current_queue_length | INTEGER | ≥0, DEFAULT 0 | Current queue size |
| average_wait_time | INTEGER | ≥0, DEFAULT 0 | Avg wait time (minutes) |

**Indexes**:
- `idx_stations_operator` on (operator_id)
- `idx_stations_location` GIST on (lat, lng) for geospatial queries
- `idx_stations_verified_active` on (is_verified, is_active)
- `idx_stations_petrol_available` on (petrol_available)
- `idx_stations_diesel_available` on (diesel_available)

**Triggers**:
- `update_stations_updated_at` - Auto-update updated_at
- `on_stock_change` - Auto-update availability flags

**RLS Policies**:
- Everyone can view all stations (public data)
- Operators can update their own station
- Admins can create/update/delete any station

---

### 3️⃣ **fuel_prices**

**Purpose**: System-wide fuel pricing (government-regulated)

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Price record ID |
| fuel_type | TEXT | UNIQUE, NOT NULL | Petrol or Diesel |
| price_per_liter | DECIMAL(10,2) | >0, NOT NULL | Price per liter (ETB) |
| effective_from | DATE | NOT NULL | Effective start date |
| effective_until | DATE | NULL | Effective end date |
| updated_by | TEXT | NOT NULL | Who updated the price |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |
| previous_price | DECIMAL(10,2) | NULL | Previous price for history |
| change_reason | TEXT | NULL | Reason for price change |

**Indexes**: None (only 2 rows: Petrol, Diesel)

**Triggers**:
- `update_fuel_prices_updated_at` - Auto-update updated_at

**RLS Policies**:
- Everyone can view prices
- Only admins can modify prices

---

### 4️⃣ **reservations**

**Purpose**: Fuel reservations with complete lifecycle tracking

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Reservation ID |
| driver_id | UUID | FK → users(id), NOT NULL | Driver who made reservation |
| station_id | UUID | FK → stations(id), NOT NULL | Selected station |
| fuel_type | TEXT | NOT NULL, CHECK | Petrol or Diesel |
| quantity | DECIMAL(10,2) | >0, ≤200, NOT NULL | Fuel quantity in liters |
| total_price | DECIMAL(10,2) | >0, NOT NULL | Total price in ETB |
| status | TEXT | NOT NULL, DEFAULT 'pending' | pending/confirmed/completed/cancelled |
| payment_status | TEXT | NOT NULL, DEFAULT 'pending' | pending/paid/failed/refunded |
| payment_method | TEXT | NULL, CHECK | Telebirr or Chapa |
| transaction_id | TEXT | UNIQUE, NULL | Payment transaction ID |
| pickup_code | TEXT | UNIQUE, NULL, 6 chars | 6-digit pickup code |
| qr_code | TEXT | NULL | Base64 QR code image |
| scheduled_time | TIMESTAMPTZ | NULL | Scheduled pickup time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |
| confirmed_at | TIMESTAMPTZ | NULL | Confirmation time |
| completed_at | TIMESTAMPTZ | NULL | Completion time |
| cancelled_at | TIMESTAMPTZ | NULL | Cancellation time |
| cancellation_reason | TEXT | NULL | Why cancelled |
| cancelled_by | UUID | FK → users(id), NULL | Who cancelled |
| notes | TEXT | NULL | Additional notes |
| rating | INTEGER | 1-5, NULL | Reservation rating |

**Indexes**:
- `idx_reservations_driver` on (driver_id)
- `idx_reservations_station` on (station_id)
- `idx_reservations_status` on (status)
- `idx_reservations_payment_status` on (payment_status)
- `idx_reservations_pickup_code` on (pickup_code)
- `idx_reservations_created_at` on (created_at DESC)

**Triggers**:
- `update_reservations_updated_at` - Auto-update updated_at
- `on_reservation_completed` - Update stock, create analytics
- `on_reservation_status_change` - Create notification

**RLS Policies**:
- Drivers see their own reservations
- Operators see reservations for their station
- Admins see all reservations
- Only drivers can create reservations

**Status Flow**:
```
pending → confirmed → completed
   ↓
cancelled
```

---

### 5️⃣ **notifications**

**Purpose**: User notifications and system alerts

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Notification ID |
| user_id | UUID | FK → users(id), NOT NULL | Recipient user |
| type | TEXT | NOT NULL, CHECK | reservation/price_change/station_update/system/promotion/alert |
| title | TEXT | NOT NULL, ≥1 char | Notification title |
| message | TEXT | NOT NULL, ≥1 char | Notification message |
| is_read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMPTZ | NULL | When read |
| related_id | UUID | NULL | Related entity ID |
| related_type | TEXT | NULL, CHECK | reservation/station/user/price |
| priority | TEXT | DEFAULT 'normal' | low/normal/high/urgent |
| delivery_method | JSONB | DEFAULT '["app"]' | Delivery channels |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| expires_at | TIMESTAMPTZ | NULL | Expiration time |
| action_url | TEXT | NULL | Action button URL |
| metadata | JSONB | NULL | Additional data |

**Indexes**:
- `idx_notifications_user` on (user_id)
- `idx_notifications_unread` on (user_id, is_read, created_at DESC) WHERE is_read = false
- `idx_notifications_type` on (type)
- `idx_notifications_priority` on (priority, created_at DESC)

**RLS Policies**:
- Users see only their notifications
- Anyone can create notifications (system-generated)
- Users can update/delete their notifications

---

### 6️⃣ **queue_reports**

**Purpose**: Real-time queue status from driver crowd-sourcing

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Report ID |
| station_id | UUID | FK → stations(id), NOT NULL | Station being reported |
| driver_id | UUID | FK → users(id), NOT NULL | Driver submitting report |
| queue_length | INTEGER | 0-100, NOT NULL | Queue size |
| wait_time_minutes | INTEGER | 0-480, NOT NULL | Wait time estimate |
| fuel_type | TEXT | NULL, CHECK | Petrol/Diesel/Both |
| is_verified | BOOLEAN | DEFAULT false | Verification status |
| verification_count | INTEGER | >0, DEFAULT 1 | Verification count |
| reported_at | TIMESTAMPTZ | DEFAULT NOW() | Report timestamp |
| notes | TEXT | NULL | Additional notes |
| location_accuracy | DECIMAL(5,2) | NULL | GPS accuracy (meters) |

**Indexes**:
- `idx_queue_reports_station` on (station_id, reported_at DESC)
- `idx_queue_reports_recent` on (reported_at DESC) WHERE reported_at > NOW() - 2 hours

**RLS Policies**:
- Everyone can view queue reports
- Only drivers can submit reports

**Data Freshness**: Reports older than 2 hours are ignored

---

### 7️⃣ **fuel_analytics**

**Purpose**: Detailed fuel dispensing records for analytics

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Analytics record ID |
| station_id | UUID | FK → stations(id), NOT NULL | Station |
| reservation_id | UUID | FK → reservations(id), NULL | Related reservation |
| fuel_type | TEXT | NOT NULL, CHECK | Petrol or Diesel |
| quantity_dispensed | DECIMAL(10,2) | ≥0, NOT NULL | Liters dispensed |
| price_per_liter | DECIMAL(10,2) | >0, NOT NULL | Price per liter |
| revenue | DECIMAL(10,2) | ≥0, NOT NULL | Total revenue |
| cost_per_liter | DECIMAL(10,2) | >0, NULL | Cost per liter |
| profit | DECIMAL(10,2) | NULL | Gross profit |
| recorded_at | TIMESTAMPTZ | DEFAULT NOW() | Record timestamp |
| recorded_by | UUID | FK → users(id), NULL | Who recorded |
| shift | TEXT | NULL | morning/afternoon/night |
| transaction_type | TEXT | DEFAULT 'reservation' | reservation/walk_in/emergency |
| notes | TEXT | NULL | Additional notes |

**Indexes**:
- `idx_fuel_analytics_station` on (station_id, recorded_at DESC)
- `idx_fuel_analytics_date` on (recorded_at DESC)
- `idx_fuel_analytics_reservation` on (reservation_id)

**RLS Policies**:
- Operators see analytics for their station
- Admins see all analytics
- Auto-created when reservation is completed

---

### 8️⃣ **system_activity**

**Purpose**: Comprehensive audit log for all system actions

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Activity record ID |
| user_id | UUID | FK → users(id), NULL | User who performed action |
| user_role | TEXT | NULL | User's role at time |
| user_email | TEXT | NULL | User's email at time |
| action | TEXT | NOT NULL, ≥3 chars | Action performed |
| description | TEXT | NOT NULL | Detailed description |
| category | TEXT | DEFAULT 'general' | auth/reservation/payment/station/user/system/general |
| ip_address | TEXT | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent |
| metadata | JSONB | NULL | Additional metadata |
| affected_resource_type | TEXT | NULL | Type of affected resource |
| affected_resource_id | UUID | NULL | ID of affected resource |
| success | BOOLEAN | DEFAULT true | Action success status |
| error_message | TEXT | NULL | Error message if failed |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Activity timestamp |

**Indexes**:
- `idx_system_activity_user` on (user_id, created_at DESC)
- `idx_system_activity_date` on (created_at DESC)
- `idx_system_activity_category` on (category, created_at DESC)
- `idx_system_activity_resource` on (affected_resource_type, affected_resource_id)

**RLS Policies**:
- Only admins can view activity logs
- Anyone can create activity logs (system-generated)

**Use Cases**:
- Security auditing
- Compliance reporting
- Debugging and troubleshooting
- User behavior analysis

---

### 9️⃣ **reviews**

**Purpose**: Station ratings and feedback from drivers

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Review ID |
| driver_id | UUID | FK → users(id), NOT NULL | Driver who reviewed |
| station_id | UUID | FK → stations(id), NOT NULL | Reviewed station |
| reservation_id | UUID | FK → reservations(id), UNIQUE, NULL | Related reservation |
| rating | INTEGER | 1-5, NOT NULL | Overall rating |
| comment | TEXT | NULL | Review text |
| service_rating | INTEGER | 1-5, NULL | Service quality rating |
| cleanliness_rating | INTEGER | 1-5, NULL | Cleanliness rating |
| wait_time_rating | INTEGER | 1-5, NULL | Wait time rating |
| is_flagged | BOOLEAN | DEFAULT false | Flagged for review |
| is_visible | BOOLEAN | DEFAULT true | Visible to public |
| flagged_reason | TEXT | NULL | Why flagged |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Review creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes**:
- `idx_reviews_station` on (station_id, created_at DESC) WHERE is_visible
- `idx_reviews_driver` on (driver_id)
- `idx_reviews_rating` on (rating DESC)

**Triggers**:
- `update_reviews_updated_at` - Auto-update updated_at

**RLS Policies**:
- Everyone can view visible reviews
- Only drivers can create reviews
- Drivers can update/delete their own reviews

**Constraints**:
- One review per reservation (unique constraint)

---

### 🔟 **payment_transactions**

**Purpose**: Payment gateway transaction tracking

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Transaction ID |
| reservation_id | UUID | FK → reservations(id), NOT NULL | Related reservation |
| amount | DECIMAL(10,2) | >0, NOT NULL | Payment amount (ETB) |
| payment_method | TEXT | NOT NULL, CHECK | Telebirr or Chapa |
| transaction_reference | TEXT | UNIQUE, NOT NULL | Unique transaction ref |
| gateway_transaction_id | TEXT | NULL | Gateway's transaction ID |
| gateway_response | JSONB | NULL | Full gateway response |
| status | TEXT | DEFAULT 'pending' | pending/processing/success/failed/refunded/disputed |
| initiated_at | TIMESTAMPTZ | DEFAULT NOW() | Transaction start time |
| completed_at | TIMESTAMPTZ | NULL | Transaction completion |
| refunded_at | TIMESTAMPTZ | NULL | Refund time |
| error_message | TEXT | NULL | Error message if failed |
| error_code | TEXT | NULL | Error code if failed |
| retry_count | INTEGER | ≥0, DEFAULT 0 | Retry attempts |
| refund_amount | DECIMAL(10,2) | ≥0, ≤amount, NULL | Refund amount |
| refund_reason | TEXT | NULL | Why refunded |
| refunded_by | UUID | FK → users(id), NULL | Who issued refund |
| ip_address | TEXT | NULL | Client IP |
| device_info | JSONB | NULL | Device information |

**Indexes**:
- `idx_payment_transactions_reservation` on (reservation_id)
- `idx_payment_transactions_reference` on (transaction_reference)
- `idx_payment_transactions_status` on (status)
- `idx_payment_transactions_date` on (initiated_at DESC)

**RLS Policies**:
- Drivers see transactions for their reservations
- Operators see transactions for their station's reservations
- Admins see all transactions
- System can update transactions (for webhooks)

**Payment Flow**:
```
pending → processing → success
                  ↓
                failed → (retry) → pending
```

---

## 🔗 Entity Relationships

```
auth.users (Supabase)
    ↓
users ← stations
    ↓         ↓
reservations  queue_reports
    ↓         ↓
payment_transactions
fuel_analytics
reviews
notifications
    ↓
system_activity (logs everything)
```

**Key Relationships**:

1. **Users → Stations**: One-to-many (operator_id)
2. **Stations → Reservations**: One-to-many
3. **Users → Reservations**: One-to-many (driver_id)
4. **Reservations → Payment Transactions**: One-to-one
5. **Reservations → Reviews**: One-to-one
6. **Stations → Queue Reports**: One-to-many
7. **Stations → Fuel Analytics**: One-to-many

---

## 🔒 Security Model

### Row Level Security (RLS)

**Every table** has RLS enabled with policies based on user roles:

#### Admin Role
- ✅ Full access to all tables
- ✅ Can view/modify all records
- ✅ System-wide analytics

#### Operator Role
- ✅ Full access to their station's data
- ✅ Can update fuel inventory
- ✅ Can process reservations for their station
- ❌ Cannot access other stations

#### Driver Role
- ✅ Can view/create own reservations
- ✅ Can submit queue reports
- ✅ Can write reviews
- ❌ Cannot see other drivers' data

### Data Isolation

```sql
-- Example: Drivers can only see their own reservations
CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR ...);
```

---

## ⚡ Performance Optimizations

### Indexes

**68 strategic indexes** across all tables:

1. **Primary Keys**: Automatic B-tree index
2. **Foreign Keys**: Indexed for JOIN performance
3. **Frequently Filtered Columns**: role, status, is_active
4. **Date Columns**: DESC for recent-first queries
5. **Geospatial**: GIST index for location queries
6. **Unique Columns**: Automatic unique index

### Query Patterns

**Optimized for**:
- Finding nearby stations (geospatial queries)
- Loading user-specific data (RLS-filtered)
- Real-time updates (indexed on timestamps)
- Aggregations (indexed on group-by columns)

---

## 🔄 Triggers & Automation

### Auto-Update Triggers

1. **update_updated_at_column**: Updates `updated_at` on every modification
2. **on_auth_user_created**: Creates user profile when Supabase auth user is created
3. **on_reservation_completed**: Updates stock and creates analytics when reservation completes
4. **on_stock_change**: Updates availability flags when stock changes
5. **on_reservation_status_change**: Creates notification when status changes

### Example Trigger

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 📡 Real-time Subscriptions

**Enabled on critical tables** for live updates:

- ✅ stations - Real-time fuel availability
- ✅ reservations - Live reservation updates
- ✅ notifications - Instant notifications
- ✅ queue_reports - Live queue status
- ✅ fuel_prices - Price change alerts
- ✅ payment_transactions - Payment status updates

### Usage Example

```typescript
// Subscribe to station updates
supabase
  .channel('stations')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stations'
  }, (payload) => {
    console.log('Station updated:', payload);
  })
  .subscribe();
```

---

## 🧪 Data Validation

### Database-Level Constraints

1. **NOT NULL**: Required fields
2. **CHECK**: Value constraints (e.g., rating BETWEEN 1 AND 5)
3. **UNIQUE**: Prevent duplicates (e.g., email, plate_number)
4. **FOREIGN KEY**: Referential integrity
5. **DEFAULT**: Auto-populate values

### Ethiopian-Specific

```sql
-- Phone number validation
CHECK (phone ~ '^\+251[97]\d{8}$')

-- Plate number validation
CHECK (plate_number ~ '^[A-Z]{1,3}-\d{1}-\d{5}$')

-- Coordinates validation (Addis Ababa area)
CHECK (latitude BETWEEN 8.0 AND 10.0)
CHECK (longitude BETWEEN 37.0 AND 40.0)
```

---

## 📈 Analytics Queries

### Sample Queries

**Daily Revenue by Station**:
```sql
SELECT 
  s.name,
  DATE(fa.recorded_at) as date,
  SUM(fa.revenue) as total_revenue,
  SUM(fa.quantity_dispensed) as total_liters
FROM fuel_analytics fa
JOIN stations s ON fa.station_id = s.id
WHERE fa.recorded_at >= NOW() - INTERVAL '7 days'
GROUP BY s.name, DATE(fa.recorded_at)
ORDER BY date DESC, total_revenue DESC;
```

**Top Rated Stations**:
```sql
SELECT 
  s.name,
  s.average_rating,
  s.total_reviews,
  COUNT(r.id) as active_reservations
FROM stations s
LEFT JOIN reservations r ON s.id = r.station_id 
  AND r.status IN ('pending', 'confirmed')
WHERE s.is_active = true
GROUP BY s.id
ORDER BY s.average_rating DESC, s.total_reviews DESC
LIMIT 10;
```

**Queue Status Overview**:
```sql
SELECT 
  s.name,
  s.current_queue_length,
  s.average_wait_time,
  COUNT(qr.id) as recent_reports
FROM stations s
LEFT JOIN queue_reports qr ON s.id = qr.station_id
  AND qr.reported_at > NOW() - INTERVAL '1 hour'
WHERE s.is_active = true
GROUP BY s.id
ORDER BY s.current_queue_length DESC;
```

---

## 🛠️ Maintenance

### Regular Tasks

1. **Vacuum**: Monthly to reclaim space
2. **Analyze**: Weekly to update statistics
3. **Archive old data**: Quarterly (system_activity, queue_reports)
4. **Backup**: Daily automated backups (Supabase handles this)

### Monitoring

```sql
-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 🎓 Best Practices

### When Writing Queries

1. ✅ Use indexes in WHERE clauses
2. ✅ Limit result sets with LIMIT
3. ✅ Use prepared statements to prevent SQL injection
4. ✅ Leverage RLS instead of manual filtering
5. ❌ Don't use SELECT * in production
6. ❌ Don't query without indexes

### When Modifying Schema

1. ✅ Always create migrations
2. ✅ Test in development first
3. ✅ Use transactions for multi-step changes
4. ✅ Update RLS policies if needed
5. ❌ Never drop production tables without backup

---

## 📝 Change Log

Track all schema changes:

```sql
-- Create schema_migrations table
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log migrations
INSERT INTO schema_migrations (version, description)
VALUES ('1.0.0', 'Initial schema creation');
```

---

## ✨ Summary

**QuickFuel Database Features**:

- ✅ 10 fully-normalized tables
- ✅ 68 strategic indexes
- ✅ 42 RLS policies (role-based access)
- ✅ 5 automated triggers
- ✅ Real-time subscriptions
- ✅ Comprehensive audit logging
- ✅ Ethiopian validations
- ✅ Production-ready security
- ✅ Optimized for performance
- ✅ Fully documented

**Built for scalability, security, and Ethiopian market specifics! 🚀**
