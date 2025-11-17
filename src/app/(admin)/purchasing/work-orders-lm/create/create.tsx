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
import SelectPOModal, { PurchaseOrderForTable } from '@/components/modal/SelectPOModal'; 


interface FormState {
    date: string;
    supplier_id: number | null;
    expedition_id: number | null;
    purchase_orders: PurchaseOrderForTable[];
}

interface SelectOption { value: string; label: string; }

interface WorkOrderPayload {
    type: number;
    date: string;
    expedition_id: number;
    supplier_id: number;
    total_weight: number;
    nominal: number;
    purchase_order: { purchase_order_id: number }[];
}

export default function CreateWorkOrderPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);

    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [expeditionOptions, setExpeditionOptions] = useState<SelectOption[]>([]);

    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        supplier_id: null,
        expedition_id: null,
        purchase_orders: [],
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [supplierRes, expeditionRes] = await Promise.all([
                    httpGet(endpointUrl("master/supplier/dropdown"), true),
                    httpGet(endpointUrl("master/expedition/dropdown"), true),
                ]);

                setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setExpeditionOptions(expeditionRes.data.data.map((e: any) => ({ value: e.id.toString(), label: e.name })));

            } catch (error) {
                toast.error("Gagal memuat data master untuk form.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchInitialData();
    }, []);

    const { total_weight, nominal, total_cokim } = useMemo(() => {
        const totalWeight = formData.purchase_orders.reduce((acc, po) => {
            return acc + (Number(po.berat) || 0);
        }, 0);
        const totalNominal = formData.purchase_orders.reduce((acc, po) => {
            return acc + (Number(po.nominal) || 0);
        }, 0);
        const totalCokim = formData.purchase_orders.reduce((acc, po) => {
            return acc + (Number(po.cokim) || 0);
        }, 0);
        return { total_weight: totalWeight, nominal: totalNominal, total_cokim: totalCokim };
    }, [formData.purchase_orders]);



    const handleFieldChange = (field: keyof FormState, value: any) => {
        if (field === 'supplier_id' && value !== formData.supplier_id) {
            setFormData(prev => ({
                ...prev,
                purchase_orders: [],
                [field]: value
            }));
            if (value) {
                toast.info("Daftar PO yang dipilih telah di-reset karena supplier diganti.");
            }
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleAddPOs = (selectedPOs: PurchaseOrderForTable[]) => {
        const newPOsToAdd = selectedPOs.filter(newPO =>
            !formData.purchase_orders.some(existingPO =>
                existingPO.purchase_order_id === newPO.purchase_order_id
            )
        );

        setFormData(prev => ({
            ...prev,
            purchase_orders: [...prev.purchase_orders, ...newPOsToAdd]
        }));
        setIsPOModalOpen(false);
    };

    const removePO = (index: number) => {
        setFormData(prev => ({
            ...prev,
            purchase_orders: formData.purchase_orders.filter((_, i) => i !== index)
        }));
    };


    const validateForm = (): boolean => {
        if (!formData.date || !formData.supplier_id || !formData.expedition_id) {
            toast.error("Harap isi Tanggal, Supplier, dan Ekspedisi.");
            return false;
        }
        if (formData.purchase_orders.length === 0) {
            toast.error("Harap tambahkan minimal satu Purchase Order ke dalam Surat Jalan.");
            return false;
        }
        if (total_weight <= 0 || nominal <= 0) {
            toast.error("Total Berat dan Nominal tidak boleh nol.");
            return false;
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

        const payload: WorkOrderPayload = {
            type: 2,
            date: moment(formData.date).format('YYYY-MM-DD'),
            supplier_id: Number(formData.supplier_id),
            expedition_id: Number(formData.expedition_id),
            total_weight: total_weight,
            nominal: nominal,
            purchase_order: formData.purchase_orders.map(po => ({
                purchase_order_id: po.purchase_order_id
            }))
        };

        try {
            await httpPost(endpointUrl('/work-order'), payload, true);
            toast.success("Surat Jalan (SJ) berhasil dibuat!");
            router.push('/purchasing/work-orders-lm');
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

                    <ComponentCard title="Informasi Surat Jalan LM">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-2">

                            <div className="space-y-4 md:col-span-12">
                                <div>
                                    <label className="block font-medium mb-1">Tanggal Surat Jalan<span className="text-red-400 ml-1">*</span></label>
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
                            <div className="space-y-4 md:col-span-6">
                                <div>
                                    <label className="block font-medium mb-1">Ekspedisi<span className="text-red-400 ml-1">*</span></label>
                                    <Select
                                        options={expeditionOptions}
                                        value={_.find(expeditionOptions, { value: formData.expedition_id?.toString() })}
                                        onValueChange={(opt) => handleFieldChange('expedition_id', opt ? parseInt(opt.value) : null)}
                                        placeholder="Pilih ekspedisi..."
                                        disabled={loadingOptions}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 md:col-span-6">
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
                        </div>
                    </ComponentCard>

                    <ComponentCard title="Pembelian (Purchase Order)">
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setIsPOModalOpen(true)}
                                disabled={!formData.supplier_id || loadingOptions}
                                className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah PO
                            </button>
                            {!formData.supplier_id && (
                                <p className="text-xs text-red-500 mt-1">Pilih Supplier terlebih dahulu untuk menambah PO.</p>
                            )}
                        </div>

                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pesanan (PO)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pesan</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemesan</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cokim</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.purchase_orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-4 text-center text-gray-500 italic">
                                                Belum ada Purchase Order yang ditambahkan.
                                            </td>
                                        </tr>
                                    )}
                                    {formData.purchase_orders.map((po, index) => (
                                        <tr key={po.purchase_order_id}>
                                            <td className="px-4 py-2 whitespace-nowrap font-medium">{po.no_order}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{moment(po.tgl_pesan).format('DD MMM YYYY')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{po.pemesan}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{po.cokim.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{po.berat}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{po.nominal.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => removePO(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-semibold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Total</td>
                                        <td className="px-4 py-3 text-right text-gray-900">{total_cokim.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">{total_weight} Gram</td>
                                        <td className="px-4 py-3 text-right text-gray-900">Rp {nominal.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
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
                        disabled={isSubmitting || loadingOptions}
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
                totalNominal={nominal}
                paymentCount={formData.purchase_orders.length}
            />

            <SelectPOModal
                isOpen={isPOModalOpen}
                onClose={() => setIsPOModalOpen(false)}
                onConfirm={handleAddPOs}
                supplierId={formData.supplier_id}
                existingPOIds={formData.purchase_orders.map(po => po.purchase_order_id)}
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
                    <div className="fixed inset-0 h-full w-full " />
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
                                        Anda akan menyimpan Surat Jalan ini. Pastikan data sudah benar.
                                    </p>
                                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                                        <p>Total Nominal: <span className="font-semibold">Rp {totalNominal.toLocaleString('id-ID')}</span></p>
                                        <p>Jumlah PO: <span className="font-semibold">{paymentCount}</span></p>
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