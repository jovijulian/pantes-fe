"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrlv2, httpGet } from '@/../helpers'; 
import Input from '@/components/form/input/InputField'; 
import { Loader2, Plus, Search } from 'lucide-react';
import moment from 'moment';

export interface PurchaseOrderForTable {
    purchase_order_id: number;
    no_order: string;
    tgl_pesan: string; 
    pemesan: string; 
    berat: number;
    cokim: number;
    nominal: number;
    supplier: string;
}

interface SelectPOModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedPOs: PurchaseOrderForTable[]) => void;
    supplierId: number | null;
    existingPOIds: number[];
}

const SelectPOModal: React.FC<SelectPOModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    supplierId, 
    existingPOIds 
}) => {
    
    const [availablePOs, setAvailablePOs] = useState<PurchaseOrderForTable[]>([]);
    const [selectedPOs, setSelectedPOs] = useState<PurchaseOrderForTable[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAvailablePOs = async () => {
        if (!supplierId) return; 
        
        setIsLoading(true);
        try {
            const res = await httpGet(endpointUrlv2(`/work-order/order-by-supplier/${supplierId}`), true, {
                search: searchTerm,
            });
            
            const mappedPOs: PurchaseOrderForTable[] = res.data.data.map((po: any) => ({
                purchase_order_id: po.id,
                no_order: po.no_order,
                tgl_pesan: po.date,
                pemesan: po.staff?.name || 'N/A', 
                berat: Number(po.weight) || 0,
                cokim: Number(po.cokim) || 0,
                nominal: Number(po.nominal) || 0,
                supplier: po.supplier.name,
            }));

            setAvailablePOs(mappedPOs);

        } catch (error) {
            toast.error("Gagal memuat data Purchase Order.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            fetchAvailablePOs();
        } else {
            setAvailablePOs([]);
            setSelectedPOs([]);
            setSearchTerm("");
        }
    }, [isOpen, supplierId]); 
    const handleSelectPO = (po: PurchaseOrderForTable, checked: boolean) => {
        if (checked) {
            setSelectedPOs(prev => [...prev, po]);
        } else {
            setSelectedPOs(prev => prev.filter(p => p.purchase_order_id !== po.purchase_order_id));
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('a')
        fetchAvailablePOs(); 
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={onClose}>
                {/* Backdrop */}
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
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 border-b pb-3">
                                    Pilih Purchase Order
                                </Dialog.Title>
                                
                                {/* Search Bar */}
                                <form onSubmit={handleSearch} className="flex justify-end gap-2 my-4">
                                    <Input
                                        type="text"
                                        placeholder="Cari No. Pesanan..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-grow"
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                        <Search className="w-5 h-5" />
                                    </button>
                                </form>

                                {/* Tabel PO */}
                                <div className="mt-4 max-h-[50vh] overflow-y-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left"></th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pesanan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pesan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemesan</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cokim</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoading && (
                                                <tr><td colSpan={5} className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin inline-block" /></td></tr>
                                            )}
                                            {!isLoading && availablePOs.length === 0 && (
                                                <tr><td colSpan={5} className="text-center p-4 text-gray-500 italic">Tidak ada PO yang tersedia untuk supplier ini.</td></tr>
                                            )}
                                            {availablePOs.map(po => {
                                                const isChecked = selectedPOs.some(p => p.purchase_order_id === po.purchase_order_id);
                                                // Cek jika PO sudah ada di form
                                                const isDisabled = existingPOIds.includes(po.purchase_order_id); 
                                                
                                                return (
                                                    <tr key={po.purchase_order_id} className={`hover:bg-gray-50 ${isDisabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}>
                                                        <td className="px-4 py-2">
                                                            <input 
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded"
                                                                checked={isChecked || isDisabled}
                                                                disabled={isDisabled}
                                                                onChange={(e) => handleSelectPO(po, e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium">{po.no_order}</td>
                                                        <td className="px-4 py-2">{moment(po.tgl_pesan).format('DD MMM YYYY')}</td>
                                                        <td className="px-4 py-2 font-medium">{po.supplier}</td>
                                                        <td className="px-4 py-2 text-right">{po.berat}</td>
                                                        <td className="px-4 py-2 text-right">{po.cokim.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right">{po.nominal.toLocaleString('id-ID')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Tombol Aksi Modal */}
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
                                        onClick={() => onConfirm(selectedPOs)}
                                        disabled={selectedPOs.length === 0}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah ({selectedPOs.length}) PO Terpilih
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

export default SelectPOModal;