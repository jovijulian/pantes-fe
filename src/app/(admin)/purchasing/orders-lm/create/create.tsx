"use client";

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost, alertToast } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import {
    Check, Loader2, Plus, Trash2,
    Save, X, Info, AlertTriangle
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

interface FormItemType {
    id: string;
    item_id: number | null;
    weight: number;
    pcs: number;
    nominal: number;
}

interface FormPaymentType {
    id: string;
    payment_type: string;
    supplier_bank_id: number | null;
    nominal: number;
}

interface FormState {
    date: string;
    staff_id: number | null;
    supplier_id: number | null;
    items: FormItemType[];
    payment_type: FormPaymentType[];
}

interface SelectOption { value: string; label: string; }

interface PaymentPayload {
    payment_type: string;
    supplier_bank_id: number | null;
    nominal: number;
}

interface ItemPayload {
    item_id: number;
    weight: number;
    pcs: number;
    nominal: number;
    total_nominal: number;
}

interface PurchaseOrderPayload {
    type: number;
    date: string;
    staff_id: number;
    supplier_id: number;
    weight: number;
    pcs: number;
    nominal: number;
    payment_type: PaymentPayload[];
    items: ItemPayload[];
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
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [bankOptions, setBankOptions] = useState<BankOption[]>([]);

    const [isBankLoading, setIsBankLoading] = useState(false);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        staff_id: null,
        supplier_id: null,
        items: [],
        payment_type: [],
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [staffRes, supplierRes, itemRes] = await Promise.all([
                    httpGet(endpointUrl("master/staff/dropdown"), true),
                    httpGet(endpointUrl("master/supplier/dropdown"), true),
                    httpGet(endpointUrl("master/item/dropdown"), true, { type: 2 }),
                ]);

                setStaffOptions(staffRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setItemOptions(itemRes.data.data.map((i: any) => ({
                    value: i.id.toString(),
                    label: `${i.name_item} (${i.code})`,
                })));

            } catch (error) {
                toast.error("Gagal memuat data master untuk form.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchSupplierBanks = async (supplierId: number) => {
            setIsBankLoading(true);
            try {
                const res = await httpGet(endpointUrl(`master/supplier/${supplierId}/bank/dropdown`), true);
                const formattedBankOptions: BankOption[] = res.data.data.map((b: any) => ({
                    value: b.id.toString(),
                    label: `${b.bank_name} - ${b.account_number} (${b.account_name})`,
                    bank_name: b.bank_name,
                    account_name: b.account_name,
                    account_number: b.account_number,
                }));
                setBankOptions(formattedBankOptions);

            } catch (error) {
                toast.error("Gagal memuat data bank untuk supplier ini.");
                setBankOptions([]);
            } finally {
                setIsBankLoading(false);
            }
        };

        if (formData.supplier_id) {
            fetchSupplierBanks(formData.supplier_id);
            setFormData(prev => ({ ...prev, payment_type: [] }));
            if (formData.payment_type.length > 0) {
                toast.info("Supplier diubah, harap pilih ulang bank pembayaran.");
            }
        } else {
            setBankOptions([]);
            setFormData(prev => ({ ...prev, payment_type: [] }));
        }
    }, [formData.supplier_id]);

    const { totalWeight, totalPcs, totalNominal } = useMemo(() => {
        let weight = 0;
        let pcs = 0;
        let nominal = 0;

        formData.items.forEach(item => {
            weight += (item.weight || 0) * (item.pcs || 0);
            pcs += (item.pcs || 0);
            nominal += (item.nominal || 0) * (item.pcs || 0);
        });

        return { totalWeight: weight, totalPcs: pcs, totalNominal: nominal };
    }, [formData.items]);

    const { totalPayment, remainingBalance } = useMemo(() => {
        const totalPayment = formData.payment_type.reduce((acc, payment) => acc + (payment.nominal || 0), 0);
        const remainingBalance = totalNominal - totalPayment;
        return { totalPayment, remainingBalance };
    }, [totalNominal, formData.payment_type]);

    const handleFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index: number, field: keyof FormItemType, value: any) => {
        const newItems = [...formData.items];
        (newItems[index][field] as any) = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: `item-${Date.now()}`,
                    item_id: null,
                    weight: 0,
                    pcs: 0,
                    nominal: 0,
                }
            ]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: formData.items.filter((_, i) => i !== index)
        }));
    };

    const handlePaymentChange = (index: number, field: keyof FormPaymentType, value: any) => {
        const newPayments = [...formData.payment_type];
        const payment = newPayments[index];

        (payment[field] as any) = value;

        if (field === 'payment_type' && (value !== 'BANK TRANSFER' && value !== 'SETOR TUNAI')) {
            payment.supplier_bank_id = null;
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
                    supplier_bank_id: null,
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
        if (formData.items.length === 0) {
            toast.error("Harap tambahkan minimal satu item.");
            return false;
        }

        for (const item of formData.items) {
            if (!item.item_id ) {
                toast.error("Pastikan semua item sudah dipilih.");
                return false;
            }
        }

        if (formData.payment_type.length === 0) {
            toast.error("Harap tambahkan minimal satu metode pembayaran.");
            return false;
        }

       
        for (const p of formData.payment_type) {
            if (p.nominal <= 0) {
                toast.error("Nominal di setiap baris pembayaran harus lebih besar dari 0.");
                return false;
            }
            if ((p.payment_type === "BANK TRANSFER" || p.payment_type === "SETOR TUNAI") && !p.supplier_bank_id) {
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

        const itemsPayload: ItemPayload[] = formData.items.map(i => ({
            item_id: Number(i.item_id),
            weight: i.weight,
            pcs: i.pcs,
            nominal: i.nominal,
            total_nominal: i.nominal * i.pcs
        }));

        const paymentPayload: PaymentPayload[] = formData.payment_type.map(p => ({
            payment_type: p.payment_type,
            supplier_bank_id: (p.payment_type === "BANK TRANSFER" || p.payment_type === "SETOR TUNAI") ? Number(p.supplier_bank_id) : null,
            nominal: p.nominal
        }));

        const payload: PurchaseOrderPayload = {
            type: 2,
            date: moment(formData.date).format('YYYY-MM-DD'),
            staff_id: Number(formData.staff_id),
            supplier_id: Number(formData.supplier_id),
            weight: totalWeight,
            pcs: totalPcs,
            nominal: totalNominal,
            payment_type: paymentPayload,
            items: itemsPayload
        };

        try {
            await httpPost(endpointUrl('/purchase/order'), payload, true);
            toast.success("Purchase Order (PO) LM berhasil dibuat!");
            router.push('/purchasing/orders-lm');
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dark:bg-gray-900 min-h-screen pb-10 transition-colors">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                <div className="w-full flex flex-col gap-6">
                    <ComponentCard title="Informasi Pesanan LM">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-2">
                            <div className="md:col-span-12 space-y-4">
                                <div>
                                    <label className="block font-medium mb-1 dark:text-gray-200">Tanggal Pesan<span className="text-red-400 ml-1">*</span></label>
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
                                <label className="block font-medium mb-1 dark:text-gray-200">Pemesan<span className="text-red-400 ml-1">*</span></label>
                                <Select
                                    options={staffOptions}
                                    value={_.find(staffOptions, { value: formData.staff_id?.toString() })}
                                    onValueChange={(opt) => handleFieldChange('staff_id', opt ? parseInt(opt.value) : null)}
                                    placeholder="Pilih pemesan..."
                                    disabled={loadingOptions}
                                />
                            </div>
                            <div className="md:col-span-6 space-y-4">
                                <label className="block font-medium mb-1 dark:text-gray-200">Supplier<span className="text-red-400 ml-1">*</span></label>
                                <Select
                                    options={supplierOptions}
                                    value={_.find(supplierOptions, { value: formData.supplier_id?.toString() })}
                                    onValueChange={(opt) => handleFieldChange('supplier_id', opt ? parseInt(opt.value) : null)}
                                    placeholder="Pilih supplier..."
                                    disabled={loadingOptions}
                                />
                            </div>
                        </div>
                    </ComponentCard>


                    <ComponentCard title="Pembayaran">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jenis</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bank Supplier</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nominal</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {formData.payment_type.map((payment, index) => {
                                        return (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[200px]">
                                                    <Select
                                                        options={paymentMethodOptions}
                                                        value={_.find(paymentMethodOptions, { value: payment.payment_type })}
                                                        onValueChange={(opt) => handlePaymentChange(index, 'payment_type', opt ? opt.value : '')}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[400px]">
                                                    {(payment.payment_type === "BANK TRANSFER" || payment.payment_type === "SETOR TUNAI") && (
                                                        <Select
                                                            options={bankOptions}
                                                            value={_.find(bankOptions, { value: payment.supplier_bank_id?.toString() })}
                                                            onValueChange={(opt) => handlePaymentChange(index, 'supplier_bank_id', opt ? parseInt(opt.value) : null)}
                                                            placeholder={
                                                                !formData.supplier_id ? "Pilih supplier dulu..." :
                                                                    isBankLoading ? "Memuat bank..." : "Pilih bank supplier..."
                                                            }
                                                            disabled={loadingOptions || isBankLoading || !formData.supplier_id}
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
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removePayment(index)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md"
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

                        <div className="flex gap-2 mt-4 mb-4">
                            <button
                                type="button"
                                onClick={addPayment}
                                disabled={formData.supplier_id === null}
                                className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Pembayaran
                            </button>
                        </div>
                        <div className="flex justify-end gap-6 p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <CurrencyDisplay title="Total Nominal Pembayaran" value={totalPayment} />
                        </div>


                    </ComponentCard>
                    <ComponentCard title="Data LM">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jenis Barang</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Berat</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PCS</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nominal</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {formData.items.map((item, index) => {
                                        const subtotal = (item.nominal || 0) * (item.pcs || 0);
                                        return (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[250px]">
                                                    <Select
                                                        options={itemOptions}
                                                        value={_.find(itemOptions, { value: item.item_id?.toString() })}
                                                        onValueChange={(opt) => handleItemChange(index, 'item_id', opt ? parseInt(opt.value) : null)}
                                                        placeholder="Pilih item..."
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">

                                                    <Input type="number" value={item.weight || ''} onChange={(e) => handleItemChange(index, 'weight', e.target.value || 0)} placeholder='0' />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[120px]">

                                                    <Input type="number" value={item.pcs || ''} onChange={(e) => handleItemChange(index, 'pcs', parseInt(e.target.value) || 0)} placeholder='0' />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap min-w-[180px]">
                                                    <CurrencyInput
                                                        value={item.nominal}
                                                        onValueChange={(value) => handleItemChange(index, 'nominal', value)}
                                                        placeholder="Rp 0"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-700 dark:text-gray-200">
                                                        Rp {subtotal.toLocaleString('id-ID')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md"
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
                                onClick={addItem}
                                disabled={formData.supplier_id === null}
                                className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Item
                            </button>
                        </div>
                        <div className="flex justify-end gap-6 p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                            <GramDisplay title="Total Berat (gr)" value={totalWeight} />
                            <CurrencyDisplay
                                title="Total Nominal Item"
                                value={totalNominal}
                            />
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

                            <div className={`text-right mt-2 font-medium ${remainingBalance === 0 ? 'text-emerald-500' : 'text-orange-500'
                                }`}>
                                {remainingBalance === 0 ? (
                                    <span className="flex items-center gap-1 justify-end"><Check className="w-4 h-4" /> Pembayaran Balance</span>
                                ) : (
                                    <span>
                                        Selisih: Rp {Math.abs(remainingBalance).toLocaleString('id-ID')}
                                        {/* {remainingBalance > 0 ? ' (Kurang Bayar)' : ' (Lebih Bayar)'} */}
                                    </span>
                                )}
                            </div>
                        </div>
                    </ComponentCard>




                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingOptions || totalNominal === 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
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
                totalNominal={totalNominal}
                paymentCount={formData.payment_type.length}
                remainingBalance={remainingBalance}
            />
        </div>
    );
}

const CurrencyInput: React.FC<{
    value: number;
    onValueChange: (value: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}> = ({ value, onValueChange, placeholder, disabled, className = "" }) => {
    const [displayValue, setDisplayValue] = useState("");

    const formatThousand = (numStr: string) => {
        if (!numStr) return "";
        return Number(numStr).toLocaleString("id-ID");
    };

    const parseToNumber = (str: string): number => {
        if (!str) return 0;
        const cleanStr = str.replace(/\./g, "").replace(/,/g, ".");
        return parseFloat(cleanStr) || 0;
    };

    useEffect(() => {
        const currentNumeric = parseToNumber(displayValue);

        if (value !== currentNumeric) {
            if (!value) {
                setDisplayValue("");
            } else {
                setDisplayValue(
                    value.toLocaleString("id-ID", { maximumFractionDigits: 10 })
                );
            }
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        input = input.replace(/[^0-9,]/g, "");

        const parts = input.split(",");
        if (parts.length > 2) return;

        const integerPart = parts[0];
        const decimalPart = parts[1] ?? "";

        let formattedInteger = "";

        if (integerPart !== "") {
            formattedInteger = formatThousand(integerPart);
        }

        let newDisplayValue = formattedInteger;

        if (input.includes(",")) {
            newDisplayValue += "," + decimalPart;
        }

        setDisplayValue(newDisplayValue);
        onValueChange(parseToNumber(newDisplayValue));
    };

    return (
        <Input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};
const CurrencyDisplay: React.FC<{ title: string; value: number; color?: string }> = ({ title, value, color = 'text-gray-900 dark:text-white' }) => (
    <div className="text-right">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <p className={`text-xl font-semibold ${color}`}>
            Rp {value.toLocaleString('id-ID')}
        </p>
    </div>
);

const GramDisplay: React.FC<{ title: string; value: number; color?: string }> = ({ title, value, color = 'text-gray-900 dark:text-white' }) => (
    <div className="text-right">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <p className={`text-xl font-semibold ${color}`}>
            {value.toLocaleString('id-ID')} Gram
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
    remainingBalance: number;
}> = ({ isOpen, onClose, onConfirm, isSubmitting, totalNominal, paymentCount, remainingBalance }) => {

    const isUnbalanced = remainingBalance !== 0;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-999999 " onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/70 h-full w-full" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">

                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                                    {isUnbalanced ? (
                                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                                    ) : (
                                        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    )}
                                    Konfirmasi Penyimpanan
                                </Dialog.Title>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Anda akan menyimpan Purchase Order ini. Pastikan data sudah benar.
                                    </p>

                                    <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md dark:text-gray-200 border dark:border-gray-600">
                                        <p>Total Tagihan Item: <span className="font-semibold">Rp {totalNominal.toLocaleString('id-ID')}</span></p>
                                        <p>Jumlah Baris Pembayaran: <span className="font-semibold">{paymentCount}</span></p>
                                    </div>

                                    {/* KOTAK WARNING JIKA TIDAK BALANCE */}
                                    {isUnbalanced && (
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md mt-2">
                                            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
                                                Perhatian: Pembayaran Tidak Balance!
                                            </p>
                                            <p className="text-xs text-orange-700 dark:text-orange-400">
                                                Terdapat selisih sebesar <span className="font-bold">Rp {Math.abs(remainingBalance).toLocaleString('id-ID')}</span>
                                                {remainingBalance > 0 ? ' (Kurang Bayar)' : ' (Lebih Bayar)'}.
                                                Apakah Anda yakin ingin tetap melanjutkan?
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={onClose} disabled={isSubmitting}>
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 ${isUnbalanced
                                            ? "bg-orange-500 hover:bg-orange-600"
                                            : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                        onClick={onConfirm}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {isSubmitting ? "Menyimpan..." : (isUnbalanced ? "Tetap Simpan" : "Ya, Simpan")}
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