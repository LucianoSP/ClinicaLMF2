"use client"

import * as React from "react"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

registerLocale('pt-BR', ptBR)

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | null) => void
  className?: string
}

function Calendar({ selected, onSelect, className }: CalendarProps) {
  return (
    <DatePicker
      selected={selected}
      onChange={onSelect}
      inline
      locale="pt-BR"
      dateFormat="P"
      showPopperArrow={false}
      calendarClassName={className}
      previousMonthButtonLabel={<ChevronLeft className="h-4 w-4" />}
      nextMonthButtonLabel={<ChevronRight className="h-4 w-4" />}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            type="button"
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            {date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            type="button"
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
