"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calculator, Plus, Loader2, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from '@/components/form/Select-custom'; 
import { endpointUrl, httpGet } from '@/../helpers';

export interface IStockItem {
    id: number;
    code: string;
    name_item: string;
    stock: {
        item_id: string | number;
        bruto: number;
        netto: number;
    };
}

export interface ISendItem {
    temp_id: string;
    item_id: number;
    item_label: string;
    bruto: number;
    kadar: number;
    netto: number;
}

interface AddSendItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: ISendItem) => void;
}

export default function AddSendItemModal({ isOpen, onClose, onConfirm }: AddSendItemModalProps) {
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [stockOptions, setStockOptions] = useState<any[]>([]);
    const [rawStockData, setRawStockData] = useState<IStockItem[]>([]);

    const [selectedItemOption, setSelectedItemOption] = useState<any | null>(null);
    const [selectedStockDetail, setSelectedStockDetail] = useState<IStockItem | null>(null);

    const [bruto, setBruto] = useState<number | ''>('');
    const [kadar, setKadar] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen) {
            fetchStock();
            resetForm();
        }
    }, [isOpen]);

    const fetchStock = async () => {
        setIsLoadingStock(true);
        try {
            const res = await httpGet(endpointUrl("purchase/scrap-gold/send/stock"), true);
            const items = res.data.data.items || [];
            setRawStockData(items);
            setStockOptions(items.map((item: IStockItem) => ({
                value: item.id.toString(),
                label: `${item.code} - ${item.name_item}`
            })));
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data stok rongsok.");
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleItemChange = (opt: any) => {
        setSelectedItemOption(opt);
        if (opt) {
            const found = rawStockData.find(x => x.id.toString() === opt.value);
            setSelectedStockDetail(found || null);
            if (found && found.stock) {
                setBruto(found.stock.bruto);
               
            } else {
                setBruto('');
                setKadar('');
            }
        } else {
            setSelectedStockDetail(null);
            setBruto('');
            setKadar('');
        }
    };

    const netto = (typeof bruto === 'number' && typeof kadar === 'number')
        ? (bruto * (kadar / 100))
        : 0;

    const resetForm = () => {
        setSelectedItemOption(null);
        setSelectedStockDetail(null);
        setBruto('');
        setKadar('');
    };

    const handleSubmit = () => {
        if (!selectedItemOption || bruto === '' || kadar === '') {
            toast.error("Mohon lengkapi semua field (Item, Bruto, Kadar).");
            return;
        }

        if (selectedStockDetail && (Number(bruto) > selectedStockDetail.stock.bruto)) {
            toast.warn("Peringatan: Jumlah kirim melebihi stok bruto yang tersedia.");
        }

        const newItem: ISendItem = {
            temp_id: Math.random().toString(36).substr(2, 9),
            item_id: parseInt(selectedItemOption.value),
            item_label: selectedItemOption.label,
            bruto: Number(bruto),
            kadar: Number(kadar),
            netto: netto
        };

        onConfirm(newItem);
        resetForm();
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center justify-between border-b pb-3 mb-4">
                                    <span>Pilih Barang Kirim</span>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Barang (Stok)</label>
                                        <Select
                                            options={stockOptions}
                                            value={selectedItemOption}
                                            onValueChange={handleItemChange}
                                            placeholder={isLoadingStock ? "Memuat stok..." : "Pilih Barang..."}
                                            disabled={isLoadingStock}
                                        />
                                    </div>

                                    {selectedStockDetail && (
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Package className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-yellow-700 uppercase">Stok Tersedia</p>
                                                <div className="flex gap-4 text-sm text-gray-700 mt-1">
                                                    <span>Bruto: <b>{selectedStockDetail.stock.bruto.toLocaleString('id-ID')}</b> Gr</span>
                                                    <span>Netto: <b>{selectedStockDetail.stock.netto.toLocaleString('id-ID')}</b> Gr</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kirim Bruto (Gr)</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="0"
                                                value={bruto} 
                                                onChange={(e) => setBruto(e.target.valueAsNumber)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kadar (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-all pr-8"
                                                    placeholder="0"
                                                    value={kadar}
                                                    onChange={(e) => setKadar(e.target.valueAsNumber)}
                                                    max={100}
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Netto</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-gray-800">
                                                {netto.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-gray-500">Gram</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none shadow-md flex items-center gap-2"
                                        onClick={handleSubmit}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah ke List
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