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
import SelectItemSetorModal, { ISetorItem } from '@/components/modal/SelectItemSetorModal'; 
interface FormState {
    date: string;
    employee_id: number | null;
    supplier_id: number | null;
    notes: string;
    items: ISetorItem[];
}

interface SelectOption { value: string; label: string; }

interface DepositPayload {
    date: string;
    employee_id: number;
    supplier_id: number;
    notes: string;
    items: {
        work_order_item_id: number;
        item_id: number;
        code_item: string;
    }[];
}

export default function CreateDepositPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isItemModalOpen, setIsItemModalOpen] = useState(false); 
    const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        employee_id: null,
        supplier_id: null,
        notes: "",
        items: [],
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [employeeRes, supplierRes] = await Promise.all([
                    httpGet(endpointUrlv2("master/employee/dropdown"), true), 
                    httpGet(endpointUrlv2("master/supplier/dropdown"), true),
                ]);

                setEmployeeOptions(employeeRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));

            } catch (error) {
                toast.error("Gagal memuat data master untuk form.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchInitialData();
    }, []);


    const handleFieldChange = (field: keyof FormState, value: any) => {
        if (field === 'supplier_id' && value !== formData.supplier_id) {
            setFormData(prev => ({
                ...prev,
                items: [], 
                [field]: value
            }));
            if (value) {
                toast.info("Daftar item yang dipilih telah di-reset karena supplier diganti.");
            }
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleAddItems = (selectedItems: ISetorItem[]) => {
        const newItemsToAdd = selectedItems.filter(newItem =>
            !formData.items.some(existingItem =>
                existingItem.work_order_item_id === newItem.work_order_item_id
            )
        );

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, ...newItemsToAdd]
        }));
        setIsItemModalOpen(false); 
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: formData.items.filter((_, i) => i !== index)
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.date || !formData.supplier_id || !formData.employee_id) {
            toast.error("Harap isi Tanggal, Yang Menyerahkan, dan Supplier.");
            return false;
        }
        if (formData.items.length === 0) {
            toast.error("Harap tambahkan minimal satu barang untuk disetor.");
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

        const payload: DepositPayload = {
            date: moment(formData.date).format('YYYY-MM-DD'),
            supplier_id: Number(formData.supplier_id),
            employee_id: Number(formData.employee_id),
            notes: formData.notes,
            items: formData.items.map(item => ({
                work_order_item_id: item.work_order_item_id,
                item_id: item.item_id,
                code_item: item.code_item
            }))
        };

        try {
            await httpPost(endpointUrlv2('/deposit'), payload, true);
            toast.success("Data Setor berhasil dibuat!");
            router.push('/purchasing/deposits');
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

                    <ComponentCard title="Input Data Setor">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">

                                <div>
                                    <label className="block font-medium mb-1">Tanggal Pembayaran<span className="text-red-400 ml-1">*</span></label>
                                    <SingleDatePicker
                                        placeholderText="Pilih tanggal"
                                        selectedDate={formData.date ? new Date(formData.date) : null}
                                        onChange={(date: any) => handleFieldChange('date', moment(date).format('YYYY-MM-DD'))}
                                        onClearFilter={() => handleFieldChange('date', '')}
                                        viewingMonthDate={viewingMonthDate}
                                        onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Yang Menyerahkan<span className="text-red-400 ml-1">*</span></label>
                                    <Select
                                        options={employeeOptions}
                                        value={_.find(employeeOptions, { value: formData.employee_id?.toString() })}
                                        onValueChange={(opt) => handleFieldChange('employee_id', opt ? parseInt(opt.value) : null)}
                                        placeholder="Pilih karyawan..."
                                        disabled={loadingOptions}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Tujuan Pembayaran</label>
                                    <Input
                                        value={formData.notes}
                                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                                        placeholder="Misal: Setor barang..."
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
                        </div>
                    </ComponentCard>

                    <ComponentCard title="Daftar Barang">
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setIsItemModalOpen(true)}
                                disabled={!formData.supplier_id || loadingOptions}
                                className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Barang
                            </button>
                            {!formData.supplier_id && (
                                <p className="text-xs text-red-500 mt-1">Pilih Supplier terlebih dahulu untuk menambah barang.</p>
                            )}
                        </div>

                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Barang</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar (%)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-4 text-center text-gray-500 italic">
                                                Belum ada barang yang ditambahkan.
                                            </td>
                                        </tr>
                                    )}
                                    {formData.items.map((item, index) => (
                                        <tr key={item.work_order_item_id}>
                                            <td className="px-4 py-2 whitespace-nowrap font-medium">{item.jenis_barang}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{item.code_item}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{item.scope.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{item.sg.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{item.xray.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{item.berat.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{item.kadar.toLocaleString('id-ID')}%</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
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
                itemCount={formData.items.length}
            />

            <SelectItemSetorModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onConfirm={handleAddItems}
                supplierId={formData.supplier_id}
                existingItemIds={formData.items.map(item => item.work_order_item_id)}
            />
        </>
    );
}

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    itemCount: number;
}> = ({ isOpen, onClose, onConfirm, isSubmitting, itemCount }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50 " onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 h-full w-full bg-black/30" />
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
                                        Anda akan menyimpan data Setor ini. Pastikan data sudah benar.
                                    </p>
                                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                                        <p>Jumlah Barang: <span className="font-semibold">{itemCount}</span></p>
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