import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarDay, NurseOncall, NurseBooking } from '../../types/booking'
import { useReferenceData } from '../../hooks/useReferenceData'

interface BookingCalendarProps {
  onDateClick: (date: string) => void
  onMonthChange?: (year: number, month: number) => void
  selectedDate?: string
  bookings: NurseBooking[]
  oncall_assignments: NurseOncall[]
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onDateClick,
  onMonthChange,
  selectedDate,
  bookings,
  oncall_assignments
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  const { nurses } = useReferenceData()

  // Generate calendar days for current month
  useEffect(() => {
    const generateCalendarDays = () => {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      const days = eachDayOfInterval({ start, end })

      const calendarDays: CalendarDay[] = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayBookings = bookings.filter(b => b.booking_date === dateStr)
        const dayOncall = oncall_assignments.filter(o => o.oncall_date === dateStr)

        return {
          date: dateStr,
          day: day.getDate(),
          month: day.getMonth(),
          year: day.getFullYear(),
          is_current_month: isSameMonth(day, currentDate),
          is_today: isToday(day),
          booking_count: dayBookings.length,
          oncall_assignments: dayOncall,
          has_bookings: dayBookings.length > 0,
          has_oncall: dayOncall.length > 0
        }
      })

      setCalendarDays(calendarDays)
    }

    generateCalendarDays()
  }, [currentDate, bookings, oncall_assignments])

  const handlePreviousMonth = () => {
    const newDate = subMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }

  const getDayClassNames = (day: CalendarDay) => {
    let classes = 'p-2 text-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[80px] flex flex-col'
    
    if (!day.is_current_month) {
      classes += ' text-gray-400'
    } else if (day.is_today) {
      classes += ' bg-blue-100 font-semibold'
    }

    if (day.has_bookings) {
      classes += ' bg-green-50'
    }

    if (day.has_oncall) {
      classes += ' bg-purple-50'
    }

    if (selectedDate === day.date) {
      classes += ' ring-2 ring-blue-500'
    }

    return classes
  }

  const getNurseColor = (nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId)
    return nurse?.color_code || '#6b7280'
  }

  const getOncallGradient = (oncallAssignments: NurseOncall[]) => {
    if (oncallAssignments.length === 0) return ''
    
    const colors = oncallAssignments.map(oncall => getNurseColor(oncall.nurse_id))
    if (colors.length === 1) {
      return `linear-gradient(45deg, ${colors[0]}20, ${colors[0]}40)`
    } else {
      return `linear-gradient(45deg, ${colors[0]}20, ${colors[1]}40)`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 border-b border-r">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day) => (
          <div
            key={day.date}
            className={`border-r border-b ${getDayClassNames(day)}`}
            onClick={() => onDateClick(day.date)}
            style={{
              background: day.has_oncall ? getOncallGradient(day.oncall_assignments) : undefined
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${day.is_today ? 'font-bold' : ''}`}>
                {day.day}
              </span>
              {day.booking_count > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-green-500 text-white rounded-full">
                  {day.booking_count}
                </span>
              )}
            </div>
            
            {/* Oncall Indicators */}
            {day.oncall_assignments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {day.oncall_assignments.map((oncall) => (
                  <div
                    key={oncall.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getNurseColor(oncall.nurse_id) }}
                    title={`${oncall.nurse?.name} - ${oncall.call_type.replace('_', ' ')}`}
                  />
                ))}
              </div>
            )}

            {/* Quick Info */}
            {day.has_bookings && !day.has_oncall && (
              <div className="mt-1">
                <div className="w-full h-1 bg-green-300 rounded"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>Has bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded"></div>
            <span>On-call assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCalendar