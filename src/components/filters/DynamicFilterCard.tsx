"use client";
import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import CreatableSelect from "@/components/form/CreatableSelect";
import Input from '../form/input/InputField';
import SingleDatePicker from '../common/SingleDatePicker';
import moment from 'moment';

interface FilterField {
    id: number;
    label: string;
    value_type: number;
    field_value: { id: number; value: string }[];
}

interface DynamicFilterCardProps {
    filters: FilterField[];
    appliedFilters: Record<string, any>;
    onFilterChange: (label: string, value: any) => void;
}

export default function DynamicFilterCard({ filters, appliedFilters, onFilterChange }: DynamicFilterCardProps) {

    const DebouncedInput = ({ filter }: { filter: FilterField }) => {
        const initialValue = (appliedFilters[filter.label] && appliedFilters[filter.label][0]) || '';
        const [inputValue, setInputValue] = useState(initialValue);

        useEffect(() => {
            const handler = setTimeout(() => {
                if (inputValue !== initialValue) {
                    onFilterChange(filter.label, inputValue ? [inputValue] : []);
                }
            }, 500);

            return () => {
                clearTimeout(handler);
            };
        }, [inputValue, filter.label]);

        return (
            <Input
                type={filter.value_type === 1 ? 'text' : 'number'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Filter by ${filter.label}`}
            />
        );
    };

    const renderFilterInput = (filter: FilterField) => {
        switch (filter.value_type) {
            case 1:
            case 2:
                return <DebouncedInput filter={filter} />;

            case 3:
                const options = filter.field_value.map(opt => ({
                    value: opt.id.toString(),
                    label: opt.value,
                }));

                const handleChange = (selectedOptions: any) => {
                    const labels = Array.isArray(selectedOptions) ? selectedOptions.map(opt => opt.label) : [];
                    onFilterChange(filter.label, labels);
                };

                const value = (appliedFilters[filter.label] || []).map((valLabel: any) =>
                    options.find(opt => opt.label === valLabel)
                ).filter(Boolean);

                return (
                    <CreatableSelect
                        isMulti
                        placeholder={`Filter by ${filter.label}`}
                        options={options}
                        value={value}
                        onChange={handleChange}
                    />
                );


            case 4:
                const dateValue = appliedFilters[filter.label] ? new Date(appliedFilters[filter.label][0]) : null;
                return (
                    <SingleDatePicker
                        selectedDate={dateValue}
                        onChange={(date: Date | null) =>
                            onFilterChange(filter.label, date ? [moment(date).format('YYYY-MM-DD')] : [])
                        }
                        onClearFilter={() => onFilterChange(filter.label, [])}
                        viewingMonthDate={dateValue || new Date()}
                        onMonthChange={() => { }}
                        placeholderText={`Filter by ${filter.label}`}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
                {filters.map(filter => (
                    <div key={filter.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {filter.label}
                        </label>
                        {renderFilterInput(filter)}
                    </div>
                ))}
            </div>
        </div>
    );
}