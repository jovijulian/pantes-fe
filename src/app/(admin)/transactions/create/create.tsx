"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, User, ShoppingCart, Calculator, ChevronDown, ChevronUp, Calendar, Package, Gift, Star } from 'lucide-react';
import moment from "moment";

import Input from "@/components/form/input/InputField";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import { endpointUrl, endpointUrlv2, httpGet, httpPost } from '../../../../../helpers';
import CreatableSelect from "@/components/form/CreatableSelect";
import ConfirmationModal from "@/components/modal/ConfirmationModal";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";

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
    is_default: number;
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

interface CategoryOption {
    id: number;
    name: string;
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
    const [foundCustomerId, setFoundCustomerId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);

    useEffect(() => {
        fetchFormTemplate();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await httpGet(endpointUrlv2('master/customer-category/dropdown'), true);
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchFormTemplate = async () => {
        try {
            setLoadingTemplate(true);
            setError(null);

            const response = await httpGet(endpointUrlv2('form'), true);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let purchaseName: string = '';

        const buildPayload = () => {
            const details: any[] = [];
            const customerInfoStepKey = generateKey('Customer Information');
            const customerInfoData = transactionData[customerInfoStepKey] || {};
            formTemplate.forEach(step => {
                if (step.step_name === 'Items') {
                    transactionData.items.forEach(item => {
                        step.details.forEach(field => {
                            processField(field, step, item, details);
                        });
                    });
                } else {
                    const stepData = transactionData[generateKey(step.step_name)] || {};
                    step.details.forEach(field => {
                        processField(field, step, stepData, details);
                    });
                }
            });

            const finalPayload = {
                customer_id: foundCustomerId,
                category_id: selectedCategoryId,
                date: customerInfoData[generateKey('Transaction Date')] || moment().format('YYYY-MM-DD'),
                name_purchase: purchaseName[0],
                description: customerInfoData[generateKey('Notes')] || '',
                detail: details,
            };

            return finalPayload;
        };

        const processField = (field: FormField, step: FormStep, dataObject: any, details: any[]) => {
            const fieldKey = generateKey(field.label);
            const valueFromState = dataObject[fieldKey];

            if (valueFromState === undefined || valueFromState === null || valueFromState === '' || (Array.isArray(valueFromState) && valueFromState.length === 0)) {
                return;
            }

            const valueArray: { field_value_id: number; value: any }[] = [];

            if (field.value_type === 3 && Array.isArray(valueFromState)) {
                valueFromState.forEach(selectedValue => {
                    const selectedOption = field.field_value.find(opt => opt.value === selectedValue);
                    valueArray.push({
                        field_value_id: selectedOption ? selectedOption.id : 0,
                        value: selectedValue,
                    });
                });
            } else {
                let fieldValueId = 0;
                if (field.value_type === 3 && valueFromState) {
                    const selectedOption = field.field_value.find(opt => opt.value === valueFromState);
                    if (selectedOption) fieldValueId = selectedOption.id;
                }
                valueArray.push({
                    field_value_id: fieldValueId,
                    value: valueFromState,
                });
            }

            if (valueArray.length > 0) {
                details.push({
                    step: parseInt(step.step, 10),
                    step_name: step.step_name,
                    field_id: field.id,
                    label: field.label,
                    value: valueArray,
                });
                if (field.label === 'Name Purchase') {
                    purchaseName = valueFromState;
                    console.log('Purchase Name set to:', purchaseName);
                }
            }
        };

        const finalPayload = buildPayload();

        try {
            await httpPost(
                endpointUrlv2("/sales/transaction"),
                finalPayload,
                true,
            );
            toast.success("Transaksi berhasil ditambahkan!");
            router.push("/transactions");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan Transaksi");
        } finally {
            setLoading(false);
        }
    };

    const handleMemberSearch = (numberMember: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        const customerStepKey = generateKey('Customer Information');

        const fieldsToClear = {
            [generateKey('Customer Name')]: '',
            [generateKey('Customer Phone Number')]: '',
            [generateKey('Date of Birth')]: '',
            [generateKey('Address')]: '',
            [generateKey('Anniversary Date')]: '',
            [generateKey('Customer Details')]: '',
        };

        const clearCustomerData = (
            status: 'idle' | 'not_found' = 'idle',
            numberToKeep: string
        ) => {
            setFoundCustomerId(0);
            setCustomerFoundStatus(status);

            setTransactionData(prev => ({
                ...prev,
                [customerStepKey]: {
                    ...prev[customerStepKey],
                    ...fieldsToClear,
                    [generateKey('Customer Member Number')]: numberToKeep
                }
            }));
        };

        if (!numberMember.trim()) {
            clearCustomerData('idle', '');
            return;
        }


        debounceTimeout.current = setTimeout(async () => {
            // if (numberMember.length < 9) {
            //     clearCustomerData('idle'); 
            //     return;
            // }

            setSearchingCustomer(true);
            setCustomerFoundStatus('idle');

            try {
                const response = await httpPost(endpointUrlv2('customer/number-member'), { number_member: numberMember }, true);

                if (response.data && response.data.data) {
                    const customerData = response.data.data;
                    setFoundCustomerId(customerData.id);

                    const autofillData = {
                        [generateKey('Customer Member Number')]: customerData.member_no,
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
                            ...autofillData
                        }
                    }));
                    setCustomerFoundStatus('found');

                } else {
                    clearCustomerData('not_found', numberMember);
                }
            } catch (error) {
                clearCustomerData('not_found', numberMember);
                console.error("Customer search error:", error);
            } finally {
                setSearchingCustomer(false);
            }
        }, 1500);
    };

    const handleCreateOption = async (fieldId: number, newValue: string) => {
        try {
            const payload = {
                value: newValue,
            };
            const response = await httpPost(endpointUrlv2(`master/field/${fieldId}/add-value`), payload, true);
            const createdOption = response.data.data.field_value;

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
        let placeholderText = field.label;
        if (field.label === 'Name Purchase') {
            placeholderText = 'Ex: RO1';
        }

        const commonProps = {
            placeholder: placeholderText,
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
                const isPhoneNumber = field.label.toLowerCase().includes('phone');

                if (isPhoneNumber) {
                    // --- Logika untuk Nomor Telepon ---
                    // Hanya mengizinkan angka, tanpa format Rupiah
                    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        onChange(rawValue);
                    };

                    return (
                        <Input
                            type="tel" // Menggunakan type="tel" lebih baik untuk nomor telepon
                            inputMode="numeric"
                            value={value || ''} // Tampilkan nilai apa adanya
                            onChange={handlePhoneChange}
                            {...commonProps}
                            disabled={disabled}
                        />
                    );
                } else {
                    // --- Logika untuk Harga / Angka Lain (dengan format Rupiah) ---
                    const formatNumber = (numStr: string | number) => {
                        if (!numStr) return '';
                        const rawValue = String(numStr).replace(/[^0-9]/g, '');
                        if (rawValue === '') return '';
                        return new Intl.NumberFormat('id-ID').format(Number(rawValue));
                    };

                    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        onChange(rawValue);
                    };

                    return (
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(value || '')}
                            onChange={handleNumberChange}
                            {...commonProps}
                            disabled={disabled}
                        />
                    )
                }

            case 3:


                const options = field.field_value.map((opt: any) => ({
                    value: opt.value.toString(),
                    label: opt.value
                }));

                const onCreate = (inputValue: string) => {
                    setModalState({
                        isOpen: true,
                        title: `Tambah ${field.label} baru`,
                        message: `Apakah Anda yakin ingin menambahkan "${inputValue}" ke data master?`,
                        onConfirm: async () => {
                            const newOption = await handleCreateOption(field.id, inputValue);
                            if (newOption) {
                                onChange(newOption.value);
                            }
                        },
                    });
                };

                const handleSelectChange = (selection: any) => {
                    if (Array.isArray(selection)) {
                        const values = selection.map(opt => opt.value);
                        onChange(values);
                        return;
                    }

                    onChange(selection ? selection.value : null);
                };
                if (!field.field_value || field.field_value.length === 0) {
                    return (
                        <CreatableSelect
                            placeholder={`Tidak ada opsi yang tersedia untuk ${field.label}, silakan tambahkan data baru`}
                            options={[]}
                            value={null}
                            onChange={handleSelectChange}
                        // onCreateOption={onCreate}
                        />
                    )
                }

                const currentValue = value ? options.find(opt => opt.value === value.toString()) : null;

                return (
                    <CreatableSelect
                        placeholder={`Pilih atau ketik ${field.label}`}
                        options={options}
                        value={currentValue}
                        onChange={handleSelectChange}
                    // onCreateOption={onCreate}
                    />
                );

            case 4:
                return (
                    <SingleDatePicker
                        placeholderText={`Pilih ${field.label}`}
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
                            <h1 className="text-3xl font-bold text-gray-900">Buat Transaksi Baru</h1>
                            <p className="text-gray-600 mt-1">
                                Cari atau masukkan data pelanggan, lalu tambahkan item transaksi.
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
                                const memberField = customerStep.details.find(f => f.label.toLowerCase().includes('member'));
                                const otherFields = customerStep.details.filter(f => !f.label.toLowerCase().includes('member') && f.label !== 'Name Purchase' && f.label !== 'Transaction Date' && f.label !== 'Notes');
                                const isFormDisabled = customerFoundStatus === 'found' || customerFoundStatus === 'idle';
                                const renderCustomerField = (label: string, fullWidth: boolean = false) => {
                                    const field = customerStep.details.find(f => f.label === label);
                                    if (!field) return null;

                                    return (
                                        <div key={field.id} className={fullWidth ? 'md:col-span-2' : ''}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                {field.label}
                                                {field.is_default === 1 && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            {renderField(field, customerStepKey)}
                                        </div>
                                    );
                                };
                                return (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                        <div className="flex items-center mb-6">
                                            <div className="bg-blue-600 p-2 rounded-lg mr-4">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Informasi Transaksi Pelanggan
                                            </h2>
                                        </div>

                                        {memberField && (
                                            <div className="mb-6">
                                                <label className="flex items-center space-x-1 text-sm font-semibold text-gray-700 mb-3">
                                                    {memberField.label}
                                                    <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter member number to search..."
                                                        value={transactionData[customerStepKey]?.[generateKey(memberField.label)] || ''}
                                                        onChange={(e) => {
                                                            const numberMember = e.target.value;
                                                            handleFieldChange(customerStepKey, generateKey(memberField.label), numberMember);
                                                            handleMemberSearch(numberMember);
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
                                                Pelanggan ditemukan! Data telah terisi otomatis.
                                            </div>
                                        )}
                                        {customerFoundStatus === 'not_found' && (
                                            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6 text-sm">
                                                Ini pelanggan baru. Mohon lengkapi detail di bawah ini.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                    Kategori Pelanggan <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <select
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                                    value={selectedCategoryId}
                                                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                                >
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {otherFields.map((field) => (
                                                <div key={field.id} className={
                                                    field.label.toLowerCase().includes('address')
                                                        ? '' : ''
                                                }>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        {field.label}
                                                        {(field.label === 'Customer Name' || field.label === 'Customer Phone Number') && (
                                                            <span className="text-red-500 ml-1">*</span>
                                                        )}
                                                    </label>
                                                    {renderField(field, customerStepKey, undefined, isFormDisabled)}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                                            {renderCustomerField('Name Purchase')}
                                            {renderCustomerField('Transaction Date')}
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
                                            <h2 className="text-xl font-bold text-gray-900">Item Transaksi</h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah Item
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {transactionData.items.map((item, index) => {
                                            const itemStep = findStep('Items');

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
                                                        </div>
                                                    </div>

                                                    <div className="px-6 pb-6 border-b border-gray-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-3">
                                                            {itemStep?.details.map((field) => (
                                                                <div
                                                                    key={field.id}
                                                                    className={field.label.toLowerCase().includes('notes') ? 'md:col-span-1 lg:col-span-1' : ''}
                                                                >
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                        {field.label}
                                                                        {<span className="text-red-500 ml-1">*</span>}
                                                                    </label>
                                                                    {renderField(field, generateKey('Items'), item)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
                                {formTemplate
                                    .filter(step => step.is_default === 0)
                                    .map(step => (
                                        <div key={step.step_name}>
                                            <div className="flex items-center mb-6">
                                                <h4 className="text-lg font-bold text-gray-900">
                                                    {step.step_name}
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {step.details.map((field) => (
                                                    <div key={field.id}>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            {field.label}
                                                        </label>
                                                        {renderField(field, generateKey(step.step_name))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>


                        <div className="xl:col-span-1">
                            <div className="sticky top-20 space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                    <div className="flex items-center mb-6">
                                        <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-900">Ringkasan Pesanan</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Total Item:</span>
                                            <span className="font-semibold">{transactionData.items.length}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Jumlah Total Bayar:</span>
                                            <span className="font-bold text-lg text-green-600">
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            {findStep('Customer Information') && (() => {
                                                const customerStep = findStep('Customer Information')!;
                                                const customerStepKey = generateKey(customerStep.step_name);
                                                const renderCustomerField = (label: string, fullWidth: boolean = false) => {
                                                    const field = customerStep.details.find(f => f.label === label);
                                                    if (!field) return null;

                                                    return (
                                                        <div key={field.id} className={fullWidth ? 'md:col-span-2' : ''}>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                                {field.label}
                                                                {field.is_default === 1 && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {renderField(field, customerStepKey)}
                                                        </div>
                                                    );
                                                };
                                                return (
                                                    <div >
                                                        {renderCustomerField('Notes', true)}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-8 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                                    >
                                        {loading ? "Creating..." : "Buat Transaksi"}
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