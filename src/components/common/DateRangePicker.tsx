"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineCalendar as Calendar, AiOutlineClose as X, AiOutlineLeft as ChevronLeft, AiOutlineRight as ChevronRight, AiOutlineFilter as Filter } from 'react-icons/ai';

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
  const [currentMonth, setCurrentMonth] = useState(initialStartDate ? new Date(initialStartDate) : new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDateInRange = (date: Date | null): boolean => {
    if (!startDate || !endDate || !date) return false;
    const currentDate = formatDate(date);
    return !!currentDate && currentDate >= startDate && currentDate <= endDate;
};
  // --- STATE BARU UNTUK KONTROL TAMPILAN ---
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');
  const [yearBlockStart, setYearBlockStart] = useState(new Date().getFullYear() - 5);

  const predefinedRanges: PredefinedRange[] = [
    {
      label: 'Hari Ini',
      getValue: () => {
        const today = new Date();
        return { start: formatDate(today), end: formatDate(today) };
      }
    },
    {
      label: '7 Hari Terakhir',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { start: formatDate(start), end: formatDate(end) };
      }
    },
    {
      label: '30 Hari Terakhir',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { start: formatDate(start), end: formatDate(end) };
      }
    },
    {
      label: 'Bulan Ini',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatDate(start), end: formatDate(now) };
      }
    },
    {
      label: 'Bulan Lalu',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: formatDate(start), end: formatDate(end) };
      }
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('day'); // Reset view saat menutup
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | string | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Menyesuaikan dengan zona waktu lokal
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) { days.push(null); }
    for (let day = 1; day <= daysInMonth; day++) { days.push(new Date(year, month, day)); }
    return days;
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const formattedDate = formatDate(date);
    if (selectingStart || !startDate || (endDate && startDate)) {
      setStartDate(formattedDate);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (formattedDate && startDate && new Date(formattedDate) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
      setSelectingStart(true);
    }
  };
  
  const handleApply = () => {
    onDatesChange({ startDate, endDate });
    setIsOpen(false);
    setView('day');
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onDatesChange({ startDate: null, endDate: null });
    setIsOpen(false);
    setView('day');
  };

  const handlePredefinedRange = (range: PredefinedRange) => {
    const { start, end } = range.getValue();
    setStartDate(start);
    setEndDate(end);
    onDatesChange({ startDate: start, endDate: end });
    setIsOpen(false);
    setView('day');
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setView('day');
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setView('month');
  };

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const years = Array.from({ length: 12 }, (_, i) => yearBlockStart + i);
  
  const displayText = startDate && endDate
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    : 'Pilih rentang tanggal';

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md min-w-[280px] text-left">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className={`flex-1 ${!startDate ? 'text-gray-500' : 'text-gray-900'}`}>{displayText}</span>
        {startDate && (<span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleClear(); }} className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4 text-gray-400" /></span>)}
      </button>

      {isOpen && (
         <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-auto animate-fade-in-up">
          <div className="flex">
            <div className="w-48 p-4 border-r border-gray-200 bg-gray-50 rounded-l-2xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Shortcut</h3>
              <div className="space-y-1">
                {predefinedRanges.map(range => (<button key={range.label} onClick={() => handlePredefinedRange(range)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all duration-150">{range.label}</button>))}
              </div>
            </div>

            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => {
                    if (view === 'day') navigateMonth(-1);
                    if (view === 'month') setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
                    if (view === 'year') setYearBlockStart(yearBlockStart - 12);
                }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                
                <div className="flex gap-2">
                  <button onClick={() => setView('month')} className="text-lg font-semibold text-gray-900 hover:bg-gray-100 px-2 rounded-md transition-colors">{monthNames[currentMonth.getMonth()]}</button>
                  <button onClick={() => setView('year')} className="text-lg font-semibold text-gray-900 hover:bg-gray-100 px-2 rounded-md transition-colors">{currentMonth.getFullYear()}</button>
                </div>

                <button onClick={() => {
                    if (view === 'day') navigateMonth(1);
                    if (view === 'month') setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
                    if (view === 'year') setYearBlockStart(yearBlockStart + 12);
                }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
              
              {view === 'day' && (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((date, index) => {
                      if (!date) return <div key={index} className="p-2"></div>;
                      const isStart = formatDate(date) === startDate;
                      const isEnd = formatDate(date) === endDate;
                      const isInRange = isDateInRange(date);
                      return (<button key={index} onClick={() => handleDateClick(date)} className={`p-2 text-sm rounded-lg transition-all duration-150 relative ${(isStart || isEnd) ? 'bg-blue-600 text-white font-semibold' : isInRange ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>{date.getDate()}</button>);
                    })}
                  </div>
                </>
              )}
              
              {view === 'month' && (
                <div className="grid grid-cols-3 gap-2">
                  {monthNamesShort.map((month, index) => (
                    <button key={month} onClick={() => handleMonthSelect(index)} className="p-4 text-center rounded-lg hover:bg-blue-100 transition-colors">{month}</button>
                  ))}
                </div>
              )}

              {view === 'year' && (
                <div className="grid grid-cols-4 gap-2">
                  {years.map(year => (
                    <button key={year} onClick={() => handleYearSelect(year)} className="p-3 text-center rounded-lg hover:bg-blue-100 transition-colors">{year}</button>
                  ))}
                </div>
              )}

              {view === 'day' && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">{selectingStart ? 'Pilih tanggal mulai...' : 'Pilih tanggal selesai...'}</div>
                  <div className="flex gap-3">
                    <button onClick={handleClear} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Clear</button>
                    <button onClick={handleApply} disabled={!endDate} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"><Filter className="w-4 h-4 inline-block mr-2" />Terapkan</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DateRangePicker;