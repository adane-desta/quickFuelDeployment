# QuickFuel ⛽

**A Smart Fuel Reservation System for Jimma town**

QuickFuel is a comprehensive web application that solves the critical fuel shortage and queue management problem in Jimma town by enabling drivers to reserve fuel in advance, view real-time station availability, and skip long waiting lines.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [UML Diagrams](#-uml-diagrams)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚨 Problem Statement

Ethiopia faces a severe fuel crisis with:

- **Long Waiting Queues**: Drivers spend 2-4 hours waiting in fuel station queues daily
- **Fuel Uncertainty**: No visibility into which stations have fuel available
- **No Reservation System**: First-come-first-serve creates chaos and inefficiency
- **Time Waste**: Hours lost in unproductive waiting affects economic productivity
- **Manual Queue Management**: Station operators struggle to manage crowds manually

---

## ✨ Solution

QuickFuel provides a digital platform that:

- **Real-Time Availability**: Shows live fuel inventory across all stations
- **Smart Reservations**: Book fuel in advance with time slot management
- **Digital Payments**: Secure online payment processing
- **QR Code Pickup**: Quick verification and fuel dispensing with QR codes
- **Weekly Quota Management**: Track fuel consumption limits per vehicle class
- **Multi-Role System**: Separate interfaces for Drivers, Station Owners, Operators, and Admins

---

## 🎯 Features

### For Drivers
- 🔍 **Find Nearby Stations**: View fuel stations on interactive map with real-time availability
- 📅 **Make Reservations**: Book fuel with specific time slots
- 💳 **Digital Payment**: Pay online via secure payment gateway
- 📱 **QR Code/Pickup Code**: Digital verification for quick fuel pickup
- 📊 **Weekly Quota Tracking**: Monitor remaining fuel quota based on vehicle class
- 🔔 **Notifications**: Real-time alerts for reservation status
- 📜 **Reservation History**: View past and active reservations
- 🚫 **Request Refunds**: Cancel reservations and request refunds

### For Station Owners
- 🏪 **Manage Station Details**: Update station information, operating hours, location
- ⛽ **Fuel Inventory Management**: Track and update fuel stock levels
- 👀 **View Reservations**: See all reservations for owned stations
- ✅ **Approve Refunds**: Process refund requests from drivers
- 👥 **Operator Management**: Add/remove operators for stations
- 📦 **Request Deliveries**: Order fuel deliveries from suppliers
- 📊 **Station Analytics**: View station performance metrics

### For Operators (Station Staff)
- ✔️ **Verify Pickup Codes**: Scan QR codes or enter pickup codes
- ⛽ **Dispense Fuel**: Mark reservations as fulfilled after dispensing
- 📋 **Today's Reservations**: View all scheduled pickups for the day
- ⏰ **Queue Management**: Monitor real-time queue status
- 🔔 **Notifications**: Alerts for upcoming reservations

### For Admins
- 🚗 **Manage Car Classes**: Create/update vehicle classifications and weekly quotas
- 👤 **User Management**: Create and manage users across all roles
- 🏪 **Verify Stations**: Approve new station registrations
- ✅ **Approve Refunds**: Final approval for refund requests
- 📊 **System Analytics**: View platform-wide metrics and performance
- 📈 **Reports**: Generate system activity reports
- 💰 **Fuel Price Management**: Set and update fuel prices
- ⛽ **Manage Fuel Types**: Add/edit fuel type configurations

---

## 🛠 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Router 7** - Client-side routing
- **Recharts** - Data visualization
- **QRCode.react** - QR code generation
- **Motion (Framer Motion)** - Animations
- **Sonner** - Toast notifications

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & Authorization
  - Row Level Security (RLS)
  - Storage for images

### Development Tools
- **Vite** - Build tool and dev server
- **pnpm** - Package manager
- **ESLint** - Code linting

---

## 🏗 Architecture

QuickFuel follows a **3-tier architecture**:

### 1. Frontend Layer (React + TypeScript)
- Component-based UI with role-specific layouts
- Client-side routing with React Router
- State management via React Context (AuthContext)
- Real-time data updates via Supabase subscriptions

### 2. Backend Layer (Supabase)
- RESTful API via Supabase client
- Real-time database subscriptions
- Authentication with JWT tokens
- Row-level security policies
- Edge functions for complex operations

### 3. Data Layer (PostgreSQL)
- Normalized relational database
- Foreign key constraints
- Indexes for performance
- Stored procedures and triggers
- Real-time change notifications

**See [Component Diagram](#component-diagram) and [Deployment Diagram](#deployment-diagram) for visual architecture.**

---

## 🗄 Database Schema

### Core Tables

#### `users`
- `id` (UUID, PK) - Unique user identifier
- `email` (VARCHAR, UNIQUE) - User email
- `password_hash` (VARCHAR) - Hashed password
- `full_name` (VARCHAR) - User's full name
- `role` (ENUM) - User role: 'driver', 'operator', 'admin', 'station_owner'
- `created_at` (TIMESTAMP) - Account creation date

#### `drivers`
- `driver_id` (UUID, PK, FK → users)
- `phone_number` (VARCHAR)
- `vehicle_class_id` (UUID, FK → vehicle_classes)
- `license_number` (VARCHAR, UNIQUE)
- `vehicle_plate_number` (VARCHAR)

#### `vehicle_classes`
- `id` (UUID, PK)
- `class_name` (VARCHAR) - e.g., "Taxi", "Private Car", "Bus"
- `weekly_fuel_limit` (DECIMAL) - Liters per week
- `description` (TEXT)

#### `stations`
- `id` (UUID, PK)
- `name` (VARCHAR) - Station name
- `owner_id` (UUID, FK → station_owners)
- `address` (TEXT)
- `latitude` (DECIMAL)
- `longitude` (DECIMAL)
- `is_verified` (BOOLEAN) - Admin approval status
- `operating_hours` (JSONB) - Opening/closing times

#### `fuel_inventory`
- `id` (UUID, PK)
- `station_id` (UUID, FK → stations)
- `fuel_type` (VARCHAR) - e.g., "Gasoline", "Diesel"
- `current_stock` (DECIMAL) - Liters available
- `price_per_liter` (DECIMAL)
- `last_updated` (TIMESTAMP)

#### `reservations`
- `id` (UUID, PK)
- `driver_id` (UUID, FK → drivers)
- `station_id` (UUID, FK → stations)
- `fuel_type` (VARCHAR)
- `quantity` (DECIMAL) - Liters reserved
- `total_price` (DECIMAL)
- `reservation_time` (TIMESTAMP) - Pickup time slot
- `status` (ENUM) - 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
- `pickup_code` (VARCHAR, UNIQUE) - 6-digit verification code
- `qr_code_data` (TEXT) - QR code payload
- `created_at` (TIMESTAMP)

#### `payments`
- `id` (UUID, PK)
- `reservation_id` (UUID, FK → reservations)
- `amount` (DECIMAL)
- `payment_method` (VARCHAR) - e.g., "credit_card", "mobile_money"
- `payment_status` (ENUM) - 'pending', 'completed', 'failed', 'refunded'
- `transaction_id` (VARCHAR, UNIQUE)
- `payment_date` (TIMESTAMP)

#### `weekly_fuel_consumption`
- `id` (UUID, PK)
- `driver_id` (UUID, FK → drivers)
- `week_start_date` (DATE)
- `total_consumed` (DECIMAL) - Liters consumed this week
- `last_updated` (TIMESTAMP)

**See [Persistent Modeling Diagram](#persistent-modeling) for complete schema with relationships.**

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **pnpm**
- **Supabase** account (free tier available)
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/quickfuel.git
cd quickfuel
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the project URL and anon key
   - Run the database migrations (see `database-schema.sql`)

4. **Configure environment variables**
```bash
# Create .env file in root directory
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. **Run the development server**
```bash
pnpm run dev
```

The application will be available at `https://quick-fuel-ochre.vercel.app`

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. **Create tables** 
2. **Set up Row Level Security policies**
3. **Create indexes** for performance
4. **Seed initial data** (optional)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Payment Gateway (Optional - for production)
VITE_PAYMENT_GATEWAY_KEY=your-payment-gateway-key

# Application Settings
VITE_APP_NAME=QuickFuel
VITE_API_BASE_URL=https://api.quickfuel.app
```

**⚠️ Important**: Never commit `.env` to version control. Add it to `.gitignore`.

---

## 📁 Project Structure

```
quickfuel/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/              # Admin dashboard components
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── SystemAnalytics.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── StationManagement.tsx
│   │   │   │   └── ...
│   │   │   ├── driver/             # Driver-specific components
│   │   │   │   ├── DriverLayout.tsx
│   │   │   │   ├── ActiveReservations.tsx
│   │   │   │   └── ...
│   │   │   ├── operator/           # Operator components
│   │   │   │   ├── OperatorDashboard.tsx
│   │   │   │   ├── PickupVerification.tsx
│   │   │   │   └── ...
│   │   │   ├── station_owner/      # Station owner components
│   │   │   │   ├── OwnerDashboard.tsx
│   │   │   │   ├── FuelInventory.tsx
│   │   │   │   └── ...
│   │   │   ├── auth/               # Authentication components
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterDriver.tsx
│   │   │   │   └── ...
│   │   │   ├── reservation/        # Reservation flow components
│   │   │   │   ├── StationSelection.tsx
│   │   │   │   ├── FuelSelection.tsx
│   │   │   │   ├── TimeSlotSelection.tsx
│   │   │   │   ├── PaymentProcessor.tsx
│   │   │   │   └── ...
│   │   │   ├── diagrams/           # UML diagrams
│   │   │   │   ├── UseCaseDiagram.tsx
│   │   │   │   ├── ClassDiagram.tsx
│   │   │   │   ├── SequenceDiagrams.tsx
│   │   │   │   ├── ActivityDiagram.tsx
│   │   │   │   ├── StateChartDiagram.tsx
│   │   │   │   ├── ComponentDiagram.tsx
│   │   │   │   ├── DeploymentDiagram.tsx
│   │   │   │   └── PersistentModeling.tsx
│   │   │   ├── ui/                 # Reusable UI components (Radix)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   ├── LandingPage.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── StationCard.tsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Authentication state management
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts       # Supabase client configuration
│   │   │   │   ├── database.ts     # Database queries
│   │   │   │   └── services.ts     # Business logic services
│   │   │   └── utils/
│   │   │       └── notifications.ts
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript type definitions
│   │   ├── routes.tsx              # React Router configuration
│   │   └── App.tsx                 # Main application component
│   └── styles/
│       ├── theme.css               # Tailwind theme tokens
│       └── fonts.css               # Font imports
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 👥 User Roles

### 1. Driver
**Access**: Mobile-first interface for finding and reserving fuel

**Workflow**:
1. Register with vehicle details and license
2. Search nearby stations on map
3. Check weekly fuel quota remaining
4. Make reservation (station → fuel type → quantity → time slot → payment)
5. Receive QR code/pickup code
6. Visit station at reserved time
7. Show code to operator for verification
8. Receive fuel

### 2. Station Operator
**Access**: Dashboard for managing daily operations

**Workflow**:
1. View today's reservations
2. Verify pickup codes (QR scanner or manual entry)
3. Mark reservations as "in progress" during fueling
4. Complete reservations after dispensing fuel
5. Manage queue and notify delays

### 3. Station Owner
**Access**: Management dashboard for owned stations

**Workflow**:
1. Register and create station profile
2. Wait for admin verification
3. Add operators to stations
4. Update fuel inventory and prices
5. Request fuel deliveries from suppliers
6. View reservation analytics
7. Process refund requests

### 4. Admin
**Access**: Full system administration dashboard

**Workflow**:
1. Approve new station registrations
2. Manage vehicle classes and weekly quotas
3. Set fuel prices system-wide
4. Monitor platform analytics
5. Resolve disputes and approve refunds
6. Generate system reports

---

## 📊 UML Diagrams

QuickFuel includes comprehensive UML documentation accessible via the Diagrams Viewer:

### Use Case Diagram
Shows all system actors (Driver, Operator, Station Owner, Admin, Payment Gateway) and their interactions with the system. Central authentication through Login use case.

**Key Elements**:
- 4 primary actors with 20+ use cases
- Include/Extend relationships
- External Payment Gateway integration

### Class Diagram
Domain model showing 11 core entities with inheritance, associations, and multiplicities.

**Key Classes**:
- User (base class) → Driver, Operator, Admin, StationOwner
- Station, Reservation, Payment, FuelInventory
- VehicleClass, WeeklyFuelConsumption

### Sequence Diagrams
5 interactive sequence diagrams showing message flows:
1. Driver Registration
2. Make Reservation
3. Verify Pickup & Dispense Fuel
4. Request Refund
5. Admin Approve Refund

### Activity Diagrams
7 swimlane activity diagrams for major workflows:
1. Driver Registration
2. Driver Login
3. Make Reservation
4. Dispense Fuel
5. Cancel Reservation
6. Request Delivery
7. Manage Fuel Prices

### State Chart Diagram
Reservation lifecycle state machine showing transitions from Pending → Confirmed → In Progress → Completed, with alternative paths for Cancelled and Expired states.

### Component Diagram
3-tier architecture showing Frontend, Backend (Supabase), and Data layer components with provided/required interfaces.

### Deployment Diagram
Infrastructure deployment showing Client Devices, Web Server, API Server, Database, Payment Gateway, and Notification Service nodes.

### Persistent Modeling (Database Schema)
Complete database schema with 9 tables showing primary keys, foreign keys, unique constraints, and relationship cardinalities.

**Access**: Navigate to `/diagrams` route or use the Diagrams Viewer component.

---

## 📸 Screenshots

### Landing Page
Beautiful problem-focused design highlighting Ethiopia's fuel crisis and QuickFuel's solutions, with live statistics from the database.

### Driver Dashboard
Interactive map showing nearby stations with real-time fuel availability, quick actions for making reservations, and weekly quota tracking.

### Reservation Flow
Step-by-step wizard: Station Selection → Fuel Type → Quantity → Time Slot → Payment → Confirmation with QR code.

### Operator Dashboard
Today's reservations list, QR code scanner, and queue management interface.

### Admin Analytics
Comprehensive system analytics with date range filters (today/week/month), fuel type breakdown, revenue charts, and data export.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add TypeScript types
   - Write meaningful commit messages
4. **Test your changes**
   - Ensure all features work
   - Check responsive design
5. **Submit a pull request**
   - Describe your changes
   - Reference any related issues

### Code Style

- Use **TypeScript** for all new files
- Follow **React functional component** patterns with hooks
- Use **Tailwind CSS** for styling (avoid inline styles)
- Write **descriptive variable names**
- Add **comments for complex logic**
- Keep components **small and focused**

### Commit Message Format

```
feat: Add reservation cancellation feature
fix: Resolve QR code scanning bug
docs: Update installation instructions
style: Format operator dashboard components
refactor: Simplify payment processing logic
test: Add unit tests for fuel quota calculation
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues, questions, or feature requests:

- **GitHub Issues**: [https://github.com/yourusername/quickfuel/issues](https://github.com/yourusername/quickfuel/issues)
- **Email**: support@quickfuel.app
- **Documentation**: [https://docs.quickfuel.app](https://docs.quickfuel.app)

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **Radix UI** - Accessible components
- **Tailwind CSS** - Styling framework
- **Recharts** - Data visualization
- **Lucide** - Icon library

---

## 🌟 Star History

If you find QuickFuel useful, please consider giving it a star ⭐ on GitHub!

---

**Built with ❤️ to solve Ethiopia's fuel crisis**
