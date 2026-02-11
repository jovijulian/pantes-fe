"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import _ from "lodash";
import {
    Loader2, Save, Plus, Trash2, Edit, X, Info,
    Calculator, AlertTriangle
} from "lucide-react";
import { endpointUrl, httpGet, httpPost, httpPut, httpDelete, alertToast } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Select from '@/components/form/Select-custom';
import { Modal } from '@/components/ui/modal';
interface SelectOption { value: string; label: string; }

interface IScrapItemDetail {
    id: number; 
    item_id: number;
    code: string;
    name_item: string;
    bruto: number;
    kadar: number;
    netto: number;
}

interface IScrapGoldData {
    id: number;
    no_scrap_gold: string;
    date: string;
    notes: string;
    staff_id: number;
    details: IScrapItemDetail[];
}

export default function EditScrapGoldPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const [data, setData] = useState<IScrapGoldData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IScrapItemDetail | null>(null);
    const [manageMode, setManageMode] = useState<'add' | 'edit'>('add');
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const res = await httpGet(endpointUrl("master/item/dropdown"), true, { type: 3 });
                setItemOptions(res.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name_item })));
            } catch (err) {
                console.error(err);
            }
        };
        fetchMaster();
    }, []);

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/scrap-gold/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            toast.error("Gagal mengambil data.");
            router.push('/purchase/scrap-gold');
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    const handleAddItem = async (payload: any) => {
        setIsSubmitting(true);
        try {
            const apiPayload = {
                items: [
                    {
                        item_id: payload.item_id,
                        bruto: payload.bruto,
                        kadar: payload.kadar,
                        netto: payload.netto
                    }
                ]
            };
            
            await httpPost(endpointUrl(`purchase/scrap-gold/${id}/items`), apiPayload, true);
            toast.success("Item berhasil ditambahkan!");
            setIsManageModalOpen(false);
            getDetail(); 
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateItem = async (payload: any) => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            const apiPayload = {
                scrap_gold_detail_id: selectedItem.id,
                bruto: payload.bruto,
                kadar: payload.kadar,
                netto: payload.netto
            };

            await httpPost(endpointUrl(`purchase/scrap-gold/${id}/update-item`), apiPayload, true);
            toast.success("Item berhasil diperbarui!");
            setIsManageModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            const apiPayload = {
                scrap_gold_detail_id: selectedItem.id
            };

            await httpPost(endpointUrl(`purchase/scrap-gold/${id}/delete-item`), apiPayload, true);
            toast.success("Item berhasil dihapus!");
            setIsDeleteModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openAddModal = () => {
        setManageMode('add');
        setSelectedItem(null);
        setIsManageModalOpen(true);
    };

    const openEditModal = (item: IScrapItemDetail) => {
        setManageMode('edit');
        setSelectedItem(item);
        setIsManageModalOpen(true);
    };

    const openDeleteModal = (item: IScrapItemDetail) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const formatGram = (val: number) => val.toLocaleString('id-ID', { maximumFractionDigits: 2 });

    if (isLoading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
    if (!data) return null;

    return (
        <>
            <div className="flex flex-col gap-6 mt-4">
                <ComponentCard title="Edit Transaksi Rongsok">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm text-gray-500">No. Dokumen</label>
                            <p className="font-bold text-lg">{data.no_scrap_gold}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Tanggal</label>
                            <p className="font-medium">{moment(data.date).format('DD MMMM YYYY')}</p>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm text-gray-500">Keterangan</label>
                             <p className="text-gray-700 italic">{data.notes || "-"}</p>
                        </div>
                    </div>
                </ComponentCard>

                <ComponentCard title="Daftar Barang">
                    <div className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Barang
                        </button>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto (Gr)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar (%)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto (Gr)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.details.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-400 italic">
                                            Tidak ada barang.
                                        </td>
                                    </tr>
                                )}
                                {data.details.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.name_item}</div>
                                            <div className="text-xs text-gray-500">{item.code}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{formatGram(Number(item.bruto))}</td>
                                        <td className="px-4 py-3 text-right font-mono text-blue-600">{formatGram(Number(item.kadar))}%</td>
                                        <td className="px-4 py-3 text-right font-bold font-mono">{formatGram(Number(item.netto))}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center items-center gap-2">
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit Item"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(item)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hapus Item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-semibold">
                                <tr>
                                    <td className="px-4 py-3 text-right">Total</td>
                                    <td className="px-4 py-3 text-right">
                                        {formatGram(_.sumBy(data.details, d => Number(d.bruto)))}
                                    </td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right text-blue-700">
                                        {formatGram(_.sumBy(data.details, d => Number(d.netto)))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </ComponentCard>
                
                <div className="flex justify-start">
                     <button
                        type="button"
                        onClick={() => router.push('/purchase/scrap-gold')}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        Kembali
                    </button>
                </div>
            </div>

            <ManageItemModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                onConfirm={manageMode === 'add' ? handleAddItem : handleUpdateItem}
                isSubmitting={isSubmitting}
                mode={manageMode}
                initialData={selectedItem}
                itemOptions={itemOptions}
            />

            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteItem}
                isSubmitting={isSubmitting}
                itemName={selectedItem?.name_item || ''}
            />
        </>
    );
}


const ManageItemModal = ({
    isOpen, onClose, onConfirm, isSubmitting, mode, initialData, itemOptions
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (payload: any) => void,
    isSubmitting: boolean,
    mode: 'add' | 'edit',
    initialData: IScrapItemDetail | null,
    itemOptions: SelectOption[]
}) => {
    const [itemId, setItemId] = useState<string | null>(null);
    const [bruto, setBruto] = useState<number | ''>('');
    const [kadar, setKadar] = useState<number | ''>('');
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setItemId(initialData.item_id.toString());
                setBruto(Number(initialData.bruto));
                setKadar(Number(initialData.kadar));
            } else {
                setItemId(null);
                setBruto('');
                setKadar('');
            }
        }
    }, [isOpen, mode, initialData]);

    const netto = (typeof bruto === 'number' && typeof kadar === 'number') 
        ? (bruto * (kadar / 100)) : 0;

    const handleSubmit = () => {
        if (mode === 'add' && !itemId) {
            toast.error("Pilih jenis barang.");
            return;
        }
        if (!bruto || !kadar) {
            toast.error("Bruto dan Kadar harus diisi.");
            return;
        }

        onConfirm({
            item_id: itemId ? parseInt(itemId) : 0,
            bruto: Number(bruto),
            kadar: Number(kadar),
            netto: netto
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                        {mode === 'add' ? 'Tambah Barang' : 'Edit Barang'}
                    </h3>
                    <button onClick={onClose} disabled={isSubmitting}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Barang</label>
                        <Select
                            options={itemOptions}
                            value={itemOptions.find(opt => opt.value === itemId)}
                            onValueChange={(opt) => setItemId(opt ? opt.value : null)}
                            placeholder="Pilih Barang..."
                            disabled={isSubmitting || mode === 'edit'} 
                        />
                         {mode === 'edit' && <p className="text-xs text-gray-400 mt-1">*Jenis barang tidak dapat diubah saat edit</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bruto (Gr)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                value={bruto}
                                onChange={(e) => setBruto(e.target.valueAsNumber)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kadar (%)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                value={kadar}
                                onChange={(e) => setKadar(e.target.valueAsNumber)}
                                placeholder="0"
                                max={100}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-700 uppercase">Netto</span>
                        <div className="flex items-center gap-2">
                             <span className="text-lg font-bold text-gray-800">{netto.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Batal</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Simpan
                    </button>
                </div>
            </div>
        </Modal>
    );
};


const DeleteConfirmationModal = ({
    isOpen, onClose, onConfirm, isSubmitting, itemName
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isSubmitting: boolean,
    itemName: string
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus <b>{itemName}</b> dari daftar? Tindakan ini tidak dapat dibatalkan.
                </p>
                
                <div className="flex justify-center gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Batal</button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Hapus
                    </button>
                </div>
            </div>
        </Modal>
    );
}