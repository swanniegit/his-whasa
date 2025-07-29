// Booking System Plugin Module Types

export interface NurseStaff {
  id: string
  name: string
  professional_registration?: string
  specialization?: string
  contact_number?: string
  email?: string
  is_active: boolean
  color_code: string
  created_at: string
  updated_at: string
}

export interface InterventionType {
  id: string
  name: string
  description?: string
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Place {
  id: string
  name: string
  address?: string
  facility_type?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NurseBooking {
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

export interface NurseOncall {
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

export interface BookingFormData {
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
}

export interface BulkBookingData {
  bookings: BookingFormData[]
}

export interface OncallFormData {
  nurse_id: string
  oncall_date: string
  call_type: 'first_call' | 'second_call'
}

export interface DaySchedule {
  date: string
  bookings: NurseBooking[]
  oncall?: {
    first_call?: NurseOncall
    second_call?: NurseOncall
  }
}

export interface MonthActivities {
  date: string
  booking_count: number
  oncall_assignments: NurseOncall[]
}

export interface TimeSlot {
  time: string
  formatted_time: string
  is_available: boolean
  booking?: NurseBooking
}

export interface PaymentStatus {
  type: 'no_payment' | 'paid' | 'partial' | 'outstanding'
  label: string
  color: string
}

export interface BookingFilters {
  date?: string
  nurse_id?: string
  intervention_type_id?: string
  place_id?: string
  status?: string
  payment_method?: string
}

export interface BookingStats {
  total_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  no_show_bookings: number
  total_revenue: number
  outstanding_amount: number
  paid_amount: number
}

// Excel Import/Export Types
export interface ExcelBookingRow {
  nurse_name: string
  patient_name: string
  patient_id_case_assess?: string
  booking_date: string
  slot_time: string
  intervention_type: string
  place: string
  outstanding_amount: number
  paid_amount: number
  payment_method: string
  notes?: string
}

export interface ExcelImportResult {
  success: boolean
  imported_count: number
  errors: string[]
  warnings: string[]
}

// API Response Types
export interface BookingApiResponse {
  success: boolean
  data?: NurseBooking | NurseBooking[]
  error?: string
  message?: string
}

export interface OncallApiResponse {
  success: boolean
  data?: NurseOncall | NurseOncall[]
  error?: string
  message?: string
}

export interface ScheduleApiResponse {
  success: boolean
  data?: DaySchedule
  error?: string
}

export interface MonthActivitiesApiResponse {
  success: boolean
  data?: MonthActivities[]
  error?: string
}

// Calendar Types
export interface CalendarDay {
  date: string
  day: number
  month: number
  year: number
  is_current_month: boolean
  is_today: boolean
  booking_count: number
  oncall_assignments: NurseOncall[]
  has_bookings: boolean
  has_oncall: boolean
}

export interface CalendarMonth {
  year: number
  month: number
  days: CalendarDay[]
  activities: MonthActivities[]
}

// Modal Types
export interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking?: NurseBooking
  date?: string
  time?: string
  mode: 'create' | 'edit' | 'view'
}

export interface OncallModalProps {
  isOpen: boolean
  onClose: () => void
  date?: string
  existing_assignments?: NurseOncall[]
}

export interface BulkBookingModalProps {
  isOpen: boolean
  onClose: () => void
  date?: string
}

export interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (result: ExcelImportResult) => void
}

// Hook Types
export interface UseBookingsReturn {
  bookings: NurseBooking[]
  loading: boolean
  error: string | null
  createBooking: (data: BookingFormData) => Promise<BookingApiResponse>
  updateBooking: (id: string, data: Partial<BookingFormData>) => Promise<BookingApiResponse>
  deleteBooking: (id: string) => Promise<BookingApiResponse>
  getBookings: (filters?: BookingFilters) => Promise<void>
  getBooking: (id: string) => Promise<NurseBooking | null>
}

export interface UseOncallReturn {
  oncall_assignments: NurseOncall[]
  loading: boolean
  error: string | null
  createOncall: (data: OncallFormData) => Promise<OncallApiResponse>
  deleteOncall: (id: string) => Promise<OncallApiResponse>
  getOncallForDate: (date: string) => Promise<NurseOncall[]>
  getOncallForMonth: (start_date: string, end_date: string) => Promise<NurseOncall[]>
}

export interface UseScheduleReturn {
  schedule: DaySchedule | null
  loading: boolean
  error: string | null
  getDaySchedule: (date: string) => Promise<DaySchedule | null>
  getMonthActivities: (year: number, month: number) => Promise<MonthActivities[]>
}

export interface UseReferenceDataReturn {
  nurses: NurseStaff[]
  intervention_types: InterventionType[]
  places: Place[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}