"use client";

import React, { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from 'lodash';
import { Loader2, Plus, Search } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import Input from '@/components/form/input/InputField';

export interface IRefiningSendDetail {
    id: number;
    scrap_gold_send_id: number;
    scrap_gold_refining_id: number | null;
    item_id: number;
    no_scrap_gold_send: string;
    code: string;
    name_item: string;
    bruto: string | number;
    kadar: string | number;
    netto: string | number;
    status: number;
}

export interface IRefiningSendItem {
    id: number;
    scrap_gold_refining_id: number | null;
    expedition_id: number;
    type_purpose: string | number;
    supplier_id: number | null;
    vendor_id: number | null;
    no_scrap_gold_send: string;
    date: string;
    notes: string | null;
    receipt_date: string | null;
    status: string;
    expedition?: {
        id: number;
        code: string;
        name: string;
    } | null;
    supplier?: {
        id: number;
        code: string;
        name: string;
    } | null;
    vendor?: {
        id: number;
        code: string;
        name: string;
    } | null;
    details: IRefiningSendDetail[];
}

interface AddRefiningSendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (items: IRefiningSendItem[]) => void;
    selectedSendIds?: number[];
}

export const getSendPurposeLabel = (item: IRefiningSendItem): string => {
    const type = String(item.type_purpose);
    if (type === "1") return "Gudang CT";
    if (type === "2") return item.supplier?.name ? `Supplier - ${item.supplier.name}` : "Supplier";
    if (type === "3") return item.vendor?.name ? `Vendor - ${item.vendor.name}` : "Vendor / Pabrik";
    return "-";
};

export const sumSendDetail = (details: IRefiningSendDetail[] | undefined, field: 'bruto' | 'netto'): number => {
    if (!details || details.length === 0) return 0;
    return _.sumBy(details, (d) => Number(d[field] || 0));
};

export default function AddRefiningSendModal({
    isOpen,
    onClose,
    onConfirm,
    selectedSendIds = [],
}: AddRefiningSendModalProps) {
    const [availableSends, setAvailableSends] = useState<IRefiningSendItem[]>([]);
    const [selectedSends, setSelectedSends] = useState<IRefiningSendItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAvailableSends = useCallback(async (search = "") => {
        setIsLoading(true);
        try {
            const res = await httpGet(
                endpointUrl("purchase/scrap-gold/send/dropdown?status=3"),
                true,
                search ? { search } : undefined
            );
            setAvailableSends(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data pengiriman rongsok.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableSends("");
        } else {
            setAvailableSends([]);
            setSelectedSends([]);
            setSearchTerm("");
        }
    }, [isOpen, fetchAvailableSends]);

    const filteredSends = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return availableSends;
        return availableSends.filter((item) => {
            const purpose = getSendPurposeLabel(item).toLowerCase();
            const expedition = (item.expedition?.name || "").toLowerCase();
            const itemsText = (item.details || [])
                .map((d) => `${d.code} ${d.name_item}`)
                .join(" ")
                .toLowerCase();
            return (
                item.no_scrap_gold_send.toLowerCase().includes(keyword) ||
                purpose.includes(keyword) ||
                expedition.includes(keyword) ||
                itemsText.includes(keyword)
            );
        });
    }, [availableSends, searchTerm]);

    const handleSelectSend = (sendItem: IRefiningSendItem, checked: boolean) => {
        if (checked) {
            setSelectedSends((prev) => [...prev, sendItem]);
        } else {
            setSelectedSends((prev) => prev.filter((item) => item.id !== sendItem.id));
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAvailableSends(searchTerm);
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
                                    Pilih Data Kirim Rongsok
                                </Dialog.Title>

                                <form onSubmit={handleSearch} className="flex justify-end gap-2 my-4">
                                    <Input
                                        type="text"
                                        placeholder="Cari No. Pengiriman, tujuan, atau barang..."
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
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pengiriman</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Kirim</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ekspedisi</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto (Gr)</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto (Gr)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoading && (
                                                <tr>
                                                    <td colSpan={8} className="text-center p-4">
                                                        <Loader2 className="w-6 h-6 animate-spin inline-block" />
                                                    </td>
                                                </tr>
                                            )}
                                            {!isLoading && filteredSends.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="text-center p-4 text-gray-500 italic">
                                                        Tidak ada data kirim rongsok yang tersedia.
                                                    </td>
                                                </tr>
                                            )}
                                            {!isLoading && filteredSends.map((sendItem) => {
                                                const isChecked = selectedSends.some((item) => item.id === sendItem.id);
                                                const isDisabled = selectedSendIds.includes(sendItem.id);
                                                const totalBruto = sumSendDetail(sendItem.details, 'bruto');
                                                const totalNetto = sumSendDetail(sendItem.details, 'netto');

                                                return (
                                                    <tr
                                                        key={sendItem.id}
                                                        className={`hover:bg-gray-50 ${isDisabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded"
                                                                checked={isChecked || isDisabled}
                                                                disabled={isDisabled}
                                                                onChange={(e) => handleSelectSend(sendItem, e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium whitespace-nowrap">
                                                            {sendItem.no_scrap_gold_send}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            {sendItem.date ? moment(sendItem.date).format('DD MMM YYYY') : '-'}
                                                        </td>
                                                        <td className="px-4 py-2 font-medium whitespace-nowrap">
                                                            {getSendPurposeLabel(sendItem)}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            {sendItem.expedition?.name || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-gray-700">
                                                            {sendItem.details && sendItem.details.length > 0
                                                                ? sendItem.details.map((d) => `${d.code} - ${d.name_item} (${Number(d.kadar)}%)`).join(', ')
                                                                : '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right whitespace-nowrap">
                                                            {totalBruto.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">
                                                            {totalNetto.toLocaleString('id-ID')}
                                                        </td>
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
                                        onClick={() => onConfirm(selectedSends)}
                                        disabled={selectedSends.length === 0}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah ({selectedSends.length}) Data Terpilih
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
