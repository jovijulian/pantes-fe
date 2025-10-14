"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from "react-toastify";
import { Plus, Trash2 } from 'lucide-react';
import moment from "moment";

import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import CreatableSelect from "@/components/form/CreatableSelect";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import { endpointUrl, httpPost } from "@/../helpers";

interface FieldValue { id: number; field_id: string; value: string; status: string; created_at: string; updated_at: string; }
interface FormField { id: number; label: string; value_type: number; value_length: number; is_default: number; status: number; created_at: string; updated_at: string; field_value: FieldValue[]; }
interface FormStep { step: string; step_name: string; is_default: number; details: FormField[]; }
interface NewItem { _tempId: string;[key: string]: any; }

const generateKey = (str: string): string => str.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').trim();

const FormattedNumberInput = React.memo(({
    value,
    onChange,
    placeholder
}: {
    value: any;
    onChange: (value: any) => void;
    placeholder: string;
}) => {
    const formatNumber = (numStr: string | number) => {
        if (numStr === null || numStr === undefined || numStr === '') return '';
        const number = Number(String(numStr).replace(/[^0-9]/g, ''));
        return new Intl.NumberFormat('id-ID').format(number);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = e.target.value.replace(/[^0-9]/g, '');
        onChange(numericValue);
    };

    const displayValue = formatNumber(value);

    return (
        <Input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
});
FormattedNumberInput.displayName = 'FormattedNumberInput';

const RenderModalField = React.memo(({
    field,
    value,
    onChange,
    handleCreateOption,
    setModalState
}: {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    handleCreateOption: (fieldId: number, newValue: string) => Promise<{ value: string, label: string } | null>;
    setModalState: React.Dispatch<React.SetStateAction<any>>;
}) => {
    switch (field.value_type) {
        case 1:
            return <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
        case 2:
            return <FormattedNumberInput value={value} onChange={onChange} placeholder={field.label} />;
        case 3: {
            const options = field.field_value.map(opt => ({ value: opt.value.toString(), label: opt.value }));
            const isMulti = field.label.toLowerCase().includes('type') || field.label.toLowerCase().includes('model');
            const currentValue = isMulti ? options.filter(opt => (value || []).includes(opt.value)) : options.find(opt => opt.value === (value || '').toString()) || null;
            const handleSelectChange = (selection: any) => isMulti ? onChange(selection ? selection.map((opt: any) => opt.value) : []) : onChange(selection ? selection.value : null);
            const onCreate = (inputValue: string) => setModalState({ isOpen: true, title: `Add New ${field.label}`, message: `Are you sure you want to add "${inputValue}"?`, onConfirm: async () => { const newOption = await handleCreateOption(field.id, inputValue); if (newOption) { isMulti ? onChange([...(value || []), newOption.value]) : onChange(newOption.value); } } });
            return <CreatableSelect placeholder={`Select or type ${field.label}`} options={options} value={currentValue} 
            onChange={handleSelectChange} 
            // onCreateOption={onCreate} 
            isMulti={isMulti} />;
        }
        case 4:
            return <SingleDatePicker placeholderText={`Select ${field.label}`} selectedDate={value ? new Date(value) : null} onChange={(date: Date | null) => onChange(date ? moment(date).format('YYYY-MM-DD') : null)} onClearFilter={() => onChange(null)} viewingMonthDate={value ? new Date(value) : new Date()} onMonthChange={() => { }} />;
        default:
            return <div className="text-red-500 text-sm">Unsupported field.</div>;
    }
}, (prevProps, nextProps) => {
    return prevProps.value === nextProps.value && prevProps.field.id === nextProps.field.id;
});
RenderModalField.displayName = 'RenderModalField';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    formTemplate: FormStep[];
    transactionId: string;
    handleCreateOption: (fieldId: number, newValue: string) => Promise<{ value: string, label: string } | null>;
    setModalState: React.Dispatch<React.SetStateAction<any>>;
}

export default function AddItemModal({
    isOpen,
    onClose,
    onSuccess,
    formTemplate,
    transactionId,
    handleCreateOption,
    setModalState
}: AddItemModalProps) {
    const [newItems, setNewItems] = useState<NewItem[]>([{ _tempId: `new-${Date.now()}` }]);
    const [isAddingItem, setIsAddingItem] = useState(false);

    const itemsStep = useMemo(() => formTemplate.find(step => step.step_name === "Items"), [formTemplate]);

    const handleNewItemChange = useCallback((itemId: string, fieldKey: string, value: any) => {
        setNewItems(prevItems => prevItems.map(item => item._tempId === itemId ? { ...item, [fieldKey]: value } : item));
    }, []);

    const addNewItemForm = useCallback(() => {
        setNewItems(prev => [...prev, { _tempId: `new-${Date.now()}-${Math.random()}` }]);
    }, []);

    const removeItemForm = useCallback((itemId: string) => {
        setNewItems(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(item => item._tempId !== itemId);
        });
    }, []);

    // --- FUNGSI PENYIMPANAN DENGAN PAYLOAD BARU ---
    const handleSaveItems = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemsStep) {
            toast.error("Item form template not found!");
            return;
        }
        setIsAddingItem(true);

        const finalPayloadItems: any[] = [];

        for (const item of newItems) {
            for (const field of itemsStep.details) {
                const fieldKey = generateKey(field.label);
                const valueFromState = item[fieldKey];

                if (valueFromState === undefined || valueFromState === null || valueFromState === '' || (Array.isArray(valueFromState) && valueFromState.length === 0)) {
                    continue;
                }

                const valueArray: { field_value_id: number; value: any }[] = [];

                if (field.value_type === 3) { // Tipe Options/Select
                    const values = Array.isArray(valueFromState) ? valueFromState : [valueFromState];
                    values.forEach(val => {
                        const selectedOption = field.field_value.find(opt => opt.value === val);
                        valueArray.push({
                            field_value_id: selectedOption ? selectedOption.id : 0,
                            value: val
                        });
                    });
                } else { // Tipe lainnya (Text, Number, Date)
                    valueArray.push({
                        field_value_id: 0, // Sesuai permintaan, 0 untuk non-options
                        value: valueFromState
                    });
                }
                
                if (valueArray.length > 0) {
                    finalPayloadItems.push({
                        step: parseInt(itemsStep.step, 10),
                        step_name: itemsStep.step_name,
                        field_id: field.id,
                        label: field.label,
                        value: valueArray
                    });
                }
            }
        }

        if (finalPayloadItems.length === 0) {
            toast.error("Please fill at least one field across all new items.");
            setIsAddingItem(false);
            return;
        }

        try {
            await httpPost(
                endpointUrl(`sales/transaction/${transactionId}/add-items`),
                { items: finalPayloadItems },
                true
            );
            toast.success(`${newItems.length} new item(s) added successfully!`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add new items.");
        } finally {
            setIsAddingItem(false);
        }
    };
    
    useEffect(() => {
        if(isOpen) {
            setNewItems([{ _tempId: `new-${Date.now()}` }]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
            <div className="no-scrollbar relative w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <form onSubmit={handleSaveItems} className="max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Item(s)</h2>
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto">
                        {newItems.map((item, index) => (
                            <div key={item._tempId} className="p-4 border dark:border-gray-700 rounded-lg relative space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">New Item #{index + 1}</h3>
                                    {newItems.length > 1 && (
                                        <button type="button" onClick={() => removeItemForm(item._tempId)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {itemsStep?.details.map(field => {
                                        const fieldKey = generateKey(field.label);
                                        return (
                                            <div key={`${item._tempId}-${field.id}`}>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    {field.label}
                                                    {field.is_default === 1 && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                <RenderModalField
                                                    field={field}
                                                    value={item[fieldKey]}
                                                    onChange={(val) => handleNewItemChange(item._tempId, fieldKey, val)}
                                                    handleCreateOption={handleCreateOption}
                                                    setModalState={setModalState}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addNewItemForm} className="w-full mt-2 flex items-center justify-center px-4 py-2 border-2 border-dashed bg-gray-50 dark:bg-gray-700/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Item
                        </button>
                    </div>
                    <div className="flex justify-end gap-4 p-6 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" disabled={isAddingItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                            {isAddingItem ? 'Saving...' : `Save ${newItems.length} Item(s)`}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}