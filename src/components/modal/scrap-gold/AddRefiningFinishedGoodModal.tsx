"use client";

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select-custom';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import moment from 'moment';
import _ from 'lodash';

interface SelectOption {
    value: string;
    label: string;
}

export interface IRefiningItemInList {
    temp_id: string;
    item_id: number;
    item_name: string;
    netto: number;
    sg: number;
    scope: number;
    xray: number;
}

interface IDetailRongsok {
    id: number;
    no_scrap_gold_send?: string;
    name_item?: string;
    code?: string;
    date?: string;
    pcs?: string | number;
    total_bruto?: string | number;
    total_netto?: string | number;
    bruto?: string | number;
    netto?: string | number;
    kadar?: string | number;
}

interface AddRefiningFinishedGoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    refiningId: number;
    details: IDetailRongsok[];
    initialSusutBruto?: string | number;
    initialSusutNetto?: string | number;
    initialOngkosBruto?: string | number;
    initialOngkosNetto?: string | number;
    initialTambahBruto?: string | number;
    initialTambahNetto?: string | number;
    onSuccess: () => void;
}

export default function AddRefiningFinishedGoodModal({
    isOpen,
    onClose,
    refiningId,
    details = [],
    initialSusutBruto = "0",
    initialSusutNetto = "0",
    initialOngkosBruto = "0",
    initialOngkosNetto = "0",
    initialTambahBruto = "0",
    initialTambahNetto = "0",
    onSuccess,
}: AddRefiningFinishedGoodModalProps) {
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [itemInputKey, setItemInputKey] = useState(0);

    // Form Penambahan / Pengurangan Berat
    const [susutBruto, setSusutBruto] = useState<number>(Number(initialSusutBruto) || 0);
    const [susutNetto, setSusutNetto] = useState<number>(Number(initialSusutNetto) || 0);
    const [ongkosBruto, setOngkosBruto] = useState<number>(Number(initialOngkosBruto) || 0);
    const [ongkosNetto, setOngkosNetto] = useState<number>(Number(initialOngkosNetto) || 0);
    const [tambahBruto, setTambahBruto] = useState<number>(Number(initialTambahBruto) || 0);
    const [tambahNetto, setTambahNetto] = useState<number>(Number(initialTambahNetto) || 0);

    // Input Barang Jadi
    const [selectedItemOption, setSelectedItemOption] = useState<SelectOption | null>(null);
    const [netto, setNetto] = useState<number>(0);
    const [sg, setSg] = useState<number>(0);
    const [scope, setScope] = useState<number>(0);
    const [xray, setXray] = useState<number>(0);

    // List Barang
    const [itemsList, setItemsList] = useState<IRefiningItemInList[]>([]);

    const resetItemInput = useCallback(() => {
        setSelectedItemOption(null);
        setNetto(0);
        setSg(0);
        setScope(0);
        setXray(0);
        setItemInputKey((prev) => prev + 1);
    }, []);

    const resetAllForm = useCallback(() => {
        setSusutBruto(Number(initialSusutBruto) || 0);
        setSusutNetto(Number(initialSusutNetto) || 0);
        setOngkosBruto(Number(initialOngkosBruto) || 0);
        setOngkosNetto(Number(initialOngkosNetto) || 0);
        setTambahBruto(Number(initialTambahBruto) || 0);
        setTambahNetto(Number(initialTambahNetto) || 0);
        setItemsList([]);
        resetItemInput();
        setFormKey((prev) => prev + 1);
    }, [
        initialSusutBruto,
        initialSusutNetto,
        initialOngkosBruto,
        initialOngkosNetto,
        initialTambahBruto,
        initialTambahNetto,
        resetItemInput,
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchMasterItems();
            resetAllForm();
        } else {
            resetAllForm();
        }
    }, [isOpen, resetAllForm]);

    const handleClose = () => {
        resetAllForm();
        onClose();
    };

    const fetchMasterItems = async () => {
        setLoadingOptions(true);
        try {
            const res = await httpGet(endpointUrl("master/item/dropdown"), true);
            const items = res.data?.data || [];
            setItemOptions(
                items.map((s: any) => ({
                    value: s.id.toString(),
                    label: s.code ? `${s.name_item} (${s.code})` : s.name_item,
                }))
            );
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat master item.");
        } finally {
            setLoadingOptions(false);
        }
    };

    // Total Rongsok
    const totalRongsokBruto = useMemo(() => {
        return _.sumBy(details, (d) => Number(d.total_bruto ?? d.bruto ?? 0));
    }, [details]);

    const totalRongsokNetto = useMemo(() => {
        return _.sumBy(details, (d) => Number(d.total_netto ?? d.netto ?? 0));
    }, [details]);

    const totalRongsokPcs = useMemo(() => {
        return _.sumBy(details, (d) => Number(d.pcs || 0));
    }, [details]);

    // Total Akhir Proses:
    // Bruto = totalRongsokBruto - susutBruto - ongkosBruto + tambahBruto
    // Netto = totalRongsokNetto - susutNetto - ongkosNetto + tambahNetto
    const totalAkhirBruto = useMemo(() => {
        const val =
            totalRongsokBruto -
            Number(susutBruto || 0) -
            Number(ongkosBruto || 0) +
            Number(tambahBruto || 0);
        return Number(val.toFixed(3));
    }, [totalRongsokBruto, susutBruto, ongkosBruto, tambahBruto]);

    const totalAkhirNetto = useMemo(() => {
        const val =
            totalRongsokNetto -
            Number(susutNetto || 0) -
            Number(ongkosNetto || 0) +
            Number(tambahNetto || 0);
        return Number(val.toFixed(3));
    }, [totalRongsokNetto, susutNetto, ongkosNetto, tambahNetto]);

    const totalNettoList = useMemo(() => {
        return _.sumBy(itemsList, (item) => item.netto);
    }, [itemsList]);

    const handleAddToList = () => {
        if (!selectedItemOption) {
            toast.error("Pilih jenis barang terlebih dahulu.");
            return;
        }
        if (!netto || Number(netto) <= 0) {
            toast.error("Netto barang harus lebih dari 0.");
            return;
        }

        const newItem: IRefiningItemInList = {
            temp_id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            item_id: parseInt(selectedItemOption.value),
            item_name: selectedItemOption.label,
            netto: Number(netto),
            sg: Number(sg || 0),
            scope: Number(scope || 0),
            xray: Number(xray || 0),
        };

        setItemsList((prev) => [...prev, newItem]);
        resetItemInput();
        toast.success("Barang ditambahkan ke list.");
    };

    const handleRemoveFromList = (temp_id: string) => {
        setItemsList((prev) => prev.filter((item) => item.temp_id !== temp_id));
    };

    const handleSubmit = async () => {
        if (itemsList.length === 0) {
            toast.error("List barang tidak boleh kosong. Harap tambahkan barang terlebih dahulu.");
            return;
        }

        setIsSubmitting(true);
        const payload = {
            susut_bruto: String(susutBruto || "0"),
            susut_netto: String(susutNetto || "0"),
            ongkos_bruto: String(ongkosBruto || "0"),
            ongkos_netto: String(ongkosNetto || "0"),
            tambah_bruto: String(tambahBruto || "0"),
            tambah_netto: String(tambahNetto || "0"),
            items: itemsList.map((item) => ({
                item_id: item.item_id,
                netto: item.netto,
                sg: item.sg,
                scope: item.scope,
                xray: item.xray,
            })),
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${refiningId}/add-items-finished-good`),
                payload,
                true
            );
            toast.success("Barang berhasil ditambahkan ke Surat Jalan!");
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal menambahkan barang jadi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999" onClose={handleClose}>
                <Transition.Child as={Fragment}>
                    <div className="fixed inset-0 h-full w-full bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment}>
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 border-b pb-3">
                                    Tambahkan Barang ke Surat Jalan
                                </Dialog.Title>

                                <div key={formKey} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {/* Kiri: Data Barang Rongsok, Penambahan/Pengurangan, Total Akhir Proses */}
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold text-gray-800">Data Barang Rongsok</h4>
                                        <div className="max-h-[20vh] overflow-y-auto border rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No. Kirim Rongsok</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pcs</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {details.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="text-center p-3 text-xs text-gray-500 italic">
                                                                Tidak ada rongsok terlampir.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        details.map((d, idx) => (
                                                            <tr key={d.id || idx}>
                                                                <td className="px-3 py-2 text-xs font-medium">{d.no_scrap_gold_send || "-"}</td>
                                                                <td className="px-3 py-2 text-xs">{d.date ? moment(d.date).format("DD MMM YYYY") : "-"}</td>
                                                                <td className="px-3 py-2 text-xs font-medium text-center">{Number(d.pcs || 0).toLocaleString('id-ID')} </td>
                                                                <td className="px-3 py-2 text-xs text-right">{Number(d.total_bruto ?? d.bruto ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr</td>
                                                                <td className="px-3 py-2 text-xs text-right font-medium">{Number(d.total_netto ?? d.netto ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                                    <tr>
                                                        <td colSpan={2} className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-800">Total</td>
                                                        <td className="px-3 py-2 text-center text-xs font-bold text-gray-800">{totalRongsokPcs.toLocaleString('id-ID')} Pcs</td>
                                                        <td className="px-3 py-2 text-right text-xs font-bold text-gray-800">
                                                            {totalRongsokBruto.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-xs font-bold text-gray-800">
                                                            {totalRongsokNetto.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Penambahan / Pengurangan Berat */}
                                        <div className="pt-2 border-t space-y-3">
                                            <h4 className="font-semibold text-sm text-gray-800">Penambahan / Pengurangan Berat</h4>

                                            {/* Susut */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-700">Susut</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Bruto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={susutBruto} onValueChange={setSusutBruto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Netto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={susutNetto} onValueChange={setSusutNetto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ongkos */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-700">Ongkos</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Bruto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={ongkosBruto} onValueChange={setOngkosBruto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Netto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={ongkosNetto} onValueChange={setOngkosNetto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Penambahan */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-700">Penambahan</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Bruto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={tambahBruto} onValueChange={setTambahBruto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Netto</span>
                                                        <div className="flex-1">
                                                            <CurrencyInput value={tambahNetto} onValueChange={setTambahNetto} placeholder="0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Total Akhir Proses */}
                                            <div className="space-y-1 pt-2 border-t">
                                                <label className="block text-xs font-semibold text-gray-800">Total Akhir Proses</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Bruto</span>
                                                        <div className="flex-1">
                                                            <Input
                                                                type="text"
                                                                value={`${totalAkhirBruto.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr`}
                                                                disabled
                                                                readOnly
                                                                className="bg-gray-100 font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Netto</span>
                                                        <div className="flex-1">
                                                            <Input
                                                                type="text"
                                                                value={`${totalAkhirNetto.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr`}
                                                                disabled
                                                                readOnly
                                                                className="bg-gray-100 font-semibold text-blue-600"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kanan: Input Barang Jadi */}
                                    <div className="p-4 border rounded-lg space-y-4 flex flex-col justify-between">
                                        <div key={itemInputKey} className="space-y-4">
                                            <h4 className="font-semibold text-gray-800">Input Barang</h4>
                                            <div className="relative z-30">
                                                <label className="block font-medium mb-1">
                                                    Jenis Barang<span className="text-red-400">*</span>
                                                </label>
                                                <Select
                                                    options={itemOptions}
                                                    value={selectedItemOption}
                                                    onValueChange={setSelectedItemOption}
                                                    placeholder="Pilih jenis barang..."
                                                    disabled={loadingOptions}
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-1">
                                                    Netto (gr)<span className="text-red-400">*</span>
                                                </label>
                                                <CurrencyInput value={netto} onValueChange={setNetto} placeholder="0" />
                                            </div>

                                            <div className="pt-2 border-t">
                                                <h4 className="font-semibold text-sm mb-3">Analisa</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block font-medium mb-1 text-xs">SG</label>
                                                        <CurrencyInput value={sg} onValueChange={setSg} placeholder="0" />
                                                    </div>
                                                    <div>
                                                        <label className="block font-medium mb-1 text-xs">Scope</label>
                                                        <CurrencyInput value={scope} onValueChange={setScope} placeholder="0" />
                                                    </div>
                                                    <div>
                                                        <label className="block font-medium mb-1 text-xs">X-Ray</label>
                                                        <CurrencyInput value={xray} onValueChange={setXray} placeholder="0" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                onClick={handleAddToList}
                                                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-md flex items-center justify-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Tambahkan ke List
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* List Barang yang Akan Ditambahkan */}
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-2">
                                        List Barang yang Akan Ditambahkan ({itemsList.length})
                                    </h4>
                                    <div className="max-h-[30vh] overflow-y-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {itemsList.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="text-center p-4 text-gray-500 italic">
                                                            Belum ada barang di list.
                                                        </td>
                                                    </tr>
                                                )}
                                                {itemsList.map((item) => (
                                                    <tr key={item.temp_id}>
                                                        <td className="px-4 py-2 font-medium">{item.item_name}</td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {item.netto.toLocaleString('id-ID')} gr
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {item.sg.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {item.scope.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {item.xray.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFromList(item.temp_id)}
                                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                                <tr>
                                                    <td className="px-4 py-3 text-left text-sm font-bold uppercase">
                                                        Total ({itemsList.length} item)
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-bold">
                                                        {totalNettoList.toLocaleString('id-ID')} gr
                                                    </td>
                                                    <td colSpan={4}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                        onClick={handleSubmit}
                                        disabled={itemsList.length === 0 || isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Simpan ({itemsList.length}) Barang
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

const CurrencyInput: React.FC<{
    value: number;
    onValueChange: (value: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}> = ({ value, onValueChange, placeholder, disabled, className = "" }) => {
    const [displayValue, setDisplayValue] = useState(() => {
        if (!value || value === 0) return "";
        return value.toLocaleString("id-ID", { maximumFractionDigits: 10 });
    });

    const formatThousand = (numStr: string) => {
        if (!numStr) return "";
        return Number(numStr).toLocaleString("id-ID");
    };

    const parseToNumber = (str: string): number => {
        if (!str) return 0;
        const cleanStr = str.replace(/\./g, "").replace(/,/g, ".");
        return parseFloat(cleanStr) || 0;
    };

    useEffect(() => {
        if (!value || value === 0) {
            setDisplayValue("");
        } else {
            const currentNumeric = parseToNumber(displayValue);
            if (value !== currentNumeric) {
                setDisplayValue(
                    value.toLocaleString("id-ID", { maximumFractionDigits: 10 })
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        input = input.replace(/[^0-9,]/g, "");

        const parts = input.split(",");
        if (parts.length > 2) return;

        const integerPart = parts[0];
        const decimalPart = parts[1] ?? "";

        let formattedInteger = "";

        if (integerPart !== "") {
            formattedInteger = formatThousand(integerPart);
        }

        let newDisplayValue = formattedInteger;

        if (input.includes(",")) {
            newDisplayValue += "," + decimalPart;
        }

        setDisplayValue(newDisplayValue);
        onValueChange(parseToNumber(newDisplayValue));
    };

    return (
        <Input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};
