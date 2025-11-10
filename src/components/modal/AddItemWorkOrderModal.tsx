"use client";

import React, { useState, useEffect, useMemo, Fragment, useCallback } from 'react'; // <-- TAMBAHKAN useCallback
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrlv2, httpGet, httpPost } from '@/../helpers';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select-custom';
import { Loader2, Plus, Save, Trash2, X, AlertTriangle, CheckCircle, DollarSign, Scale } from 'lucide-react'; // <-- TAMBAHKAN DollarSign
import _ from "lodash";

interface SelectOption { value: string; label: string; }
interface IExistingItem {
    id: number;
    pcs: string;
    kadar: string;
    bruto: string;
    disc: string;
}
interface IItemFormState {
    item_id: number | null;
    weight: number; 
    kadar: number; 
    bruto: number;
    disc: number; 
    sg: number;
    scope: number;
    xray: number;
    order_id: number | null;
    order?: {
        id: number;
        no_order: string;
    };
}
interface IItemInList extends IItemFormState {
    id: string; 
    item_name: string;
    netto: number; 
    bayar_nett: number; 
    order_no_order: string;
}
interface IItemPayload {
    item_id: number;
    weight: number;
    kadar: number;
    bruto: number;
    disc: number;
    sg: number;
    scope: number;
    xray: number;
    order_id: number;
}
interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: number;
    onSuccess: () => void; 
    baseNominal: number; 
    baseTotalWeight: number; 
    existingItems: IExistingItem[]; 
}

const AddItemWorkOrderModal: React.FC<AddItemModalProps> = ({ 
    isOpen, 
    onClose, 
    workOrderId,
    onSuccess,
    baseNominal,
    baseTotalWeight,
    existingItems
}) => {
    
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [itemPOOptions, setItemPOOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<IItemFormState>(initialFormState());
    const [itemsList, setItemsList] = useState<IItemInList[]>([]);
    const [calculatedNetto, setCalculatedNetto] = useState(0);
    const [calculatedBayarNett, setCalculatedBayarNett] = useState(0); 

    const { totalBrutoInDetail, totalBrutoInList, selisih } = useMemo(() => {
        const inDetail = existingItems.reduce((acc, item) => acc + Number(item.pcs), 0);
        const inList = itemsList.reduce((acc, item) => acc + item.weight, 0);
        const sisa = baseTotalWeight - (inDetail + inList);
        const roundedSisa = Number(sisa.toFixed(5));
        
        return { 
            totalBrutoInDetail: inDetail,
            totalBrutoInList: inList,
            selisih: roundedSisa
        };
       
    }, [itemsList, existingItems, baseTotalWeight]);

    const calculateModalNetto = useCallback((item: { bruto: string | number, kadar: string | number }): number => {
        const bruto = Number(item.bruto) || 0;
        const kadar = Number(item.kadar) || 0;
        return bruto * (kadar / 100);
    }, []);

    const calculateBayar = useCallback((item: { pcs: string | number, bruto: string | number, kadar: string | number, disc: string | number }): number => {
        const nominal = baseNominal || 0; 
        const pcs = Number(item.pcs) || 0;     
        const bruto = Number(item.bruto) || 0;    
        const disc = Number(item.disc) || 0;       
        
        const netto = calculateModalNetto(item);
        
        let finalBayar = 0;
        if (bruto > 0) {
            finalBayar = (nominal * (netto / bruto)) * pcs / bruto;
            if (disc > 0) {
                finalBayar = finalBayar - (finalBayar * disc / 100);
            }
        }
        return finalBayar;
    }, [baseNominal, calculateModalNetto]);

    const { totalBayarInDetail, totalBayarInList, selisihUang } = useMemo(() => {
        const inDetail = existingItems.reduce((acc, item) => acc + calculateBayar(item), 0);
        const inList = itemsList.reduce((acc, item) => acc + item.bayar_nett, 0);
        const sisa = baseNominal - (inDetail + inList);
        const roundedSisa = Number(sisa.toFixed(5));
        
        return { 
            totalBayarInDetail: inDetail,
            totalBayarInList: inList,
            selisihUang: roundedSisa
        };
       
    }, [itemsList, existingItems, baseNominal, calculateBayar]);

    useEffect(() => {
        if (isOpen) {
            const fetchItems = async () => {
                setLoadingOptions(true);
                try {
                    const res = await httpGet(endpointUrlv2("master/item/dropdown"), true);
                    setItemOptions(res.data.data.map((i: any) => ({
                        value: i.id.toString(),
                        label: `${i.name_item} (${i.code})`,
                    })));
                } catch (error) {
                    toast.error("Gagal memuat jenis barang.");
                } finally {
                    setLoadingOptions(false);
                }
            };

            const fetchOrder = async () => {
                setLoadingOptions(true);
                try {
                    const res = await httpGet(endpointUrlv2(`work-order/${workOrderId}/get-order` ), true);
                    setItemPOOptions(res.data.data.map((i: any) => ({
                        value: i.id.toString(),
                        label: `${i.no_order}`,
                    })));
                } catch (error) {
                    toast.error("Gagal memuat order.");
                } finally {
                    setLoadingOptions(false);
                }
            }
            fetchItems();
            fetchOrder();
        } else {
            setItemsList([]);
            setForm(initialFormState());
        }
    }, [isOpen]);
    useEffect(() => {
        const pcs = form.weight || 0; 
        const bruto = form.bruto || 0;
        const kadar = form.kadar || 0;
        const disc = form.disc || 0;
        const nominal = baseNominal || 0; 
    
        const netto = bruto * (kadar / 100);
        setCalculatedNetto(netto);
    
        let finalBayar = 0;
        if (bruto > 0) {
            finalBayar = (nominal * (netto / bruto)) * pcs / bruto;
            if (disc > 0) {
                finalBayar = finalBayar - (finalBayar * disc / 100);
            }
        } 
        setCalculatedBayarNett(finalBayar);
    
    }, [form.weight, form.bruto, form.kadar, form.disc, baseNominal]);

    function initialFormState(): IItemFormState {
        return {
            order_id: null,
            item_id: null,
            weight: 0,
            kadar: 0,
            bruto: baseTotalWeight, 
            disc: 0,
            sg: 0,
            scope: 0,
            xray: 0,
        };
    }

    const handleFormChange = (field: keyof IItemFormState, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateItem = (): boolean => {
        if (!form.order_id) {
            toast.error("No Pesanan wajib diisi."); return false;
        }
        if (!form.item_id) {
            toast.error("Jenis Barang wajib diisi."); return false;
        }
        if (form.bruto <= 0) {
            toast.error("Bruto harus lebih besar dari 0."); return false;
        }
        if (form.weight <= 0) {
            toast.error("Berat Terima harus lebih besar dari 0."); return false;
        }
        if (form.kadar <= 0 || form.kadar > 100) {
            toast.error("Kadar harus di antara 1 - 100."); return false;
        }
        return true;
    };

    const handleAddItemToList = () => {
        if (!validateItem()) return;

        const selectedOption = itemOptions.find(opt => opt.value === form.item_id?.toString());
        const selectedOrderOption = itemPOOptions.find(opt => opt.value === form.order_id?.toString());
        const newItem: IItemInList = {
            ...form,
            id: `item-${Date.now()}`,
            item_name: selectedOption?.label || 'N/A',
            netto: calculatedNetto,
            bayar_nett: calculatedBayarNett,
            item_id: Number(form.item_id),
            order_id: Number(form.order_id),
            order_no_order: selectedOrderOption?.label || 'N/A',
        };

        

        setItemsList(prev => [...prev, newItem]);
        setForm(initialFormState()); 
        toast.success("Barang ditambahkan ke list.");
    };

    const handleRemoveItemFromList = (id: string) => {
        setItemsList(prev => prev.filter(item => item.id !== id));
    };

    const handleConfirmSubmit = async () => {
        if (itemsList.length === 0) {
            toast.error("List barang tidak boleh kosong. Harap tambahkan barang terlebih dahulu.");
            return;
        }
        
        if (selisih > 0) {
            toast.error(`Total Berat Diterima masih kurang ${selisih.toLocaleString('id-ID')} gr dari Total Berat SJ.`);
            return;
        }

        setIsSubmitting(true);

        const itemsPayload: IItemPayload[] = itemsList.map(item => ({
            order_id: item.order_id!,
            item_id: item.item_id!,
            weight: item.weight,
            kadar: item.kadar,
            bruto: item.bruto,
            disc: item.disc,
            sg: item.sg,
            scope: item.scope,
            xray: item.xray,
        }));

        const finalPayload = {
            items: itemsPayload
        };

        try {
            await httpPost(endpointUrlv2(`work-order/${workOrderId}/add-item`), finalPayload, true);
            toast.success("Barang berhasil ditambahkan ke Surat Jalan!");
            onSuccess();
            onClose();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999" onClose={onClose}>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold">Input Barang</h4>
                                        <div className="relative z-30">
                                            <label className="block font-medium mb-1">No Pesanan<span className="text-red-400">*</span></label>
                                            <Select
                                                options={itemPOOptions}
                                                value={form.order_id ? _.find(itemPOOptions, { value: form.order_id.toString() }) : null}
                                                onValueChange={(opt) => handleFormChange('order_id', opt ? parseInt(opt.value) : null)}
                                                placeholder="Pilih order..."
                                                disabled={loadingOptions}
                                            />
                                        </div>
                                        <div className="relative z-30">
                                            <label className="block font-medium mb-1">Jenis Barang<span className="text-red-400">*</span></label>
                                            <Select
                                                options={itemOptions}
                                                value={form.item_id ? _.find(itemOptions, { value: form.item_id.toString() }) : null}
                                                onValueChange={(opt) => handleFormChange('item_id', opt ? parseInt(opt.value) : null)}
                                                placeholder="Pilih jenis barang..."
                                                disabled={loadingOptions}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-1">Bruto (gr)<span className="text-red-400">*</span></label>
                                                <CurrencyInput value={form.bruto } onValueChange={v => handleFormChange('bruto', v)} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Berat Terima (gr)<span className="text-red-400">*</span></label>
                                                <CurrencyInput value={form.weight} onValueChange={v => handleFormChange('weight', v)} placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-1">Kadar (%)<span className="text-red-400">*</span></label>
                                                <CurrencyInput value={form.kadar} onValueChange={v => handleFormChange('kadar', v)} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Discount (%)</label>
                                                <CurrencyInput value={form.disc} onValueChange={v => handleFormChange('disc', v)} placeholder="0" />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-1">Netto (gr)</label>
                                                <Input type="text" value={calculatedNetto.toLocaleString('id-ID')} disabled readOnly className="bg-gray-100" />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Bayar (Simulasi)</label>
                                                <Input
                                                    type="text"
                                                    value={calculatedBayarNett.toLocaleString('id-ID')}
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold">Analisa</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block font-medium mb-1">SG</label>
                                                <CurrencyInput value={form.sg} onValueChange={v => handleFormChange('sg', v)} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Scope</label>
                                                <CurrencyInput value={form.scope} onValueChange={v => handleFormChange('scope', v)} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">X-Ray</label>
                                                <CurrencyInput value={form.xray} onValueChange={v => handleFormChange('xray', v)} placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                onClick={handleAddItemToList}
                                                className="w-full px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center justify-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Tambahkan ke List
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        Kalkulasi Berat
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <CurrencyDisplay title="Total Berat Surat Jalan (Target)" value={baseTotalWeight} unit="gr" />
                                        <CurrencyDisplay title="Total Berat Diterima" value={totalBrutoInList + totalBrutoInDetail} unit="gr" />
                                        
                                        {selisih === 0 ? (
                                            <CurrencyDisplay title="Selisih (Sesuai)" value={0} unit="gr" color="text-green-600" />
                                        ) : selisih > 0 ? (
                                            <CurrencyDisplay title="Selisih (Kurang)" value={selisih} unit="gr" color="text-red-600" />
                                        ) : (
                                            <CurrencyDisplay title="Selisih (Lebih)" value={Math.abs(selisih)} unit="gr" color="text-yellow-600" /> 
                                        )}
                                    </div>

                                    {selisih > 0 && (
                                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            Total Berat Diterima masih kurang, target belum tercapai.
                                        </div>
                                    )}
                                    {selisih < 0 && (
                                        <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            Total Berat Diterima melebihi target berat Surat Jalan. (Selisih {Math.abs(selisih).toLocaleString('id-ID')} gr)
                                        </div>
                                    )}
                                    {selisih === 0 && (
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Total Berat Diterima sudah sesuai dengan target Surat Jalan.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        Kalkulasi Uang 
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <CurrencyDisplay title="Total Nominal SJ (Target)" value={baseNominal} unit="Rp" />
                                        <CurrencyDisplay title="Total Bayar" value={totalBayarInList + totalBayarInDetail} unit="Rp" />
                                        
                                        {selisihUang === 0 ? (
                                            <CurrencyDisplay title="Selisih" value={0} unit="Rp" color="text-gray-900" />
                                        ) : selisihUang > 0 ? (
                                            <CurrencyDisplay title="Selisih (Sisa)" value={selisihUang} unit="Rp" color="text-green-600" />
                                        ) : (
                                            <CurrencyDisplay title="Selisih (Lebih)" value={Math.abs(selisihUang)} unit="Rp" color="text-red-600" /> 
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">List Barang yang Akan Ditambahkan ({itemsList.length})</h4>
                                    <div className="max-h-[30vh] overflow-y-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. pesanan</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat Diterima</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bayar</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {itemsList.length === 0 && (
                                                    <tr><td colSpan={12} className="text-center p-4 text-gray-500 italic">Belum ada barang di list.</td></tr>
                                                )}
                                                {itemsList.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2 font-medium">{item.order_no_order}</td>
                                                        <td className="px-4 py-2 font-medium">{item.item_name}</td>
                                                        <td className="px-4 py-2 text-right">{item.bruto.toLocaleString('id-ID')} gr</td>
                                                        <td className="px-4 py-2 text-right">{item.weight.toLocaleString('id-ID')} gr</td>
                                                        <td className="px-4 py-2 text-right">{item.kadar.toLocaleString('id-ID')}%</td>
                                                        <td className="px-4 py-2 text-right">{item.disc.toLocaleString('id-ID')}%</td>
                                                        <td className="px-4 py-2 text-right font-medium">{item.netto.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right font-medium">{item.bayar_nett.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right font-medium">{item.sg.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right font-medium">{item.scope.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-right font-medium">{item.xray.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItemFromList(item.id)}
                                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                        onClick={handleConfirmSubmit}
                                        disabled={selisih > 0 || itemsList.length === 0 || isSubmitting} 
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
};

const CurrencyInput: React.FC<{
    value: number;
    onValueChange: (value: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}> = ({ value, onValueChange, placeholder, disabled, className = "" }) => {

    const format = (num: number) => {
        if (num === 0) return "";
        return num.toLocaleString('id-ID'); 
    };

    const parse = (str: string): number => {
        if (!str) return 0;
        const numOnly = str.replace(/[^\d]/g, ''); 
        return parseInt(numOnly, 10) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numberValue = parse(rawValue);
        onValueChange(numberValue);
    };

    return (
        <Input
            type="text"
            value={format(value)}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};

const CurrencyDisplay: React.FC<{ title: string; value: number; unit: string; color?: string }> = ({ title, value, unit, color = 'text-gray-900' }) => (
    <div>
      <span className="text-sm text-gray-500">{title}</span>
      <p className={`text-xl font-semibold ${color}`}>
        {Math.abs(value).toLocaleString('id-ID')} <span className="text-sm font-normal">{unit}</span>
      </p>
    </div>
  );

export default AddItemWorkOrderModal;