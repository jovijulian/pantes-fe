"use client";

import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from '@/components/form/Select-custom';
import { endpointUrl, httpGet } from '@/../helpers';

interface SelectOption { value: string; label: string; }

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (payload: any) => void;
    isSubmitting: boolean;
}

export default function AddItemModal({ isOpen, onClose, onConfirm, isSubmitting }: AddItemModalProps) {
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [itemId, setItemId] = useState<string | null>(null);
    const [bruto, setBruto] = useState<number | ''>('');
    const [kadar, setKadar] = useState<number | ''>('');

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
            const res = await httpGet(endpointUrl("master/item/dropdown"), true, { type: 3 });
            setItemOptions(res.data.data.map((s: any) => ({ value: s.id.toString(), label: `${s.name_item} (${s.code})`, })));
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data item.");
        } finally {
            setLoadingMaster(false);
        }
    };

    const netto = useMemo(() => {
        if (
            bruto === '' ||
            kadar === '' ||
            isNaN(Number(bruto)) ||
            isNaN(Number(kadar))
        ) {
            return 0;
        }

        return Number(bruto) * (Number(kadar) / 100);
    }, [bruto, kadar]);

    const resetForm = () => {
        setItemId(null);
        setBruto('');
        setKadar('');
    };

    const handleSubmit = () => {
        if (!itemId) {
            toast.error("Item wajib diisi.");
            return;
        }

        const payload = {
            item_id: parseInt(itemId),
            bruto: Number(bruto || 0),
            kadar: Number(kadar || 0),
            netto: Number(netto),
        };

        onConfirm(payload);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                                        Tambah Item Rongsok
                                    </Dialog.Title>
                                    <button onClick={onClose} disabled={isSubmitting}><X className="w-5 h-5 text-gray-400" /></button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Item</label>
                                        <Select
                                            options={itemOptions}
                                            value={itemOptions.find(opt => opt.value === itemId)}
                                            onValueChange={(opt) => setItemId(opt ? opt.value : null)}
                                            placeholder={loadingMaster ? "Memuat..." : "Pilih Barang..."}
                                            disabled={loadingMaster || isSubmitting}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bruto (Gr)</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                value={bruto}
                                                onChange={(e) => setBruto(e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kadar (%)</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                value={kadar}
                                                onChange={(e) => setKadar(e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Netto (Gr)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-gray-50 focus:outline-none cursor-not-allowed text-gray-500"
                                            value={netto}
                                            readOnly
                                            placeholder="0"
                                            disabled={true}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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