"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";
import { Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { endpointUrl, httpGet, httpPost, alertToast, endpointUrlv2 } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import AddScrapItemModal, { IScrapItem, SelectOption } from '@/components/modal/scrap-gold/AddScrapItemModal';
import ConfirmationModal from '@/components/modal/scrap-gold/ConfirmationModal';

interface FormState {
    date: string;
    staff_id: number | null;
    notes: string;
    items: IScrapItem[];
}

interface ScrapGoldPayload {
    staff_id: number;
    date: string;
    notes: string;
    items: {
        item_id: number;
        bruto: number;
        kadar: number;
        netto: number;
    }[];
}

export default function CreateScrapGoldPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [staffOptions, setStaffOptions] = useState<SelectOption[]>([]);
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        staff_id: null,
        notes: "",
        items: [],
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [staffRes, itemRes] = await Promise.all([
                    httpGet(endpointUrl("master/staff/dropdown"), true),
                    httpGet(endpointUrl("master/item/dropdown"), true, { type: 3 }),
                ]);

                setStaffOptions(staffRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setItemOptions(itemRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name_item })));

            } catch (error) {
                console.error(error);
                toast.error("Gagal memuat data master.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = (newItem: IScrapItem) => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
        setIsItemModalOpen(false);
    };

    const removeItem = (temp_id: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.temp_id !== temp_id)
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.date || !formData.staff_id) {
            toast.error("Harap isi Tanggal dan Sumber (Staff).");
            return false;
        }
        if (formData.items.length === 0) {
            toast.error("Harap tambahkan minimal satu item rongsok.");
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsConfirmOpen(true);
        }
    };

    const handleConfirmSubmit = async () => {
        setIsConfirmOpen(false);
        setIsSubmitting(true);

        const payload: ScrapGoldPayload = {
            staff_id: Number(formData.staff_id),
            date: moment(formData.date).format('YYYY-MM-DD'),
            notes: formData.notes,
            items: formData.items.map(item => ({
                item_id: item.item_id,
                bruto: item.bruto,
                kadar: item.kadar,
                netto: item.netto
            }))
        };

        try {
            await httpPost(endpointUrl('purchase/scrap-gold'), payload, true);
            toast.success("Data Pembelian Rongsok berhasil disimpan!");
            router.push('/purchasing/scrap-golds');
        } catch (error: any) {
            console.error(error);
           toast.error("Gagal menyimpan data. " + (error?.response?.data?.message || ""));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                <div className="w-full flex flex-col gap-6">
                    <ComponentCard title="Input Rongsok">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Tanggal Proses<span className="text-red-400 ml-1">*</span></label>
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
                                    <label className="block font-medium mb-1">Sumber<span className="text-red-400 ml-1">*</span></label>
                                    <Select
                                        options={staffOptions}
                                        value={_.find(staffOptions, { value: formData.staff_id?.toString() })}
                                        onValueChange={(opt) => handleFieldChange('staff_id', opt ? parseInt(opt.value) : null)}
                                        placeholder="Pilih Sumber..."
                                        disabled={loadingOptions}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Keterangan / Notes</label>
                                    <textarea
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all resize-none"
                                        value={formData.notes}
                                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                                        placeholder="Input keterangan..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    </ComponentCard>

                    <ComponentCard title="Daftar Barang Rongsok">
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setIsItemModalOpen(true)}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Barang
                            </button>
                        </div>

                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Barang</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bruto (Gr)</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kadar (%)</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto (Gr)</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                                                Belum ada barang rongsok yang ditambahkan.
                                            </td>
                                        </tr>
                                    )}
                                    {formData.items.map((item) => (
                                        <tr key={item.temp_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">{item.item_label}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{item.bruto.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-blue-600 font-medium">{item.kadar.toLocaleString('id-ID')}%</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-bold">{item.netto.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.temp_id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {formData.items.length > 0 && (
                                    <tfoot className="bg-gray-50 font-semibold">
                                        <tr>
                                            <td className="px-4 py-3 text-right">Total</td>
                                            <td className="px-4 py-3 text-right">
                                                {_.sumBy(formData.items, 'bruto').toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3 text-right">
                                                {_.sumBy(formData.items, 'netto').toLocaleString('id-ID')}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </ComponentCard>
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t mt-4">
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? "Menyimpan..." : "Save Transaction"}
                    </button>
                </div>
            </form>

            <AddScrapItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onConfirm={handleAddItem}
                itemOptions={itemOptions}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                itemCount={formData.items.length}
            />
        </>
    );
}