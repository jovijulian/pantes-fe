import React, { useState, useRef, useEffect } from 'react';
import {
  AiOutlineCalendar as Calendar,
  AiOutlineClose as X,
  AiOutlineLeft as ChevronLeft,
  AiOutlineRight as ChevronRight,
  AiOutlineFilter as Filter
} from 'react-icons/ai';

interface DateRangePickerProps {
  onDatesChange: (dates: { startDate: string | null; endDate: string | null }) => void;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
}

interface PredefinedRange {
  label: string;
  getValue: () => { start: string | null; end: string | null };
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDatesChange, initialStartDate = null, initialEndDate = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Predefined date ranges
  const predefinedRanges: PredefinedRange[] = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        return {
          start: formatDate(today),
          end: formatDate(today)
        };
      }
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          start: formatDate(start),
          end: formatDate(end)
        };
      }
    },
    {
      label: 'Last 30 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          start: formatDate(start),
          end: formatDate(end)
        };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: formatDate(start),
          end: formatDate(end)
        };
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: formatDate(start),
          end: formatDate(end)
        };
      }
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | string | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const formattedDate = formatDate(date);

    if (selectingStart || !startDate) {
      setStartDate(formattedDate);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (formattedDate && startDate && new Date(formattedDate) < new Date(startDate)) {
        setStartDate(formattedDate);
        setEndDate(startDate);
      } else {
        setEndDate(formattedDate);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    onDatesChange({ startDate, endDate });
    setIsOpen(false);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onDatesChange({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const handlePredefinedRange = (range: PredefinedRange) => {
    const { start, end } = range.getValue();
    setStartDate(start);
    setEndDate(end);
    onDatesChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const isDateInRange = (date: Date | null): boolean => {
    if (!startDate || !endDate) return false;
    if (!date) return false;
    const currentDate = formatDate(date);
    return !!currentDate && currentDate >= startDate && currentDate <= endDate;
  };

  const isDateSelected = (date: Date | null): boolean => {
    if (!date) return false;
    const currentDate = formatDate(date);
    return currentDate == startDate || currentDate == endDate;
  };

  const isDateStart = (date: Date | null): boolean => {
    if (!date) return false;
    return formatDate(date) == startDate;
  };

  const isDateEnd = (date: Date | null): boolean => {
    if (!date) return false;
    return formatDate(date) == endDate;
  };
  const navigateMonth = (direction: any) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const displayText = startDate && endDate
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    : startDate
      ? `${formatDisplayDate(startDate)} - Select end date`
      : 'Select date range';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md min-w-[280px] text-left"
      >
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className={`flex-1 ${!startDate ? 'text-gray-500' : 'text-gray-900'}`}>
          {displayText}
        </span>
        {(startDate || endDate) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key == 'Enter' || e.key == ' ') {
                e.preventDefault();
                handleClear();
              }
            }}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 min-w-[280px] sm:min-w-[500px]">
          <div className="flex flex-col sm:flex-row">
            {/* Predefined Ranges */}
            <div className="w-full sm:w-48 p-4 border-r border-gray-200 bg-gray-50 rounded-l-2xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Shortcut</h3>
              <div className="space-y-1">
                {predefinedRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredefinedRange(range)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all duration-150"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2"></div>;
                  }

                  const isInRange = isDateInRange(date);
                  const isSelected = isDateSelected(date);
                  const isStart = isDateStart(date);
                  const isEnd = isDateEnd(date);
                  const isToday = formatDate(date) == formatDate(new Date());

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                                    p-2 text-sm rounded-lg transition-all duration-150 relative
                                    ${isSelected
                          ? 'bg-blue-600 text-white font-semibold shadow-md'
                          : isInRange
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }
                                    ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}
                                    ${(isStart || isEnd) ? 'font-semibold' : ''}
                                `}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectingStart ? 'Select start date' : 'Select end date'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!startDate}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default DateRangePicker;