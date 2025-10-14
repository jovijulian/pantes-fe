"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import { User, Calculator, Package, Edit, Plus } from 'lucide-react';

import Input from "@/components/form/input/InputField";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import CreatableSelect from "@/components/form/CreatableSelect";
import ConfirmationModal from "@/components/modal/ConfirmationModal";
import AddItemModal from '@/components/modal/AddItemModal';

interface FieldValue { id: number; field_id: string; value: string; status: string; created_at: string; updated_at: string; }
interface FormField { id: number; label: string; value_type: number; value_length: number; is_default: number; status: number; created_at: string; updated_at: string; field_value: FieldValue[]; }
interface FormStep { step: string; step_name: string; is_default: number; details: FormField[]; }
interface TransactionItem { _id: string;[key: string]: any; }
interface TransactionData { [key: string]: any; items: TransactionItem[]; }

const generateKey = (str: string): string => str.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').trim();
const formatCurrency = (amount: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

export default function DynamicEditTransactionPage() {
    const router = useRouter();
    const params = useParams();
    const transactionId = params.id as string;

    const [formTemplate, setFormTemplate] = useState<FormStep[]>([]);
    const [transactionData, setTransactionData] = useState<TransactionData>({ items: [] });
    const [transactionDetailIds, setTransactionDetailIds] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, });

    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [role, setRole] = useState<number | null>(null);
    useEffect(() => {
        const userRole = localStorage.getItem("role");
        if (userRole) {
            setRole(Number(userRole));
        }
    }, []);
    const fetchData = useCallback(async () => {
        if (!transactionId || role === null) return;
        try {
            setLoading(true);
            setError(null);

            const templateResponse = await httpGet(endpointUrl('form'), true);
            if (templateResponse.status !== 200 || !templateResponse.data?.data) throw new Error('Failed to load form template.');
            const template: FormStep[] = templateResponse.data.data;
            setFormTemplate(template);
            let endpoint = '';
            if (role === 1) {
                endpoint = endpointUrl(`/customer/history/${transactionId}`);
            } else if (role === 2) {
                endpoint = endpointUrl(`/sales/transaction/${transactionId}`);
            } else {
                console.error("Unknown user role:", role);
                return;
            }
            const detailResponse = await httpGet(endpoint, true);
            if (detailResponse.status !== 200 || !detailResponse.data?.data) throw new Error('Failed to load transaction details.');
            const transactionDetail = detailResponse.data.data;

            populateTransactionData(template, transactionDetail);
        } catch (err: any) {
            console.error("Failed to fetch initial data:", err);
            setError(err.message || 'Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [transactionId, role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const populateTransactionData = (template: FormStep[], detail: any) => {
        const initialData: TransactionData = { items: [] };
        const initialDetailIds: any = { items: [] };
        const groupedDetails = detail.details_grouped;

        groupedDetails.forEach((stepDetail: any) => {
            const stepKey = generateKey(stepDetail.step_name);

            if (stepDetail.step_name === "Items") {
                const itemFieldsFromBE = stepDetail.details;

                const valuesByFieldId = itemFieldsFromBE.reduce((acc: any, field: any) => {
                    const fieldId = field.id;
                    if (!acc[fieldId]) {
                        acc[fieldId] = [];
                    }
                    acc[fieldId].push(...field.field_value);
                    return acc;
                }, {});

                const priceFieldTemplate = template.find(s => s.step_name === "Items")?.details.find(f => f.label === "Price (IDR)");
                const numItems = priceFieldTemplate && valuesByFieldId[priceFieldTemplate.id]
                    ? valuesByFieldId[priceFieldTemplate.id].length
                    : 0;

                const fieldCounters: { [key: string]: number } = {};

                for (let i = 0; i < numItems; i++) {
                    const newItem: TransactionItem = { _id: `${Date.now()}-${i}` };
                    const newItemIds: any = { _id: newItem._id };

                    template.find(s => s.step_name === "Items")?.details.forEach(fieldTemplate => {
                        const fieldId = fieldTemplate.id;
                        const fieldKey = generateKey(fieldTemplate.label);

                        if (fieldCounters[fieldId] === undefined) {
                            fieldCounters[fieldId] = 0;
                        }

                        const valuesForThisField = valuesByFieldId[fieldId];
                        if (valuesForThisField && fieldCounters[fieldId] < valuesForThisField.length) {
                            const detailValue = valuesForThisField[fieldCounters[fieldId]];
                            newItemIds[fieldKey] = detailValue.id;

                            const value = detailValue.value;
                            if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
                                try {
                                    const parsedValue = JSON.parse(value);
                                    newItem[fieldKey] = Array.isArray(parsedValue)
                                        ? parsedValue.map(v => v.value)
                                        : value;
                                } catch (e) {
                                    newItem[fieldKey] = value;
                                }
                            } else {
                                newItem[fieldKey] = value;
                            }

                            fieldCounters[fieldId]++;
                        }
                    });

                    initialData.items.push(newItem);
                    initialDetailIds.items.push(newItemIds);
                }
            } else {
                initialData[stepKey] = {};
                initialDetailIds[stepKey] = {};
                stepDetail.details.forEach((fieldDetail: any) => {
                    const fieldKey = generateKey(fieldDetail.label);
                    const detailValue = fieldDetail.field_value[0];
                    if (detailValue) {
                        initialDetailIds[stepKey][fieldKey] = detailValue.id;
                        const value = detailValue.value;
                        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
                            try {
                                const parsedValue = JSON.parse(value);
                                initialData[stepKey][fieldKey] = Array.isArray(parsedValue) ? parsedValue.map(v => v.value) : value;
                            } catch (e) {
                                initialData[stepKey][fieldKey] = value;
                            }
                        } else {
                            initialData[stepKey][fieldKey] = value;
                        }
                    }
                });
            }
        });

        setTransactionData(initialData);
        setTransactionDetailIds(initialDetailIds);
    };

    const updateFieldOnServer = useCallback(async (field: FormField, newValue: any, detailId: number | undefined) => {
        if (detailId === undefined) { toast.error(`Cannot update '${field.label}'. Detail ID not found.`); return; }
        const payload = { transaction_detail_id: detailId, field_id: field.id, value: [] as { field_value_id: number; value: any }[] };
        if (field.value_type === 3 && Array.isArray(newValue)) {
            newValue.forEach(val => { const selectedOption = field.field_value.find(opt => opt.value === val); payload.value.push({ field_value_id: selectedOption ? selectedOption.id : 0, value: val }); });
        } else {
            let fieldValueId = 0;
            if (field.value_type === 3 && newValue) { const selectedOption = field.field_value.find(opt => opt.value === newValue); if (selectedOption) fieldValueId = selectedOption.id; }
            payload.value.push({ field_value_id: fieldValueId, value: newValue });
        }
        try {
            await httpPost(endpointUrl(`sales/transaction/${transactionId}/update`), payload, true);
            toast.success(`'${field.label}' updated successfully!`);
            fetchData();
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error(error?.response?.data?.errors?.type || `Failed to update '${field.label}'`);
        }
    }, [transactionId]);

    const debouncedUpdate = useCallback((field: FormField, value: any, detailId: number | undefined) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => { updateFieldOnServer(field, value, detailId); }, 800);
    }, [updateFieldOnServer]);

    const handleFieldChange = (stepKey: string, field: FormField, value: any) => {
        const fieldKey = generateKey(field.label);
        setTransactionData(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], [fieldKey]: value } }));
        const detailId = transactionDetailIds[stepKey]?.[fieldKey];
        debouncedUpdate(field, value, detailId);
    };

    const handleItemChange = (itemId: string, field: FormField, value: any) => {
        const fieldKey = generateKey(field.label);
        const itemIndex = transactionData.items.findIndex(item => item._id === itemId);
        if (itemIndex === -1) return;
        setTransactionData(prev => ({ ...prev, items: prev.items.map(item => item._id === itemId ? { ...item, [fieldKey]: value } : item) }));
        const detailId = transactionDetailIds.items[itemIndex]?.[fieldKey];
        debouncedUpdate(field, value, detailId);
    };

    const handleCreateOption = async (fieldId: number, newValue: string) => {
        try {
            const payload = { value: newValue };
            const response = await httpPost(endpointUrl(`master/field/${fieldId}/add-value`), payload, true);
            const createdOption = response.data.data.field_value;
            setFormTemplate(prevTemplate => {
                const newTemplate = JSON.parse(JSON.stringify(prevTemplate));
                for (const step of newTemplate) {
                    const field = step.details.find((f: any) => f.id === fieldId);
                    if (field) { field.field_value.push({ id: createdOption.id, value: createdOption.value }); break; }
                }
                return newTemplate;
            });
            toast.success(`Option "${newValue}" added successfully!`);
            return { value: createdOption.value, label: createdOption.value };
        } catch (error) {
            console.error("Failed to create new option:", error);
            toast.error("Failed to add new data.");
            return null;
        }
    };

    const findStep = (stepName: string): FormStep | undefined => formTemplate.find(step => step.step_name === stepName);
    const totalAmount = transactionData.items.reduce((sum, item) => sum + (Number(item[generateKey('Price (IDR)')]) || 0), 0);

    const renderField = (field: FormField, stepKey: string, item?: TransactionItem, disabled: boolean = false) => {
        const fieldKey = generateKey(field.label);
        const value = item ? item[fieldKey] : transactionData[stepKey]?.[fieldKey];
        const onChange = (newValue: any) => item ? handleItemChange(item._id, field, newValue) : handleFieldChange(stepKey, field, newValue);
        const commonProps = { placeholder: field.label, key: `${stepKey}_${fieldKey}_${item?._id || 'step'}`, disabled };
        switch (field.value_type) {
            case 1: return <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} {...commonProps} />;
            case 2:
                if (field.label.toLowerCase().includes('phone')) {
                    return <Input type="tel" value={value || ''} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))} {...commonProps} />;
                }
                const formatNumber = (numStr: string | number) => new Intl.NumberFormat('id-ID').format(Number(String(numStr || '').replace(/[^0-9]/g, '')));
                return <Input type="text" value={formatNumber(value)} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))} {...commonProps} />;
            case 3:
                const options = field.field_value.map(opt => ({ value: opt.value.toString(), label: opt.value }));
                const isMulti = Array.isArray(value);
                const onCreate = (inputValue: string) => setModalState({
                    isOpen: true, title: `Tambahkan ${field.label} Baru`, message: `Apakah Anda yakin ingin menambahkan "${inputValue}"?`, onConfirm: async () => {
                        const newOption = await handleCreateOption(field.id, inputValue);
                        if (newOption) {
                            if (isMulti) {
                                onChange([...(value || []), newOption.value]);
                            } else {
                                onChange(newOption.value);
                            }
                        }
                    }
                });
                const handleSelectChange = (selection: any) => isMulti ? onChange(selection ? selection.map((opt: any) => opt.value) : []) : onChange(selection ? selection.value : null);
                const currentValue = isMulti ? options.filter(opt => (value || []).includes(opt.value)) : options.find(opt => opt.value === (value || '').toString()) || null;
                return <CreatableSelect {...commonProps} 
                options={options} value={currentValue} 
                onChange={handleSelectChange} 
                // onCreateOption={onCreate} 
                isMulti={isMulti} />;
            case 4: return <SingleDatePicker {...commonProps} placeholderText={`Select ${field.label}`} selectedDate={value ? new Date(value) : null} onChange={(date: Date | null) => onChange(date ? moment(date).format('YYYY-MM-DD') : null)} onClearFilter={() => onChange(null)} viewingMonthDate={value ? new Date(value) : new Date()} onMonthChange={() => { }} />;
            default: return <div className="text-red-500 text-sm">Unsupported field.</div>;
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-600 font-semibold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-600 p-3 rounded-lg"><Edit className="h-8 w-8 text-white" /></div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Transaksi</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Transaksi ID: {transactionId}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {findStep('Customer Information') && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 opacity-80">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Informasi Pelanggan (Hanya Baca)</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {findStep('Customer Information')!.details.map(field => (<div key={field.id}><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>{renderField(field, generateKey('Customer Information'), undefined, true)}</div>))}
                                    </div>
                                </div>
                            )}

                            {findStep('Items') && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3"><div className="bg-green-600 p-2 rounded-lg"><Package className="h-6 w-6 text-white" /></div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Items</h2></div>
                                        <button type="button" onClick={() => setIsAddItemModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Plus className="h-4 w-4 mr-2" />Add Item</button>
                                    </div>
                                    <div className="space-y-6">
                                        {transactionData.items.map((item, index) => (
                                            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Item #{index + 1}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {findStep('Items')!.details.map(field => (<div key={field.id}><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>{renderField(field, generateKey('Items'), item)}</div>))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
                                {formTemplate.filter(step => !step.is_default).map(step => (
                                    <div key={step.step_name}>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{step.step_name}</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {step.details.map(field => (<div key={field.id}><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>{renderField(field, generateKey(step.step_name))}</div>))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="xl:col-span-1">
                            <div className="sticky top-20 space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                                    <div className="flex items-center gap-3 mb-6"><Calculator className="h-6 w-6 text-blue-600" /><h3 className="text-xl font-bold text-gray-900 dark:text-white">Ringkasan Pesanan</h3></div>
                                    <div className="space-y-4"><div className="flex justify-between py-2 border-b dark:border-gray-700"><span className="text-gray-600 dark:text-gray-400">Total Item:</span><span className="font-semibold dark:text-white">{transactionData.items.length}</span></div><div className="flex justify-between py-2"><span className="text-gray-600 dark:text-gray-400">Jumlah Total Bayar:</span><span className="font-bold text-lg text-green-600">{formatCurrency(totalAmount)}</span></div></div>
                                    <button type="button" onClick={() => router.push('/transactions')} className="w-full mt-8 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold">Kembali ke Transaksi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <AddItemModal
                    isOpen={isAddItemModalOpen}
                    onClose={() => setIsAddItemModalOpen(false)}
                    onSuccess={() => {
                        setIsAddItemModalOpen(false);
                        fetchData();
                    }}
                    formTemplate={formTemplate}
                    transactionId={transactionId}
                    handleCreateOption={handleCreateOption}
                    setModalState={setModalState}
                />

                <ConfirmationModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
            </div>
        </div>
    );
}