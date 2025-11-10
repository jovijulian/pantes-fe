"use client";

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost, alertToast, endpointUrlv2 } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import {
    Check, Loader2, Plus, Trash2,
    Save, X, Info
} from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Dialog, Transition } from '@headlessui/react'; 

interface BankOption {
    value: string; 
    label: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    [key: string]: any; 
}

interface FormPaymentType {
    id: string;
    payment_type: string;
    bank_id: number | null;
    nominal: number;
}

interface FormState {
    date: string;
    payment_date: string;
    staff_id: number | null;
    supplier_id: number | null;
    weight: string; 
    cokim: number; 
    nominal: number; 
    payment_type: FormPaymentType[];
}

interface SelectOption { value: string; label: string; }

interface PaymentPayload {
    payment_type: string;
    bank_id: number | null;
    nominal: number;
}

interface PurchaseOrderPayload {
    date: string;
    staff_id: number;
    supplier_id: number;
    weight: number;
    cokim: number;
    nominal: number;
    payment_type: PaymentPayload[];
}

const paymentMethodOptions: SelectOption[] = [
    { value: "BANK TRANSFER", label: "Bank Transfer" },
    { value: "SETOR TUNAI", label: "Setor Tunai" },
    { value: "CV(FAKTUR)", label: "CV (Faktur)" },
    { value: "LAINNYA", label: "Lainnya" },
];

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [staffOptions, setStaffOptions] = useState<SelectOption[]>([]);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [bankOptions, setBankOptions] = useState<BankOption[]>([]); 
    
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        payment_date: moment().format('YYYY-MM-DD'),
        staff_id: null,
        supplier_id: null,
        weight: "0",
        cokim: 0, 
        nominal: 0,
        payment_type: [],
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [staffRes, supplierRes, bankRes] = await Promise.all([
                    httpGet(endpointUrlv2("master/staff/dropdown"), true),
                    httpGet(endpointUrlv2("master/supplier/dropdown"), true),
                    httpGet(endpointUrlv2("master/bank/dropdown"), true),
                ]);

                setStaffOptions(staffRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                
                const formattedBankOptions: BankOption[] = bankRes.data.data.map((b: any) => ({
                    value: b.id.toString(),
                    label: `${b.bank_name} - ${b.account_number} (${b.account_name})`,
                    bank_name: b.bank_name,
                    account_name: b.account_name,
                    account_number: b.account_number,
                }));
                setBankOptions(formattedBankOptions);

            } catch (error) {
                toast.error("Gagal memuat data master untuk form.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const weight = parseFloat(formData.weight) || 0;
        const cokim = formData.cokim || 0; 
        setFormData(prev => ({ ...prev, nominal: weight * cokim }));
    }, [formData.weight, formData.cokim]);

    const { totalPayment, remainingBalance } = useMemo(() => {
        const totalPayment = formData.payment_type.reduce((acc, payment) => {
            return acc + (payment.nominal || 0);
        }, 0);
        const remainingBalance = formData.nominal - totalPayment;
        return { totalPayment, remainingBalance };
    }, [formData.nominal, formData.payment_type]);


    const handleFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentChange = (index: number, field: keyof FormPaymentType, value: any) => {
        const newPayments = [...formData.payment_type];
        const payment = newPayments[index];

        (payment[field] as any) = value;

        if (field === 'payment_type' && (value !== 'BANK TRANSFER' || value !== 'SETOR TUNAI')) {
            payment.bank_id = null;
        }


        setFormData(prev => ({ ...prev, payment_type: newPayments }));
    };

    const addPayment = () => {
        const newNominal = remainingBalance > 0 ? remainingBalance : 0;
        setFormData(prev => ({
            ...prev,
            payment_type: [
                ...prev.payment_type,
                {
                    id: `payment-${Date.now()}`,
                    payment_type: "BANK TRANSFER",
                    bank_id: null,
                    nominal: newNominal,
                }
            ]
        }));
    };

    const removePayment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            payment_type: formData.payment_type.filter((_, i) => i !== index)
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.date || !formData.staff_id || !formData.supplier_id) {
            toast.error("Harap isi Tanggal, Pemesan, dan Supplier.");
            return false;
        }
        if (formData.nominal <= 0 || formData.weight === "0" || formData.cokim === 0) {
            toast.error("Weight, Cokim, dan Nominal harus lebih besar dari 0.");
            return false;
        }
        if (formData.payment_type.length === 0) {
            toast.error("Harap tambahkan minimal satu metode pembayaran.");
            return false;
        }
        if (remainingBalance !== 0) {
            toast.error(`Pembayaran tidak seimbang. Sisa saldo: Rp ${remainingBalance.toLocaleString('id-ID')}`);
            return false;
        }

        for (const p of formData.payment_type) {
            if (p.nominal <= 0) {
                toast.error("Nominal di setiap baris pembayaran harus lebih besar dari 0.");
                return false;
            }
            if ((p.payment_type === "BANK TRANSFER" || p.payment_type === "SETOR TUNAI") && !p.bank_id) {
                toast.error("Untuk Bank Transfer / Setor Tunai, harap pilih Bank.");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsModalOpen(true);
        }
    };

    const handleConfirmSubmit = async () => {
        setIsModalOpen(false);
        setIsSubmitting(true);

        const paymentPayload: PaymentPayload[] = formData.payment_type.map(p => ({
            payment_type: p.payment_type,
            bank_id: (p.payment_type === "BANK TRANSFER" || p.payment_type === "SETOR TUNAI") ? Number(p.bank_id) : null,
            nominal: p.nominal 
        }));

        const payload: PurchaseOrderPayload = {
            date: moment(formData.date).format('YYYY-MM-DD'),
            staff_id: Number(formData.staff_id),
            supplier_id: Number(formData.supplier_id),
            weight: parseFloat(formData.weight),
            cokim: formData.cokim, 
            nominal: formData.nominal,
            payment_type: paymentPayload,
        };
        

        try {
            await httpPost(endpointUrlv2('/purchase/order'), payload, true);
            toast.success("Purchase Order (PO) berhasil dibuat!");
            router.push('/purchasing/orders');
        } catch (error: any) {
            console.error(error);
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                <div className="w-full flex flex-col gap-6">

                    <ComponentCard title="Purchase Order">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-2">
                            <div className="md:col-span-12 space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Tanggal Pesan<span className="text-red-400 ml-1">*</span></label>
                                    <SingleDatePicker
                                        placeholderText="Pilih tanggal"
                                        selectedDate={formData.date ? new Date(formData.date) : null}
                                        onChange={(date: any) => handleFieldChange('date', moment(date).format('YYYY-MM-DD'))}
                                        onClearFilter={() => handleFieldChange('date', '')}
                                        viewingMonthDate={viewingMonthDate}
                                        onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-6 space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Pemesan<span className="text-red-400 ml-1">*</span></label>
                                    <Select
                                        options={staffOptions}
                                        value={_.find(staffOptions, { value: formData.staff_id?.toString() })}
                                        onValueChange={(opt) => handleFieldChange('staff_id', opt ? parseInt(opt.value) : null)}
                                        placeholder="Pilih pemesan..."
                                        disabled={loadingOptions}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Supplier<span className="text-red-400 ml-1">*</span></label>
                                    <Select
                                        options={supplierOptions}
                                        value={_.find(supplierOptions, { value: formData.supplier_id?.toString() })}
                                        onValueChange={(opt) => handleFieldChange('supplier_id', opt ? parseInt(opt.value) : null)}
                                        placeholder="Pilih supplier..."
                                        disabled={loadingOptions}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-6 space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Berat (gr)<span className="text-red-400 ml-1">*</span></label>
                                    <Input type="number" value={formData.weight} onChange={(e) => handleFieldChange('weight', e.target.value)} min="0" placeholder='0' />
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    <div>
                                        <label className="block font-medium mb-1">Cokim<span className="text-red-400 ml-1">*</span></label>
                                        <CurrencyInput
                                            value={formData.cokim}
                                            onValueChange={(value) => handleFieldChange('cokim', value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Nominal</label>
                                    <Input type="text" value={`Rp ${formData.nominal.toLocaleString('id-ID')}`} disabled readOnly className="bg-gray-100" />
                                </div>
                            </div>
                        </div>
                    </ComponentCard>

                    <ComponentCard title="Pembayaran">
                       

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.payment_type.map((payment, index) => {
                                        const selectedBank = payment.bank_id 
                                            ? bankOptions.find(b => b.value === payment.bank_id?.toString()) 
                                            : null;

                                        return (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[200px]">
                                                    <Select
                                                        options={paymentMethodOptions}
                                                        value={_.find(paymentMethodOptions, { value: payment.payment_type })}
                                                        onValueChange={(opt) => handlePaymentChange(index, 'payment_type', opt ? opt.value : '')}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[500px]">
                                                {(payment.payment_type === "BANK TRANSFER" || payment.payment_type === "SETOR TUNAI") && (
                                                        <Select
                                                            options={bankOptions} 
                                                            value={_.find(bankOptions, { value: payment.bank_id?.toString() })}
                                                            onValueChange={(opt) => handlePaymentChange(index, 'bank_id', opt ? parseInt(opt.value) : null)}
                                                            placeholder="Pilih bank..."
                                                            disabled={loadingOptions}
                                                        />
                                                    )}
                                                </td>

                                                <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                                                    <CurrencyInput
                                                        value={payment.nominal}
                                                        onValueChange={(value) => handlePaymentChange(index, 'nominal', value)}
                                                        placeholder="Rp 0"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => removePayment(index)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={addPayment}
                                disabled={formData.nominal <= 0}
                                className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah
                            </button>
                        </div>
                        <div className="flex justify-end gap-6 p-2 mb-4">
                            <CurrencyDisplay title="Total Nominal" value={formData.nominal} />
                            <CurrencyDisplay
                                title="Sisa Bayar"
                                value={remainingBalance}
                                color={remainingBalance === 0 ? 'text-green-600' : 'text-red-600'}
                            />
                        </div>

                    </ComponentCard>
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </button>
                    <button
                        type="submit" 
                        disabled={isSubmitting || loadingOptions || remainingBalance !== 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:bg-gray-400"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? "Menyimpan..." : "Save"}
                    </button>
                </div>
            </form>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                totalNominal={formData.nominal}
                paymentCount={formData.payment_type.length}
            />
        </>
    );
}

const CurrencyInput: React.FC<{
    value: number;
    onValueChange: (value: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}> = ({ value, onValueChange, placeholder, disabled, className = "" }) => {

    const format = (num: number) => {
        if (num === 0) return "";
        return num.toLocaleString('id-ID');
    };

    const parse = (str: string): number => {
        if (!str) return 0;
        const numOnly = str.replace(/[^\d]/g, '');
        return parseInt(numOnly, 10) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numberValue = parse(rawValue);
        
        onValueChange(numberValue);
    };

    return (
        <Input
            type="text"
            value={format(value)} 
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};

const CurrencyDisplay: React.FC<{ title: string; value: number; color?: string }> = ({ title, value, color = 'text-gray-900' }) => (
    <div className="text-right">
        <span className="text-sm text-gray-500">{title}</span>
        <p className={`text-xl font-semibold ${color}`}>
            Rp {value.toLocaleString('id-ID')}
        </p>
    </div>
);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    totalNominal: number;
    paymentCount: number;
}> = ({ isOpen, onClose, onConfirm, isSubmitting, totalNominal, paymentCount }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50 " onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 h-full w-full" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                    <Info className="w-6 h-6 text-blue-600" />
                                    Konfirmasi Penyimpanan
                                </Dialog.Title>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Anda akan menyimpan Purchase Order ini. Pastikan data sudah benar.
                                    </p>
                                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                                        <p>Total Nominal: <span className="font-semibold">Rp {totalNominal.toLocaleString('id-ID')}</span></p>
                                        <p>Jumlah Pembayaran: <span className="font-semibold">{paymentCount}</span></p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" onClick={onClose} disabled={isSubmitting}>
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
                                        onClick={onConfirm}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};