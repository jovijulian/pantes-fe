"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";
import { Plus, Trash2, Save, X, Loader2 } from 'lucide-react';

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import AddRefiningSendModal, {
    IRefiningSendItem,
    getSendPurposeLabel,
    sumSendDetail,
} from '@/components/modal/scrap-gold/AddRefiningSendModal';
import ConfirmationModal from '@/components/modal/scrap-gold/ConfirmationModal';

interface SelectOption { value: string; label: string; }

interface FormState {
    date: string;
    type_purpose: number | null;
    purpose_id: number | null;
    expedition_id: number | null;
    notes: string;
    items: IRefiningSendItem[];
}

const TYPE_PURPOSE_OPTIONS = [
    { value: '1', label: 'Gudang CT' },
    { value: '2', label: 'Supplier' },
    { value: '3', label: 'Vendor / Pabrik' },
];

export default function RefiningCreatePage() {
    const router = useRouter();
    const [loadingMaster, setLoadingMaster] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [expeditionOptions, setExpeditionOptions] = useState<SelectOption[]>([]);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [vendorOptions, setVendorOptions] = useState<SelectOption[]>([]);
    const [purposeOptions, setPurposeOptions] = useState<SelectOption[]>([]);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [formData, setFormData] = useState<FormState>({
        date: moment().format('YYYY-MM-DD'),
        type_purpose: null,
        purpose_id: 0,
        expedition_id: null,
        notes: "",
        items: [],
    });

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [expRes, supRes, vendRes] = await Promise.all([
                    httpGet(endpointUrl("master/expedition/dropdown"), true),
                    httpGet(endpointUrl("master/supplier/dropdown"), true),
                    httpGet(endpointUrl("master/vendor/dropdown"), true),
                ]);

                setExpeditionOptions(expRes.data.data.map((x: any) => ({ value: x.id.toString(), label: x.name })));
                setSupplierOptions(supRes.data.data.map((x: any) => ({ value: x.id.toString(), label: x.name })));
                setVendorOptions(vendRes.data.data.map((x: any) => ({ value: x.id.toString(), label: x.name })));

            } catch (error) {
                console.error(error);
                toast.error("Gagal memuat data master.");
            } finally {
                setLoadingMaster(false);
            }
        };
        fetchMasters();
    }, []);

    useEffect(() => {
        let newOptions: SelectOption[] = [];
        let newPurposeId: number | null = null;

        if (formData.type_purpose === 1) {
            newOptions = [];
            newPurposeId = 0;
        } else if (formData.type_purpose === 2) {
            newOptions = supplierOptions;
            newPurposeId = null;
        } else if (formData.type_purpose === 3) {
            newOptions = vendorOptions;
            newPurposeId = null;
        }

        setPurposeOptions(newOptions);
        setFormData(prev => ({
            ...prev,
            purpose_id: newPurposeId
        }));

    }, [formData.type_purpose, supplierOptions, vendorOptions]);


    const handleFieldChange = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItems = (newItems: IRefiningSendItem[]) => {
        setFormData(prev => {
            const existingIds = new Set(prev.items.map(item => item.id));
            const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
            return {
                ...prev,
                items: [...prev.items, ...uniqueNew]
            };
        });
        setIsItemModalOpen(false);
    };

    const removeItem = (id: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.date) { toast.error("Tanggal wajib diisi"); return false; }
        if (!formData.type_purpose) { toast.error("Tujuan Kirim wajib dipilih"); return false; }

        if (formData.type_purpose !== 1 && !formData.purpose_id) {
            toast.error("Silakan pilih Supplier/Vendor tujuan.");
            return false;
        }

        if (!formData.expedition_id) { toast.error("Ekspedisi wajib dipilih"); return false; }
        if (formData.items.length === 0) { toast.error("Belum ada data pengiriman rongsok yang dipilih."); return false; }

        return true;
    };

    const handleTypeChange = (selectedOption: SelectOption | null) => {
        const newType = selectedOption ? parseInt(selectedOption.value) : null;
        let newOptions: SelectOption[] = [];
        if (newType === 2) newOptions = supplierOptions;
        else if (newType === 3) newOptions = vendorOptions;

        setPurposeOptions(newOptions);

        setFormData(prev => ({
            ...prev,
            type_purpose: newType,
            purpose_id: null
        }));
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
        const payload = {
            date: moment(formData.date).format('YYYY-MM-DD'),
            type_purpose: formData.type_purpose,
            purpose_id: formData.type_purpose === 1 ? 0 : Number(formData.purpose_id),
            expedition_id: Number(formData.expedition_id),
            notes: formData.notes,
            scrap_gold_send: formData.items.map(item => ({
                scrap_gold_send_id: item.id,
            })),
        };

        try {
            await httpPost(endpointUrl('purchase/scrap-gold/refining'), payload, true);
            toast.success("Surat Jalan Refining berhasil disimpan!");
            router.push('/purchasing/scrap-golds/refining');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                <ComponentCard title="Surat Jalan Refining">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Tanggal Kirim<span className="text-red-400 ml-1">*</span></label>
                                <SingleDatePicker
                                    placeholderText="Pilih tanggal"
                                    selectedDate={formData.date ? new Date(formData.date) : null}
                                    onChange={(date: any) => handleFieldChange('date', moment(date).format('YYYY-MM-DD'))}
                                    onClearFilter={() => null}
                                    viewingMonthDate={viewingMonthDate}
                                    onMonthChange={setViewingMonthDate}
                                    disabled
                                />
                                {/* <Input type="text" value={moment(new Date(formData.date)).format("YYYY-MM-DD")} onChange={(date: any) => handleFieldChange('date', moment(date).format('YYYY-MM-DD'))} disabled /> */}
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Ekspedisi<span className="text-red-400 ml-1">*</span></label>
                                <Select
                                    options={expeditionOptions}
                                    value={_.find(expeditionOptions, { value: formData.expedition_id?.toString() })}
                                    onValueChange={(opt) => handleFieldChange('expedition_id', opt ? parseInt(opt.value) : null)}
                                    placeholder="Pilih Ekspedisi..."
                                    disabled={loadingMaster}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Tujuan Kirim ke<span className="text-red-400 ml-1">*</span></label>
                                <Select
                                    options={TYPE_PURPOSE_OPTIONS}
                                    value={_.find(TYPE_PURPOSE_OPTIONS, { value: formData.type_purpose?.toString() })}
                                    placeholder="Pilih Tujuan..."
                                    onValueChange={handleTypeChange}
                                />
                            </div>

                            {formData.type_purpose && formData.type_purpose !== 1 && (
                                <div>
                                    <label className="block font-medium mb-1">
                                        {formData.type_purpose === 2 ? 'Pilih Supplier' : 'Pilih Vendor/Pabrik'}
                                        <span className="text-red-400 ml-1">*</span>
                                    </label>
                                    <Select
                                        key={formData.type_purpose}
                                        options={purposeOptions}
                                        value={formData.purpose_id ? _.find(purposeOptions, { value: formData.purpose_id.toString() }) : null}
                                        onValueChange={(opt) => handleFieldChange('purpose_id', opt ? parseInt(opt.value) : null)}
                                        placeholder={formData.type_purpose === 2 ? 'Cari Supplier...' : 'Cari Vendor...'}
                                        disabled={loadingMaster}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block font-medium mb-1">Keterangan / Notes</label>
                                <textarea
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all resize-none"
                                    value={formData.notes}
                                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                                    placeholder="No. Resi atau keterangan lain..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </ComponentCard>

                <ComponentCard title="Daftar Data Kirim Rongsok">
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setIsItemModalOpen(true)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Pilih Data Kirim Rongsok
                        </button>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Pengiriman</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan & Ekspedisi</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Barang</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bruto (Gr)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto (Gr)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                                            Belum ada data pengiriman rongsok yang dipilih.
                                        </td>
                                    </tr>
                                )}
                                {formData.items.map((item) => {
                                    const totalBruto = sumSendDetail(item.details, 'bruto');
                                    const totalNetto = sumSendDetail(item.details, 'netto');
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 align-top">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-semibold text-gray-800">{item.no_scrap_gold_send}</div>
                                                <div className="text-xs text-gray-500">
                                                    {item.date ? moment(item.date).format('DD MMM YYYY') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-medium text-gray-800">{getSendPurposeLabel(item)}</div>
                                                <div className="text-xs text-gray-500">{item.expedition?.name || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.details && item.details.length > 0 ? (
                                                    <ul className="space-y-1 text-xs text-gray-700">
                                                        {item.details.map((detail) => (
                                                            <li key={detail.id} className="whitespace-nowrap">
                                                                <span className="font-medium text-gray-800">
                                                                    {detail.code} - {detail.name_item}
                                                                </span>{' '}
                                                                <span className="text-gray-500">
                                                                    (Bruto: {Number(detail.bruto).toLocaleString('id-ID')} Gr,{' '}
                                                                </span>
                                                                <span className="text-blue-600 font-medium">
                                                                    Kadar: {Number(detail.kadar).toLocaleString('id-ID')}%
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    , Netto: {Number(detail.netto).toLocaleString('id-ID')} Gr)
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                {totalBruto.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-bold">
                                                {totalNetto.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {formData.items.length > 0 && (
                                <tfoot className="bg-gray-50 font-semibold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                                        <td className="px-4 py-3 text-right">
                                            {_.sumBy(formData.items, (item) => sumSendDetail(item.details, 'bruto')).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {_.sumBy(formData.items, (item) => sumSendDetail(item.details, 'netto')).toLocaleString('id-ID')}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </ComponentCard>

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
                        disabled={isSubmitting || loadingMaster}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? "Menyimpan..." : "Simpan Refining"}
                    </button>
                </div>
            </form>

            <AddRefiningSendModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onConfirm={handleAddItems}
                selectedSendIds={formData.items.map(item => item.id)}
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