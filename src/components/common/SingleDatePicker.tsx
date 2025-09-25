"use client";

import React, { useCallback, useMemo } from 'react';
import DatePicker, { registerLocale, ReactDatePickerCustomHeaderProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

registerLocale('en-US', enUS);

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
}

export default function SingleDatePicker({
  selectedDate,
  onChange,
  onMonthChange,
  onClearFilter,
  viewingMonthDate,
  placeholderText = "Select date",
  maxDate
}: SingleDatePickerProps) {

  const showClearDateFilterButton = selectedDate !== null && selectedDate !== undefined;
  
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => 
    Array.from(
      { length: currentYear - 1989 },
      (_, i) => currentYear - i
    ), [currentYear]
  );

  const months = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  const handleDateChange = useCallback((date: Date | null) => {
    onChange(date);
  }, [onChange]);

  const handleMonthChange = useCallback((date: Date) => {
    if (date && !isNaN(date.getTime())) {
      onMonthChange(date);
    }
  }, [onMonthChange]);

  const handleClearFilter = useCallback((e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClearFilter();
  }, [onClearFilter]);

  const renderCustomHeader = useCallback(({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: ReactDatePickerCustomHeaderProps) => {
    
    const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const monthIndex = months.indexOf(e.target.value);
      if (monthIndex !== -1) {
        changeMonth(monthIndex);
      }
    };

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const year = parseInt(e.target.value);
      if (!isNaN(year)) {
        changeYear(year);
      }
    };

    return (
      <div className="flex items-center justify-between px-2 py-2">
        <button 
          type="button" 
          onClick={decreaseMonth} 
          disabled={prevMonthButtonDisabled} 
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          aria-label="Previous month"
        >
          <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={months[date.getMonth()] || months[0]}
              onChange={handleMonthSelect}
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
              value={date.getFullYear()}
              onChange={handleYearSelect}
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
          onClick={increaseMonth} 
          disabled={nextMonthButtonDisabled} 
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          aria-label="Next month"
        >
          <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    );
  }, [months, years]);

  const getDayClassName = useCallback((date: Date) => {
    const baseDayStyle = "text-xs md:text-sm items-center !rounded-full transition-colors duration-150 !w-8 !py-[3px] mx-auto";
    
    // Validate dates
    if (!date || isNaN(date.getTime()) || !viewingMonthDate || isNaN(viewingMonthDate.getTime())) {
      return `${baseDayStyle} !text-gray-300 dark:!text-gray-500 !select-none !cursor-not-allowed opacity-50`;
    }
    
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
    
    // Days from different months
    if (date.getMonth() !== viewingMonthDate.getMonth()) {
      return `${baseDayStyle} !text-gray-300 dark:!text-gray-500 !select-none !cursor-not-allowed opacity-50`;
    }
    
    let dayStyles = `${baseDayStyle} !text-gray-700 dark:!text-gray-200 cursor-pointer`;
    dayStyles += " hover:!bg-blue-500 hover:!text-white dark:hover:!bg-blue-600";
    
    // Today styling
    if (isToday) {
      dayStyles += " !bg-blue-100 dark:!bg-blue-500/30 !font-semibold !text-blue-600 dark:!text-blue-300";
      dayStyles += " hover:!bg-blue-600 dark:hover:!bg-blue-500 hover:!text-white";
    }
    
    // Selected date styling
    const isSelected = selectedDate && 
                      date.getDate() === selectedDate.getDate() && 
                      date.getMonth() === selectedDate.getMonth() && 
                      date.getFullYear() === selectedDate.getFullYear();
    
    if (isSelected) {
      dayStyles += " !bg-blue-600 dark:!bg-blue-500 !text-white !font-bold";
    }
    
    return dayStyles;
  }, [selectedDate, viewingMonthDate]);

  // Validate viewingMonthDate
  const safeViewingMonthDate = useMemo(() => {
    if (!viewingMonthDate || isNaN(viewingMonthDate.getTime())) {
      return new Date();
    }
    return viewingMonthDate;
  }, [viewingMonthDate]);

  return (
    <DatePicker
      selected={selectedDate}
      onChange={handleDateChange}
      onMonthChange={handleMonthChange}
      customInput={
        <CustomSingleDateInput
          selectedDateProp={selectedDate}
          showClearFilterIcon={showClearDateFilterButton}
          onClearFilter={handleClearFilter}
          placeholderText={placeholderText}
        />
      }
      locale="en-US"
      wrapperClassName="w-full"
      dateFormat="dd/MM/yyyy"
      showPopperArrow={false}
      popperPlacement="bottom-start"
      calendarClassName="bg-white dark:!bg-slate-700 !border !border-gray-300 dark:!border-slate-600 !rounded-md !shadow-lg p-1 z-10 text-sm"
      renderCustomHeader={renderCustomHeader}
      dayClassName={getDayClassName}
      maxDate={maxDate}
      openToDate={safeViewingMonthDate}
      preventOpenOnFocus
      shouldCloseOnSelect={true}
      enableTabLoop={false}
    />
  );
}