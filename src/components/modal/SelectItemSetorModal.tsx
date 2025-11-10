"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrl, endpointUrlv2, httpGet } from '@/../helpers'; 
import Input from '@/components/form/input/InputField'; 
import { Loader2, Plus, Search } from 'lucide-react';
import moment from 'moment';
export interface ISetorItem {
    work_order_item_id: number;
    item_id: number;
    code_item: string;
    jenis_barang: string;
    scope: number;       
    sg: number;          
    xray: number;        
    berat: number;       
    kadar: number;       
}

interface SelectItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedItems: ISetorItem[]) => void;
    supplierId: number | null;
    existingItemIds: number[]; 
}

const SelectItemSetorModal: React.FC<SelectItemModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    supplierId, 
    existingItemIds 
}) => {
    
    const [availableItems, setAvailableItems] = useState<ISetorItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<ISetorItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const fetchAvailableItems = async () => {
        if (!supplierId) return; 
        
        setIsLoading(true);
        try {
            const res = await httpGet(endpointUrl(`/deposit/item-by-supplier/${supplierId}`), true, {
                search: searchTerm,
            });
            
            const mappedItems: ISetorItem[] = res.data.data.map((item: any) => ({
                work_order_item_id: item.id,
                item_id: item.item_id,
                code_item: item.code_item || `CODE-${item.id}`, 
                jenis_barang: item.item_type || item.item?.name || 'N/A', 
                scope: Number(item.scope) || 0,
                sg: Number(item.sg) || 0,
                xray: Number(item.xray) || 0,
                berat: Number(item.pcs) || 0, 
                kadar: Number(item.kadar) || 0,
            }));

            setAvailableItems(mappedItems);

        } catch (error: any) {
            toast.error("Gagal memuat data item.");
            alertToast(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            fetchAvailableItems();
        } else {
            setAvailableItems([]);
            setSelectedItems([]);
            setSearchTerm("");
        }
    }, [isOpen, supplierId]); 

    const handleSelectItem = (item: ISetorItem, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, item]);
        } else {
            setSelectedItems(prev => prev.filter(p => p.work_order_item_id !== item.work_order_item_id));
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAvailableItems();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 h-full w-full bg-black/30" /> 
                </Transition.Child>
                
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 border-b pb-3">
                                    Pilih Barang (dari Surat Jalan Diterima)
                                </Dialog.Title>
                                
                                <form onSubmit={handleSearch} className="flex gap-2 justify-end my-4">
                                    <Input
                                        type="text"
                                        placeholder="Cari Kode Barang / Jenis Barang..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-grow"
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                        <Search className="w-5 h-5" />
                                    </button>
                                </form>

                                <div className="mt-4 max-h-[50vh] overflow-y-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left"></th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Barang</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoading && (
                                                <tr><td colSpan={5} className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin inline-block" /></td></tr>
                                            )}
                                            {!isLoading && availableItems.length === 0 && (
                                                <tr><td colSpan={5} className="text-center p-4 text-gray-500 italic">Tidak ada item yang tersedia untuk supplier ini.</td></tr>
                                            )}
                                            {availableItems.map(item => {
                                                const isChecked = selectedItems.some(p => p.work_order_item_id === item.work_order_item_id);
                                                const isDisabled = existingItemIds.includes(item.work_order_item_id); 
                                                
                                                return (
                                                    <tr key={item.work_order_item_id} className={`hover:bg-gray-50 ${isDisabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}>
                                                        <td className="px-4 py-2">
                                                            <input 
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded"
                                                                checked={isChecked || isDisabled}
                                                                disabled={isDisabled}
                                                                onChange={(e) => handleSelectItem(item, e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium">{item.jenis_barang}</td>
                                                        <td className="px-4 py-2">{item.code_item}</td>
                                                        <td className="px-4 py-2 text-right">{item.berat.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right">{item.kadar.toLocaleString('id-ID')}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        onClick={onClose}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                        onClick={() => onConfirm(selectedItems)}
                                        disabled={selectedItems.length === 0}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah ({selectedItems.length}) Barang
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

export default SelectItemSetorModal;