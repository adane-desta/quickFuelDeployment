# 🗂️ QuickFuel Database ERD (Entity Relationship Diagram)

## 📊 Visual Database Structure

### Core Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUICKFUEL DATABASE SCHEMA                       │
│                         10 Tables • 68 Indexes                          │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   auth.users     │  (Supabase Auth)
                    │─────────────────│
                    │ • id (PK)        │
                    │ • email          │
                    │ • password       │
                    └────────┬─────────┘
                             │ 1:1
                             │ ON DELETE CASCADE
                             ▼
                    ┌──────────────────┐
          ┌─────────│      users       │◄────────┐
          │         │─────────────────│         │
          │         │ • id (PK, FK)    │         │
          │         │ • email          │         │
          │         │ • full_name      │         │
          │         │ • phone          │         │
          │         │ • role           │         │
          │         │ ──────────────── │         │
          │         │ Driver fields:   │         │
          │         │ • address        │         │
          │         │ • vehicle_model  │         │
          │         │ • plate_number   │         │
          │         │ • license_number │         │
          │         │ ──────────────── │         │
          │         │ Operator fields: │         │
          │         │ • station_id (FK)│─────┐   │
          │         │ ──────────────── │     │   │
          │         │ Admin fields:    │     │   │
          │         │ • employee_id    │     │   │
          │         │ • department     │     │   │
          │         └────────┬─────────┘     │   │
          │                  │               │   │
          │ 1:N              │ 1:N           │   │ 1:1
          │                  │               │   │ (operator_id)
          │                  ▼               ▼   │
  ┌───────┴────────┐  ┌──────────────────┐◄────┘
  │  reservations  │  │    stations      │
  │───────────────│  │─────────────────│
  │ • id (PK)      │  │ • id (PK)        │
  │ • driver_id(FK)│  │ • name           │
  │ • station_id(FK)├─►│ • address        │
  │ • fuel_type    │  │ • phone          │
  │ • quantity     │  │ • latitude       │
  │ • total_price  │  │ • longitude      │
  │ • status       │  │ • operator_id(FK)│
  │ • payment_status│ │ • petrol_stock   │
  │ • pickup_code  │  │ • diesel_stock   │
  │ • qr_code      │  │ • petrol_available│
  │ • scheduled_time│ │ • diesel_available│
  └───┬────────┬───┘  │ • is_verified    │
      │        │      │ • average_rating │
      │        │      └────┬─────┬────┬──┘
      │        │           │     │    │
      │ 1:1    │ 1:1       │ 1:N │ 1:N│ 1:N
      │        │           │     │    │
      ▼        ▼           ▼     ▼    ▼
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│payment_transactions│ │ queue_reports   │  │ fuel_analytics   │
│─────────────────│  │────────────────│  │─────────────────│
│ • id (PK)        │  │ • id (PK)       │  │ • id (PK)        │
│ • reservation_id │  │ • station_id(FK)│  │ • station_id(FK) │
│ • amount         │  │ • driver_id(FK) │  │ • reservation_id │
│ • payment_method │  │ • queue_length  │  │ • fuel_type      │
│ • transaction_ref│  │ • wait_time_min │  │ • quantity_disp  │
│ • status         │  │ • reported_at   │  │ • revenue        │
│ • gateway_txn_id │  └─────────────────┘  │ • profit         │
│ • initiated_at   │                       └──────────────────┘
│ • completed_at   │
└──────────────────┘
      │
      │ 1:1
      ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│     reviews      │      │  notifications   │      │ system_activity  │
│─────────────────│      │─────────────────│      │─────────────────│
│ • id (PK)        │      │ • id (PK)        │      │ • id (PK)        │
│ • driver_id (FK) │      │ • user_id (FK)   │      │ • user_id (FK)   │
│ • station_id (FK)│      │ • type           │      │ • action         │
│ • reservation_id │      │ • title          │      │ • description    │
│ • rating         │      │ • message        │      │ • category       │
│ • comment        │      │ • is_read        │      │ • ip_address     │
│ • service_rating │      │ • priority       │      │ • metadata       │
│ • cleanliness    │      │ • related_id     │      │ • success        │
│ • wait_time      │      │ • created_at     │      │ • created_at     │
└──────────────────┘      └──────────────────┘      └──────────────────┘

                    ┌──────────────────┐
                    │  fuel_prices     │  (System-wide)
                    │─────────────────│
                    │ • id (PK)        │
                    │ • fuel_type      │  (Petrol/Diesel)
                    │ • price_per_liter│
                    │ • effective_from │
                    │ • updated_by     │
                    └──────────────────┘
```

---

## 🔗 Relationship Details

### 1. **auth.users → users** (1:1)
- **Type**: One-to-one
- **Foreign Key**: users.id → auth.users.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Extend Supabase auth with custom profile
- **Trigger**: `handle_new_user()` auto-creates profile on signup

### 2. **users → stations** (1:1 for operators)
- **Type**: One-to-one (optional)
- **Foreign Key**: users.station_id → stations.id
- **Cascade**: ON DELETE SET NULL
- **Purpose**: Link operator to their station
- **Constraint**: Only operator role uses this

### 3. **users → stations (operator)** (1:1)
- **Type**: One-to-one
- **Foreign Key**: stations.operator_id → users.id
- **Cascade**: ON DELETE SET NULL
- **Purpose**: Assign station operator
- **Constraint**: Operator must exist before station assignment

### 4. **users → reservations (driver)** (1:N)
- **Type**: One-to-many
- **Foreign Key**: reservations.driver_id → users.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track driver's fuel reservations
- **Constraint**: Driver can have multiple active reservations

### 5. **stations → reservations** (1:N)
- **Type**: One-to-many
- **Foreign Key**: reservations.station_id → stations.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track station's reservations
- **Business Rule**: Station must have fuel available

### 6. **reservations → payment_transactions** (1:1)
- **Type**: One-to-one
- **Foreign Key**: payment_transactions.reservation_id → reservations.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track payment for reservation
- **Business Rule**: Payment must be 'paid' before completion

### 7. **reservations → reviews** (1:1)
- **Type**: One-to-one (optional)
- **Foreign Key**: reviews.reservation_id → reservations.id
- **Cascade**: ON DELETE SET NULL
- **Purpose**: Review after completed reservation
- **Constraint**: UNIQUE - one review per reservation

### 8. **stations → queue_reports** (1:N)
- **Type**: One-to-many
- **Foreign Key**: queue_reports.station_id → stations.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Crowd-sourced queue data
- **Freshness**: Only reports < 2 hours old are relevant

### 9. **users → queue_reports (driver)** (1:N)
- **Type**: One-to-many
- **Foreign Key**: queue_reports.driver_id → users.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track who submitted report
- **Constraint**: Only drivers can submit

### 10. **stations → fuel_analytics** (1:N)
- **Type**: One-to-many
- **Foreign Key**: fuel_analytics.station_id → stations.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track fuel sales and revenue
- **Trigger**: Auto-created on reservation completion

### 11. **reservations → fuel_analytics** (1:1)
- **Type**: One-to-one (optional)
- **Foreign Key**: fuel_analytics.reservation_id → reservations.id
- **Cascade**: ON DELETE SET NULL
- **Purpose**: Link analytics to reservation

### 12. **users → notifications** (1:N)
- **Type**: One-to-many
- **Foreign Key**: notifications.user_id → users.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Send alerts to users
- **Trigger**: Auto-created on status changes

### 13. **users → system_activity** (1:N)
- **Type**: One-to-many (optional)
- **Foreign Key**: system_activity.user_id → users.id
- **Cascade**: ON DELETE SET NULL
- **Purpose**: Audit trail of user actions
- **Note**: NULL user_id for system actions

### 14. **users → reviews (driver)** (1:N)
- **Type**: One-to-many
- **Foreign Key**: reviews.driver_id → users.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Track driver's reviews
- **Constraint**: Only drivers can create reviews

### 15. **stations → reviews** (1:N)
- **Type**: One-to-many
- **Foreign Key**: reviews.station_id → stations.id
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Station's received reviews
- **Updates**: Average rating calculated from reviews

---

## 📋 Cardinality Summary

| Relationship | Type | Notes |
|--------------|------|-------|
| auth.users ↔ users | 1:1 | Mandatory, cascading delete |
| users ↔ reservations | 1:N | Driver can have many reservations |
| stations ↔ reservations | 1:N | Station can have many reservations |
| users ↔ stations (operator) | 1:1 | Optional, for operators only |
| reservations ↔ payment_transactions | 1:1 | Each reservation has one payment |
| reservations ↔ reviews | 1:1 | Optional, after completion |
| stations ↔ queue_reports | 1:N | Many drivers report on one station |
| stations ↔ fuel_analytics | 1:N | Tracks all fuel transactions |
| users ↔ notifications | 1:N | User receives many notifications |
| users ↔ system_activity | 1:N | User performs many actions |

---

## 🎯 Key Constraints

### Primary Keys (PK)
- All tables use UUID as primary key
- Generated via `gen_random_uuid()` or from auth.users.id

### Foreign Keys (FK)
- **users.id** → auth.users.id (CASCADE)
- **users.station_id** → stations.id (SET NULL)
- **stations.operator_id** → users.id (SET NULL)
- **reservations.driver_id** → users.id (CASCADE)
- **reservations.station_id** → stations.id (CASCADE)
- **All other FK** → respective table.id

### Unique Constraints
- users.email
- users.plate_number
- fuel_prices.fuel_type
- reservations.pickup_code
- reservations.transaction_id
- payment_transactions.transaction_reference
- reviews.reservation_id (one review per reservation)

### Check Constraints
- phone: Ethiopian format `+251[97]XXXXXXXX`
- plate_number: Ethiopian format `AA-1-12345`
- latitude: 8.0 to 10.0 (Addis Ababa area)
- longitude: 37.0 to 40.0 (Addis Ababa area)
- rating: 1 to 5
- status: enum values
- positive amounts: > 0

---

## 🔄 Data Flow Examples

### Example 1: Driver Creates Reservation

```
1. Driver selects station
   └─► SELECT * FROM stations WHERE is_active = true

2. Driver creates reservation
   └─► INSERT INTO reservations (driver_id, station_id, ...)

3. System creates payment transaction
   └─► INSERT INTO payment_transactions (reservation_id, ...)

4. System sends notification
   └─► INSERT INTO notifications (user_id, type='reservation', ...)

5. System logs activity
   └─► INSERT INTO system_activity (user_id, action='CREATE_RESERVATION', ...)
```

### Example 2: Reservation Completion

```
1. Operator confirms pickup
   └─► UPDATE reservations SET status='completed'

2. Trigger reduces stock
   └─► UPDATE stations SET petrol_stock = petrol_stock - quantity

3. Trigger creates analytics
   └─► INSERT INTO fuel_analytics (station_id, revenue, ...)

4. Trigger sends notification
   └─► INSERT INTO notifications (user_id, type='reservation', ...)

5. Driver submits review
   └─► INSERT INTO reviews (driver_id, station_id, rating, ...)

6. Station rating updated
   └─► UPDATE stations SET average_rating = AVG(reviews.rating)
```

### Example 3: Queue Report Submission

```
1. Driver visits station
   └─► SELECT * FROM stations WHERE id = :station_id

2. Driver submits queue report
   └─► INSERT INTO queue_reports (station_id, driver_id, queue_length, ...)

3. System calculates average
   └─► SELECT calculate_average_wait_time(:station_id)

4. Station cache updated
   └─► UPDATE stations SET average_wait_time = :calculated_avg
```

---

## 🔒 Security Implementation

### Row Level Security (RLS) Policies

**Pattern 1: Own Data Only** (notifications, reviews by driver)
```sql
CREATE POLICY "select_own" ON table_name
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

**Pattern 2: Role-Based Access** (admin sees all)
```sql
CREATE POLICY "select_admin" ON table_name
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

**Pattern 3: Relationship-Based** (operator sees their station)
```sql
CREATE POLICY "select_operator" ON reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = reservations.station_id 
      AND operator_id = auth.uid()
    )
  );
```

**Pattern 4: Public Data** (stations, fuel_prices)
```sql
CREATE POLICY "select_all" ON stations
  FOR SELECT TO authenticated
  USING (true);
```

---

## 📊 Index Strategy

### Types of Indexes Used

1. **B-tree** (default): Foreign keys, status fields
2. **GIST**: Geospatial queries on lat/lng
3. **Partial**: WHERE clauses for filtered queries
4. **Composite**: Multi-column queries

### Index Naming Convention
```
idx_{table}_{column}_{optional_type}

Examples:
- idx_users_role
- idx_stations_location (GIST)
- idx_notifications_unread (partial)
- idx_reservations_status
```

---

## 🎨 Data Types

### Standard Types
- **UUID**: All primary keys and foreign keys
- **TEXT**: String data (no length limit)
- **DECIMAL(10,2)**: Money values (max 99,999,999.99)
- **INTEGER**: Counts, ratings
- **BOOLEAN**: Flags
- **TIMESTAMPTZ**: All timestamps (with timezone)
- **DATE**: Effective dates
- **JSONB**: Structured metadata

### Custom Types (via CHECK constraints)
- Role: 'admin', 'driver', 'operator'
- Status: 'pending', 'confirmed', 'completed', 'cancelled'
- Payment Status: 'pending', 'paid', 'failed', 'refunded'
- Fuel Type: 'Petrol', 'Diesel'
- Priority: 'low', 'normal', 'high', 'urgent'

---

## 🚀 Performance Characteristics

### Query Performance

| Operation | Expected Performance | Index Used |
|-----------|---------------------|------------|
| Get user by email | < 1ms | idx_users_email (unique) |
| Get user reservations | < 5ms | idx_reservations_driver |
| Find nearby stations | < 10ms | idx_stations_location (GIST) |
| Get unread notifications | < 5ms | idx_notifications_unread (partial) |
| Station analytics | < 50ms | idx_fuel_analytics_station |
| Recent queue reports | < 10ms | idx_queue_reports_recent (partial) |

### Table Size Estimates (1000 active users)

| Table | Expected Rows | Size Estimate |
|-------|---------------|---------------|
| users | 1,000 | ~1 MB |
| stations | 100 | ~100 KB |
| reservations | 10,000 | ~5 MB |
| notifications | 50,000 | ~20 MB |
| queue_reports | 100,000 | ~40 MB |
| fuel_analytics | 20,000 | ~10 MB |
| system_activity | 200,000 | ~100 MB |
| reviews | 5,000 | ~2 MB |
| payment_transactions | 10,000 | ~5 MB |
| fuel_prices | 2 | ~8 KB |

**Total: ~183 MB** for 1000 active users

---

## ✅ Database Design Principles Applied

1. ✅ **Normalization**: All tables in 3NF
2. ✅ **Referential Integrity**: Foreign keys with cascades
3. ✅ **Data Consistency**: Check constraints and triggers
4. ✅ **Security**: RLS on every table
5. ✅ **Performance**: Strategic indexing
6. ✅ **Audit Trail**: Complete activity logging
7. ✅ **Scalability**: UUID keys, partitionable
8. ✅ **Maintainability**: Clear naming, documentation

---

## 📚 Legend

```
Symbol | Meaning
───────┼──────────────────────────
PK     │ Primary Key
FK     │ Foreign Key
1:1    │ One-to-one relationship
1:N    │ One-to-many relationship
N:M    │ Many-to-many relationship
►      │ Relationship direction
◄      │ Bidirectional relationship
```

---

This ERD represents a **complete, production-ready database** designed specifically for the Ethiopian fuel station market with QuickFuel! 🚀
