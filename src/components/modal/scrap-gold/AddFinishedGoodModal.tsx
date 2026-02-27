"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from '@/components/form/Select-custom';
import { endpointUrl, httpGet } from '@/../helpers';

interface SelectOption { value: string; label: string; }

interface AddFinishedGoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: any) => void;
    isSubmitting: boolean;
}

interface ItemRow {
    id: string;
    itemId: string | null;
    netto: number | '';
    sg: number | '';
    scope: number | '';
    xray: number | '';
}

export default function AddFinishedGoodModal({ isOpen, onClose, onConfirm, isSubmitting }: AddFinishedGoodModalProps) {
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [rows, setRows] = useState<ItemRow[]>([]);

    useEffect(() => {
        if (isOpen && itemOptions.length === 0) {
            fetchMasterItems();
        }
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const fetchMasterItems = async () => {
        setLoadingMaster(true);
        try {
            const res = await httpGet(endpointUrl("master/item/dropdown"), true);
            setItemOptions(res.data.data.map((s: any) => ({ value: s.id.toString(), label: `${s.name_item} (${s.code})` })));
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data item.");
        } finally {
            setLoadingMaster(false);
        }
    };

    const resetForm = () => {
        setRows([{
            id: Math.random().toString(36).substr(2, 9),
            itemId: null,
            netto: '',
            sg: '',
            scope: '',
            xray: ''
        }]);
    };

    const addRow = () => {
        setRows([...rows, {
            id: Math.random().toString(36).substr(2, 9),
            itemId: null,
            netto: '',
            sg: '',
            scope: '',
            xray: ''
        }]);
    };

    const removeRow = (idToRemove: string) => {
        if (rows.length === 1) {
            toast.warn("Minimal harus ada satu item.");
            return;
        }
        setRows(rows.filter(row => row.id !== idToRemove));
    };

    const updateRow = (id: string, field: keyof ItemRow, value: any) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleSubmit = () => {
        const hasError = rows.some(row => !row.itemId || row.netto === '');

        if (hasError) {
            toast.error("Mohon lengkapi Jenis Barang dan Netto di semua baris.");
            return;
        }

        const payload = {
            items: rows.map(row => ({
                item_id: parseInt(row.itemId as string),
                netto: Number(row.netto),
                sg: Number(row.sg || 0),
                scope: Number(row.scope || 0),
                xray: Number(row.xray || 0)
            }))
        };

        onConfirm(payload);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                                        Tambah Hasil Produksi
                                    </Dialog.Title>
                                    <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                    {rows.map((row, index) => (
                                        <div key={row.id} className="relative p-4 rounded-xl border border-gray-200 bg-gray-50 group">
                                            {/* Tombol Hapus Baris */}
                                            {rows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(row.id)}
                                                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                    title="Hapus baris"
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}

                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">Item #{index + 1}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Barang Jadi <span className="text-red-500">*</span></label>
                                                    <Select
                                                        options={itemOptions}
                                                        value={itemOptions.find(opt => opt.value === row.itemId)}
                                                        onValueChange={(opt) => updateRow(row.id, 'itemId', opt ? opt.value : null)}
                                                        placeholder={loadingMaster ? "Memuat..." : "Pilih Barang..."}
                                                        disabled={loadingMaster || isSubmitting}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Netto (Gr) <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                                                        value={row.netto}
                                                        onChange={(e) => updateRow(row.id, 'netto', e.target.value === '' ? '' : e.target.valueAsNumber)}
                                                        placeholder="0"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">SG</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white"
                                                        value={row.sg}
                                                        onChange={(e) => updateRow(row.id, 'sg', e.target.value === '' ? '' : e.target.valueAsNumber)}
                                                        placeholder="0"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Scope</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white"
                                                        value={row.scope}
                                                        onChange={(e) => updateRow(row.id, 'scope', e.target.value === '' ? '' : e.target.valueAsNumber)}
                                                        placeholder="0"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">X-Ray</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white"
                                                        value={row.xray}
                                                        onChange={(e) => updateRow(row.id, 'xray', e.target.value === '' ? '' : e.target.valueAsNumber)}
                                                        placeholder="0"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Baris Item
                                    </button>
                                </div>

                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        Simpan
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}