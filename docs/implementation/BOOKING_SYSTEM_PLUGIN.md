# Booking System Plugin Documentation

## Overview

The Booking System Plugin is a comprehensive nurse scheduling and appointment management module within the WHASA Healthcare Information System. It provides functionality for managing nurse assignments, patient bookings, on-call scheduling, and payment tracking.

## Architecture

### Plugin Structure
```
src/
├── components/booking/
│   ├── BookingCalendar.tsx      # Monthly calendar view
│   ├── BookingModal.tsx         # Create/edit booking form
│   ├── DayScheduleModal.tsx     # Daily schedule view
│   └── OncallModal.tsx          # On-call assignment management
├── hooks/
│   ├── useBookings.ts           # Booking CRUD operations
│   ├── useOncall.ts             # On-call assignment management
│   └── useReferenceData.ts      # Reference data (nurses, services, locations)
├── types/
│   └── booking.ts               # TypeScript type definitions
└── pages/
    └── BookingSystem.tsx        # Main booking system page
```

### Database Schema

#### Core Tables
- **nurse_bookings**: Patient appointments and nurse assignments
- **nurse_oncall**: On-call duty assignments
- **nurse_staff**: Nurse/staff information with color coding
- **intervention_types**: Medical intervention types
- **places**: Location/facility information

#### Key Features
- UUID-based primary keys for scalability
- Row Level Security (RLS) for data protection
- Foreign key constraints for data integrity
- Automatic timestamp management
- Color coding system for visual identification

## Components

### 1. BookingCalendar
**File**: `src/components/booking/BookingCalendar.tsx`

**Purpose**: Displays monthly calendar with booking counts and on-call assignments

**Features**:
- Monthly navigation (previous/next)
- Visual indicators for bookings and on-call assignments
- Color-coded nurse assignments
- Click-to-view daily schedule
- Responsive grid layout

**Props**:
```typescript
interface BookingCalendarProps {
  onDateClick: (date: string) => void
  onMonthChange?: (year: number, month: number) => void
  selectedDate?: string
}
```

### 2. BookingModal
**File**: `src/components/booking/BookingModal.tsx`

**Purpose**: Create, edit, and view booking details

**Features**:
- Comprehensive booking form with all required fields
- Payment status calculation and display
- Time slot selection (08:00-17:00, 30-minute intervals)
- Nurse assignment with color coding
- Service and location selection
- Payment tracking (outstanding/paid amounts)
- Notes and additional information

**Props**:
```typescript
interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking?: NurseBooking
  date?: string
  time?: string
  mode: 'create' | 'edit' | 'view'
}
```

### 3. DayScheduleModal
**File**: `src/components/booking/DayScheduleModal.tsx`

**Purpose**: Detailed daily schedule view with time slots

**Features**:
- Time slot breakdown (08:00-17:00)
- On-call assignment display
- Booking details with nurse color coding
- Payment status indicators
- Add/edit/delete booking actions
- Comprehensive booking information display

**Props**:
```typescript
interface DayScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
}
```

### 4. OncallModal
**File**: `src/components/booking/OncallModal.tsx`

**Purpose**: Manage on-call nurse assignments

**Features**:
- First call and second call assignments
- Nurse color coding system
- Date-specific assignments
- Visual assignment confirmation
- Nurse color legend

**Props**:
```typescript
interface OncallModalProps {
  isOpen: boolean
  onClose: () => void
  date?: string
  existing_assignments?: NurseOncall[]
}
```

## Hooks

### 1. useBookings
**File**: `src/hooks/useBookings.ts`

**Purpose**: Manage booking CRUD operations

**Features**:
- Create, read, update, delete bookings
- Filter bookings by various criteria
- Real-time data synchronization
- Error handling and loading states
- Optimistic updates

**Methods**:
```typescript
interface UseBookingsReturn {
  bookings: NurseBooking[]
  loading: boolean
  error: string | null
  createBooking: (data: BookingFormData) => Promise<BookingApiResponse>
  updateBooking: (id: string, data: Partial<BookingFormData>) => Promise<BookingApiResponse>
  deleteBooking: (id: string) => Promise<BookingApiResponse>
  getBookings: (filters?: BookingFilters) => Promise<void>
  getBooking: (id: string) => Promise<NurseBooking | null>
}
```

### 2. useOncall
**File**: `src/hooks/useOncall.ts`

**Purpose**: Manage on-call assignments

**Features**:
- Create and delete on-call assignments
- Date and month-based queries
- Real-time data synchronization
- Error handling and loading states

**Methods**:
```typescript
interface UseOncallReturn {
  oncall_assignments: NurseOncall[]
  loading: boolean
  error: string | null
  createOncall: (data: OncallFormData) => Promise<OncallApiResponse>
  deleteOncall: (id: string) => Promise<OncallApiResponse>
  getOncallForDate: (date: string) => Promise<NurseOncall[]>
  getOncallForMonth: (start_date: string, end_date: string) => Promise<NurseOncall[]>
}
```

### 3. useReferenceData
**File**: `src/hooks/useReferenceData.ts`

**Purpose**: Manage reference data (nurses, services, locations)

**Features**:
- Load and cache reference data
- Real-time data synchronization
- Error handling and loading states
- Data refresh capabilities

**Methods**:
```typescript
interface UseReferenceDataReturn {
  nurses: NurseStaff[]
  intervention_types: InterventionType[]
  places: Place[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}
```

## Data Types

### Core Types
```typescript
interface NurseBooking {
  id: string
  nurse_id?: string
  patient_name: string
  patient_id_case_assess?: string
  booking_date: string
  slot_time: string
  intervention_type_id?: string
  place_id?: string
  outstanding_amount: number
  paid_amount: number
  payment_method: 'cash' | 'credit_card' | 'pending'
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  // Joined data
  nurse?: NurseStaff
  intervention_type?: InterventionType
  place?: Place
}

interface NurseOncall {
  id: string
  nurse_id: string
  oncall_date: string
  call_type: 'first_call' | 'second_call'
  created_by: string
  created_at: string
  updated_at: string
  // Joined data
  nurse?: NurseStaff
}
```

## Features

### 1. Calendar Interface
- **Monthly View**: Grid-based calendar showing booking counts per day
- **Navigation**: Previous/next month navigation
- **Visual Indicators**: 
  - Booking count badges
  - On-call assignment color coding (gradient backgrounds)
  - Today's date highlighting
  - Selected date highlighting

### 2. Booking Management
- **Single Booking Creation**: Comprehensive form with all required fields
- **Time Slots**: 30-minute intervals from 08:00-17:00
- **Payment Tracking**: Outstanding/paid amounts with status indicators
- **Nurse Assignment**: Color-coded nurse selection
- **Service Details**: Intervention types and locations

### 3. Day Schedule View
- **Time Slots**: Detailed breakdown of daily schedule
- **Booking Display**: Patient information with nurse assignments
- **Payment Status**: Visual indicators for payment status
- **Actions**: Add, edit, delete bookings
- **On-Call Display**: Current day's on-call assignments

### 4. On-Call Management
- **Dual Assignment**: First call and second call nurse assignments
- **Visual Indicators**: Color-coded nurse assignments
- **Date-Specific**: Assignments for specific dates
- **Assignment Modal**: Easy assignment interface

### 5. Payment Tracking
- **Status Types**:
  - No Payment (both amounts zero)
  - Paid (paid >= outstanding)
  - Partial (paid > 0 but < outstanding)
  - Outstanding (paid = 0, outstanding > 0)
- **Methods**: Cash, Credit Card, Pending

## Security Features

### Authentication
- Session-based authentication required for all operations
- User ID validation on every request
- Automatic redirect to login for unauthenticated users

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- SQL injection prevention with prepared statements
- Audit trail with created/updated timestamps

### Authorization
- Role-based access control
- Admin-only operations for reference data management
- User-specific booking permissions

## Configuration

### Time Slots
- **Default**: 30-minute intervals (08:00-17:00)
- **Configurable**: Can be modified in component constants
- **Format**: HH:MM (24-hour format)

### Nurse Colors
Fixed color assignments for visual consistency:
1. Pink (#ff6b9d)
2. Purple (#8b5cf6)
3. Cyan (#06b6d4)
4. Green (#10b981)
5. Orange (#f59e0b)
6. Red (#ef4444)
7. Brown (#8b5a2b)
8. Gray (#6b7280)

### Payment Methods
- cash
- credit_card
- pending (default)

## Integration

### With Main Application
- **Routing**: Integrated into main app routing
- **Authentication**: Uses shared authentication context
- **Styling**: Uses clinical design system
- **Navigation**: Accessible from main navigation

### With Database
- **Supabase**: PostgreSQL with real-time subscriptions
- **RLS**: Row Level Security for data protection
- **Foreign Keys**: Data integrity constraints
- **Indexes**: Performance optimization

## Usage Examples

### Creating a New Booking
```typescript
const { createBooking } = useBookings()

const newBooking = {
  patient_name: "John Doe",
  booking_date: "2024-01-15",
  slot_time: "09:00",
  nurse_id: "nurse-uuid",
  intervention_type_id: "service-uuid",
  place_id: "location-uuid",
  outstanding_amount: 150.00,
  paid_amount: 0,
  payment_method: "pending",
  notes: "Initial consultation"
}

const result = await createBooking(newBooking)
```

### Managing On-Call Assignments
```typescript
const { createOncall, deleteOncall } = useOncall()

const oncallAssignment = {
  nurse_id: "nurse-uuid",
  oncall_date: "2024-01-15",
  call_type: "first_call"
}

const result = await createOncall(oncallAssignment)
```

## Performance Considerations

### Database Optimization
- **Indexes**: Proper indexing on date, nurse_id, and frequently queried fields
- **Query Optimization**: Efficient JOINs for schedule views
- **Connection Pooling**: For high-traffic scenarios

### Frontend Optimization
- **Data Caching**: Reference data cached client-side
- **Lazy Loading**: Monthly data loaded on demand
- **Batch Operations**: Bulk updates processed in transactions

### Scalability
- **Pagination**: Consider for large date ranges
- **Archiving**: Strategy for old booking data
- **Concurrent Access**: Handle multiple users editing schedules

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Check user session and permissions
2. **Data Loading Issues**: Verify database connectivity and RLS policies
3. **Color Coding Problems**: Ensure nurse color assignments exist
4. **Modal Issues**: Check z-index conflicts with other components
5. **Date Format Errors**: Ensure consistent YYYY-MM-DD format

### Debug Mode
Enable error reporting in development:
```typescript
// In development environment
console.log('Booking data:', bookings)
console.log('Oncall data:', oncall_assignments)
```

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: WebSocket integration for live schedule updates
2. **Notification System**: Email/SMS reminders for bookings
3. **Reporting**: Advanced analytics and reporting features
4. **Mobile App**: Native mobile application
5. **Integration**: Connect with external calendar systems
6. **Recurring Bookings**: Support for repeated appointments
7. **Resource Management**: Equipment and room scheduling
8. **Patient Portal**: Allow patients to view/manage their bookings

### Technical Debt
1. **Error Handling**: Implement more comprehensive error handling
2. **Testing**: Add unit tests and integration tests
3. **Documentation**: API documentation with OpenAPI/Swagger
4. **Code Organization**: Further modularization
5. **Caching**: Implement Redis/Memcached for performance

## Migration from PHP/MySQL

### Key Changes
1. **Database**: MySQL → PostgreSQL (Supabase)
2. **Backend**: PHP → TypeScript/React
3. **API**: AJAX endpoints → Supabase client
4. **Authentication**: Session-based → Supabase Auth
5. **File Structure**: Monolithic → Component-based

### Data Migration
```sql
-- Export booking data
SELECT * FROM nurse_bookings 
ORDER BY booking_date, slot_time;

-- Export on-call data
SELECT * FROM nurse_oncall 
ORDER BY oncall_date, call_type;
```

### Migration Checklist
- [ ] Database schema migration
- [ ] Data export and import
- [ ] Authentication system setup
- [ ] Component development
- [ ] Testing and validation
- [ ] User training and documentation

---

## Contact Information
For questions regarding this booking system plugin, contact the development team with specific details about implementation requirements or technical issues.