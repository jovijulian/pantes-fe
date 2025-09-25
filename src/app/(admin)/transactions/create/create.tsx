"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, User, ShoppingCart, Calculator, ChevronDown, ChevronUp, Calendar, Package, Gift, Star } from 'lucide-react';
import moment from "moment";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select-custom";
import MultiSelect from "@/components/form/MultiSelect-custom";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import { endpointUrl, httpGet, httpPost } from '../../../../../helpers';
import CreatableSelect from "@/components/form/CreatableSelect";
import ConfirmationModal from "@/components/modal/ConfirmationModal";

interface FieldValue {
    id: number;
    field_id: string;
    value: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface FormField {
    id: number;
    label: string;
    value_type: number; // 1=String, 2=Number, 3=Options, 4=Date
    value_length: number;
    is_default: number;
    status: number;
    created_at: string;
    updated_at: string;
    field_value: FieldValue[];
}

interface FormStep {
    step: string;
    step_name: string;
    details: FormField[];
}

interface TransactionItem {
    _id: string;
    [key: string]: any;
}

interface TransactionData {
    [key: string]: any;
    items: TransactionItem[];
}

const generateKey = (str: string): string =>
    str.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim();

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);

export default function DynamicCreateTransactionPage() {
    const [formTemplate, setFormTemplate] = useState<FormStep[]>([]);
    const [transactionData, setTransactionData] = useState<TransactionData>({
        items: [{ _id: Date.now().toString() }]
    });
    const [openItemId, setOpenItemId] = useState<string | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchingCustomer, setSearchingCustomer] = useState(false);
    const [customerFoundStatus, setCustomerFoundStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        fetchFormTemplate();
    }, []);

    const fetchFormTemplate = async () => {
        try {
            setLoadingTemplate(true);
            setError(null);

            const response = await httpGet(endpointUrl('form'), true);

            if (response.status === 200 && response.data?.data) {
                const data: FormStep[] = response.data.data;
                setFormTemplate(data);

                const itemsStep = data.find(step => step.step_name === "Items");
                if (itemsStep && transactionData.items.length > 0) {
                    setOpenItemId(transactionData.items[0]._id);
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error("Failed to fetch form template:", error);
            setError('Failed to load form template. Please try again.');
        } finally {
            setLoadingTemplate(false);
        }
    };

    const handleFieldChange = (stepKey: string, fieldKey: string, value: any) => {
        setTransactionData(prev => ({
            ...prev,
            [stepKey]: {
                ...prev[stepKey],
                [fieldKey]: value,
            }
        }));
    };

    const handleItemChange = (itemId: string, fieldKey: string, value: any) => {
        setTransactionData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item._id === itemId ? { ...item, [fieldKey]: value } : item
            )
        }));
    };

    const addItem = () => {
        const newItem: TransactionItem = { _id: Date.now().toString() };
        setTransactionData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
        setOpenItemId(newItem._id);
    };

    const removeItem = (itemId: string) => {
        if (transactionData.items.length <= 1) {
            alert('Minimal harus ada 1 item');
            return;
        }

        setTransactionData(prev => ({
            ...prev,
            items: prev.items.filter(item => item._id !== itemId)
        }));

        if (openItemId === itemId) {
            setOpenItemId(null);
        }
    };

    const toggleItemAccordion = (itemId: string) => {
        setOpenItemId(prevId => (prevId === itemId ? null : itemId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (transactionData.items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        console.log('Final Transaction Data:', transactionData);

        // const submitData = await httpPost(endpointUrl('transactions'), transactionData);

        alert('Transaction created successfully! Check the console log for data.');
    };

    const handlePhoneSearch = (phone: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (!phone.trim()) {
            setCustomerFoundStatus('idle');
            return;
        }

        debounceTimeout.current = setTimeout(async () => {
            if (phone.length < 7) {
                setCustomerFoundStatus('idle');
                return;
            }

            setSearchingCustomer(true);
            setCustomerFoundStatus('idle');

            try {
                const response = await httpPost(endpointUrl('customer/number-phone'), { phone }, true);

                if (response.data && response.data.data) {
                    const customerData = response.data.data;
                    const customerStepKey = generateKey('Customer Information');

                    const autofillData = {
                        [generateKey('Customer Name')]: customerData.name,
                        [generateKey('Customer Phone Number')]: customerData.phone,
                        [generateKey('Date of Birth')]: customerData.date_of_birth ? moment(customerData.date_of_birth).format('YYYY-MM-DD') : '',
                        [generateKey('Address')]: customerData.address,
                        [generateKey('Anniversary Date')]: customerData.date_anniv ? moment(customerData.date_anniv).format('YYYY-MM-DD') : '',
                        [generateKey('Customer Details')]: customerData.detail_information,
                    };

                    setTransactionData(prev => ({
                        ...prev,
                        [customerStepKey]: {
                            ...prev[customerStepKey],
                            ...autofillData,
                        }
                    }));
                    setCustomerFoundStatus('found');

                } else {
                    setCustomerFoundStatus('not_found');
                }
            } catch (error) {
                setCustomerFoundStatus('not_found');
                console.error("Customer search error:", error);
            } finally {
                setSearchingCustomer(false);
            }
        }, 500);
    };

    const handleCreateOption = async (fieldId: number, newValue: string) => {
        try {
            const payload = {
                field_id: fieldId,
                value: newValue,
            };
            const response = await httpPost(endpointUrl('master/field/value'), payload, true);
            const createdOption = response.data.data;

            setFormTemplate(prevTemplate => {
                const newTemplate = JSON.parse(JSON.stringify(prevTemplate));
                for (const step of newTemplate) {
                    const field = step.details.find((f: any) => f.id === fieldId);
                    if (field) {
                        field.field_value.push({
                            id: createdOption.id,
                            value: createdOption.value
                        });
                        break;
                    }
                }
                return newTemplate;
            });

            return { value: createdOption.value, label: createdOption.value };

        } catch (error) {
            console.error("Failed to create new option:", error);
            alert("Failed to add new data.");
            return null;
        }
    };

    const renderField = (field: FormField, stepKey: string, item?: TransactionItem, disabled: boolean = false) => {
        const fieldKey = generateKey(field.label);
        const value = item ? item[fieldKey] : transactionData[stepKey]?.[fieldKey];

        const onChange = (newValue: any) => {
            if (item) {
                handleItemChange(item._id, fieldKey, newValue);
            } else {
                handleFieldChange(stepKey, fieldKey, newValue);
            }
        };

        const commonProps = {
            placeholder: field.label,
            key: `${stepKey}_${fieldKey}_${item?._id || 'step'}`
        };

        switch (field.value_type) {
            case 1:
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        {...commonProps}
                        disabled={disabled}
                    />
                );

            case 2:
                return (
                    <Input
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        {...commonProps}
                        disabled={disabled}
                    />
                );

            case 3:
                const options = field.field_value.map((opt: any) => ({
                    value: opt.value,
                    label: opt.value
                }));

                const onCreate = (inputValue: string) => {
                    setModalState({
                        isOpen: true,
                        title: `Add New ${field.label}`,
                        message: `Are you sure you want to add "${inputValue}" to the master data?`,
                        onConfirm: async () => {
                            const newOption = await handleCreateOption(field.id, inputValue);
                            if (newOption) {
                                onChange(newOption.value);
                            }
                        },
                    });
                };

                const singleValue = options.find(opt => opt.value === value) || null;

                return (
                    <CreatableSelect
                        placeholder={`Select or type ${field.label}`}
                        options={options}
                        value={singleValue}
                        onChange={(opt: any) => onChange(opt?.value || null)}
                        onCreateOption={onCreate}
                    />
                );

            case 4:
                return (
                    <SingleDatePicker
                        placeholderText={`Select ${field.label}`}
                        selectedDate={value ? new Date(value) : null}
                        onChange={(date: Date | null) =>
                            onChange(date ? moment(date).format('YYYY-MM-DD') : null)
                        }
                        onClearFilter={() => onChange(null)}
                        viewingMonthDate={value ? new Date(value) : new Date()}
                        onMonthChange={() => { }}
                    />
                );

            default:
                return (
                    <div className="text-red-500 text-sm">
                        Unsupported field type: {field.value_type}
                    </div>
                );
        }
    };

    const findStep = (stepName: string): FormStep | undefined =>
        formTemplate.find(step => step.step_name === stepName);

    const totalAmount = transactionData.items.reduce((sum, item) => {
        const priceKey = generateKey('Price (IDR)');
        return sum + (Number(item[priceKey]) || 0);
    }, 0);

    if (loadingTemplate) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Form Template...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="text-red-600 text-lg font-semibold">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-600 p-3 rounded-lg">
                            <ShoppingCart className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Transaction</h1>
                            <p className="text-gray-600 mt-1">
                                Search or input customer data, then add transaction items.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {findStep('Customer Information') && (() => {
                                const customerStep = findStep('Customer Information')!;
                                const customerStepKey = generateKey(customerStep.step_name);
                                const phoneField = customerStep.details.find(f => f.label.toLowerCase().includes('phone'));
                                const otherFields = customerStep.details.filter(f => !f.label.toLowerCase().includes('phone'));
                                const isFormDisabled = customerFoundStatus === 'found';

                                return (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                        <div className="flex items-center mb-6">
                                            <div className="bg-blue-600 p-2 rounded-lg mr-4">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Customer Information
                                            </h2>
                                        </div>

                                        {phoneField && (
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                    {phoneField.label}
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="tel"
                                                        placeholder="Enter phone number to search..."
                                                        value={transactionData[customerStepKey]?.[generateKey(phoneField.label)] || ''}
                                                        onChange={(e) => {
                                                            const phone = e.target.value;
                                                            handleFieldChange(customerStepKey, generateKey(phoneField.label), phone);
                                                            handlePhoneSearch(phone);
                                                        }}
                                                    />
                                                    {searchingCustomer && (
                                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {customerFoundStatus === 'found' && (
                                            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">
                                                Customer found! Data has been auto-filled.
                                            </div>
                                        )}
                                        {customerFoundStatus === 'not_found' && (
                                            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6 text-sm">
                                                This is a new customer. Please complete the details below.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {otherFields.map((field) => (
                                                <div key={field.id} className={
                                                    field.label.toLowerCase().includes('address')
                                                        ? 'md:col-span-2' : ''
                                                }>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        {field.label}
                                                        {field.is_default === 1 && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    {renderField(field, customerStepKey, undefined, isFormDisabled)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {findStep('Items') && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center">
                                            <div className="bg-green-600 p-2 rounded-lg mr-4">
                                                <Package className="h-6 w-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Transaction Items</h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Item
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {transactionData.items.map((item, index) => {
                                            const itemStep = findStep('Items');
                                            const privilegeStep = findStep('Privilege & Awards');
                                            const contentStep = findStep('Content & Programs');
                                            const offerStep = findStep('Offer');

                                            const isOpen = openItemId === item._id;

                                            return (
                                                <div key={item._id} className="bg-white rounded-lg border-2 border-gray-200">
                                                    <div
                                                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                                        onClick={() => toggleItemAccordion(item._id)}
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="bg-blue-600 p-2 rounded-lg mr-4">
                                                                <Package className="h-5 w-5 text-white" />
                                                            </div>
                                                            <span className="text-lg font-bold text-gray-900">
                                                                Item #{index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {transactionData.items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeItem(item._id);
                                                                    }}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {isOpen ? (
                                                                <ChevronUp className="h-5 w-5 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="px-6 pb-6 border-b border-gray-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-3">
                                                            {itemStep?.details.map((field) => (
                                                                <div
                                                                    key={field.id}
                                                                    className={field.label.toLowerCase().includes('notes') ? 'md:col-span-1 lg:col-span-1' : ''}
                                                                >
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                        {field.label}
                                                                        {field.is_default === 1 && <span className="text-red-500 ml-1">*</span>}
                                                                    </label>
                                                                    {renderField(field, generateKey('Items'), item)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {isOpen && (
                                                        <div className="p-6 bg-gray-50 space-y-8">
                                                            {privilegeStep && (
                                                                <div>
                                                                    <div className="flex items-center mb-6">
                                                                        <Gift className="h-5 w-5 text-purple-600 mr-2" />
                                                                        <h4 className="text-lg font-bold text-gray-900">
                                                                            {privilegeStep.step_name}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        {privilegeStep.details.map((field) => (
                                                                            <div key={field.id}>
                                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                                    {field.label}
                                                                                </label>
                                                                                {renderField(field, generateKey(privilegeStep.step_name), item)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {contentStep && (
                                                                <div>
                                                                    <div className="flex items-center mb-6">
                                                                        <Star className="h-5 w-5 text-yellow-600 mr-2" />
                                                                        <h4 className="text-lg font-bold text-gray-900">
                                                                            {contentStep.step_name}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        {contentStep.details.map((field) => (
                                                                            <div key={field.id}>
                                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                                    {field.label}
                                                                                </label>
                                                                                {renderField(field, generateKey(contentStep.step_name), item)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {offerStep && (
                                                                <div>
                                                                    <div className="flex items-center mb-6">
                                                                        <Gift className="h-5 w-5 text-red-600 mr-2" />
                                                                        <h4 className="text-lg font-bold text-gray-900">
                                                                            {offerStep.step_name}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        {offerStep.details.map((field) => (
                                                                            <div key={field.id}>
                                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                                    {field.label}
                                                                                </label>
                                                                                {renderField(field, generateKey(offerStep.step_name), item)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="xl:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                    <div className="flex items-center mb-6">
                                        <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Total Items:</span>
                                            <span className="font-semibold">{transactionData.items.length}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="font-bold text-lg text-green-600">
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">General Notes</label>
                                            <textarea
                                                // value={formData.catatan_umum}
                                                // onChange={(e) => setFormData(prev => ({ ...prev, catatan_umum: e.target.value }))}
                                                placeholder="Add any general notes for this entire transaction..."
                                                rows={4}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full mt-8 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                    >
                                        Create Transaction
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({ ...modalState, isOpen: false })}
                    onConfirm={modalState.onConfirm}
                    title={modalState.title}
                    message={modalState.message}
                />
            </div>
        </div>
    );
}