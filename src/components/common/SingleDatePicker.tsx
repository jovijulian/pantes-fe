"use client";

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface SingleDateInputProps {
  value?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  selectedDateProp?: Date | null;
  showClearFilterIcon?: boolean;
  onClearFilter?: (event: React.MouseEvent<HTMLButtonElement | HTMLSpanElement, MouseEvent>) => void;
  placeholderText?: string;
  maxDate?: Date;
}

const CustomSingleDateInput = React.forwardRef<HTMLButtonElement, SingleDateInputProps>(
  ({ value, onClick, selectedDateProp, showClearFilterIcon, onClearFilter, placeholderText = "Select date" }, ref) => {
    const buttonText = useMemo(() => {
      if (selectedDateProp && !isNaN(selectedDateProp.getTime())) {
        try {
          return selectedDateProp.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
        } catch (error) {
          console.warn('Date formatting error:', error);
          return placeholderText;
        }
      }
      return placeholderText;
    }, [selectedDateProp, placeholderText]);

    const handleClearClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClearFilter) {
        onClearFilter(e);
      }
    }, [onClearFilter]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (onClearFilter) {
          onClearFilter(e as any);
        }
      }
    }, [onClearFilter]);

    return (
      <button
        type="button"
        onClick={onClick}
        ref={ref}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors duration-150"
      >
        <div className="flex items-center gap-3 truncate min-w-0">
          <FiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="truncate text-left min-w-0">{buttonText}</span>
        </div>
        {showClearFilterIcon && onClearFilter && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearClick}
            onKeyDown={handleKeyDown}
            className="px-1 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full cursor-pointer transition-colors duration-150 flex-shrink-0"
            aria-label="Clear date filter"
          >
            <FiX className="w-4 h-4" />
          </span>
        )}
      </button>
    );
  }
);
CustomSingleDateInput.displayName = "CustomSingleDateInput";

interface SingleDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  onClearFilter: () => void;
  viewingMonthDate: Date;
  placeholderText?: string;
  maxDate?: Date;
  disabled?: boolean;
}

export default function SingleDatePicker({
  selectedDate,
  onChange,
  onMonthChange,
  onClearFilter,
  viewingMonthDate,
  placeholderText = "Select date",
  maxDate,
  disabled,
}: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (viewingMonthDate && !isNaN(viewingMonthDate.getTime())) {
      return new Date(viewingMonthDate.getFullYear(), viewingMonthDate.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const showClearDateFilterButton = selectedDate !== null && selectedDate !== undefined;
  
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => 
    Array.from(
      { length: currentYear - 1900 },
      (_, i) => currentYear - i
    ), [currentYear]
  );

  const months = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  const dayNames = useMemo(() => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], []);

  // Update currentMonth when viewingMonthDate changes
  useEffect(() => {
    if (viewingMonthDate && !isNaN(viewingMonthDate.getTime())) {
      setCurrentMonth(new Date(viewingMonthDate.getFullYear(), viewingMonthDate.getMonth(), 1));
    }
  }, [viewingMonthDate]);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    if (disabled) return;
    
    // Check if date exceeds maxDate
    if (maxDate && date > maxDate) return;

    onChange(date);
    setIsOpen(false);
  }, [onChange, disabled, maxDate]);

  const handleClearFilter = useCallback((e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClearFilter();
  }, [onClearFilter]);

  const handlePrevMonth = useCallback(() => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  }, [currentMonth, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  }, [currentMonth, onMonthChange]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = months.indexOf(e.target.value);
    if (monthIndex !== -1) {
      const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
      setCurrentMonth(newMonth);
      onMonthChange(newMonth);
    }
  }, [currentMonth, months, onMonthChange]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    if (!isNaN(year)) {
      const newMonth = new Date(year, currentMonth.getMonth(), 1);
      setCurrentMonth(newMonth);
      onMonthChange(newMonth);
    }
  }, [currentMonth, onMonthChange]);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isSelected = useCallback((date: Date) => {
    return (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate]);

  const isDisabledDate = useCallback((date: Date) => {
    if (maxDate && date > maxDate) return true;
    return false;
  }, [maxDate]);

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth, getDaysInMonth]);

  return (
    <div className="relative w-full">
      <CustomSingleDateInput
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        selectedDateProp={selectedDate}
        showClearFilterIcon={showClearDateFilterButton}
        onClearFilter={handleClearFilter}
        placeholderText={placeholderText}
      />

      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg p-3"
          style={{ minWidth: '280px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-150"
              aria-label="Previous month"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={months[currentMonth.getMonth()]}
                  onChange={handleMonthChange}
                  className="appearance-none cursor-pointer rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 pl-3 pr-8 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                  aria-label="Select month"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={currentMonth.getFullYear()}
                  onChange={handleYearChange}
                  className="appearance-none cursor-pointer rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 pl-3 pr-8 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                  aria-label="Select year"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-150"
              aria-label="Next month"
            >
              <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day names */}
            {dayNames.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const today = isToday(day);
              const selected = isSelected(day);
              const disabledDay = isDisabledDate(day);

              let dayClasses = "h-8 w-8 flex items-center justify-center text-sm rounded-full transition-colors duration-150";

              if (disabledDay) {
                dayClasses += " text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50";
              } else if (selected) {
                dayClasses += " bg-blue-600 dark:bg-blue-500 text-white font-bold cursor-pointer";
              } else if (today) {
                dayClasses += " bg-blue-100 dark:bg-blue-500/30 font-semibold text-blue-600 dark:text-blue-300 cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white";
              } else {
                dayClasses += " text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600";
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabledDay && handleDateClick(day)}
                  disabled={disabledDay}
                  className={dayClasses}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}