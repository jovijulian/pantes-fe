"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrl, httpPost } from '@/../helpers';
import Input from '@/components/form/input/InputField';
import { Loader2, Save, Package } from 'lucide-react';

interface IWorkOrderItem {
    id: number;
    no_order: string;
    order_id: number;
    item_id: number;
    pcs: string;
    kadar: string;
    bruto: string;
    disc: string;
    sg: string;
    scope: string;
    xray: string;
    netto: string;
    item_type: string;
    item: { name: string; };
    nominal: string;
    total_nominal: string;
    weight?: string;
}

interface IItemFormState {
    weight: number;
    pcs: number;
    nominal: number;
}

interface IItemPayload {
    work_order_item_id: number;
    weight: number;
    pcs: number;
    nominal: number;
    total_nominal: number;
}

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: number;
    itemToEdit: IWorkOrderItem;
    baseNominal: number;
    onSuccess: () => void;
    type: string;
}

const EditItemWorkOrderModal: React.FC<EditItemModalProps> = ({
    isOpen,
    onClose,
    workOrderId,
    itemToEdit,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<IItemFormState>({ weight: 0, pcs: 0, nominal: 0 });

    useEffect(() => {
        if (itemToEdit && isOpen) {
            // Kita gunakan bruto jika weight tidak tersedia dari response API lama, 
            // namun jika backend sudah mengembalikan weight, kita prioritize weight.
            const initialWeight = Number(itemToEdit.weight) || Number(itemToEdit.bruto) || 0;
            
            setForm({
                weight: initialWeight,
                pcs: Number(itemToEdit.pcs) || 0,
                nominal: Number(itemToEdit.nominal) || 0,
            });
        }
    }, [itemToEdit, isOpen]);

    const handleFormChange = (field: keyof IItemFormState, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateItem = (): boolean => {
        if (form.weight <= 0) {
            toast.error("Berat harus lebih besar dari 0."); return false;
        }
        if (form.pcs <= 0) {
            toast.error("PCS harus lebih besar dari 0."); return false;
        }
        if (form.nominal <= 0) {
            toast.error("Nominal Harga harus lebih besar dari 0."); return false;
        }
        return true;
    };

    const handleConfirmSubmit = async () => {
        if (!validateItem()) return;

        setIsSubmitting(true);

        const total_nominal = form.pcs * form.nominal;

        const finalPayload: IItemPayload = {
            work_order_item_id: itemToEdit.id,
            weight: form.weight,
            pcs: form.pcs,
            nominal: form.nominal,
            total_nominal: total_nominal
        };

        try {
            await httpPost(endpointUrl(`work-order/${workOrderId}/update-item`), finalPayload, true);
            toast.success("Barang Surat Jalan berhasil diupdate!");
            onSuccess();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (value: number) => {
        return "Rp " + value.toLocaleString('id-ID');
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
                <Transition.Child as={Fragment}>
                    <div className="fixed inset-0 h-full w-full bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment}>
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 border-b pb-3 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Edit Barang Surat Jalan
                                </Dialog.Title>

                                <div className="mt-5 space-y-4">
                                    {/* INFO READ ONLY */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-gray-700">No. Pesanan (PO)</label>
                                            <Input value={itemToEdit?.no_order || '-'} disabled readOnly className="bg-gray-100 text-gray-500 font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-gray-700">Jenis Barang</label>
                                            <Input value={itemToEdit?.item_type || itemToEdit?.item?.name || '-'} disabled readOnly className="bg-gray-100 text-gray-500 font-medium" />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 mt-2">
                                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Update Detail</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1 text-gray-700">Berat (gr)<span className="text-red-500 ml-1">*</span></label>
                                                <Input 
                                                    type="number" 
                                                    value={form.weight || ''} 
                                                    onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 0)} 
                                                    min="0" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1 text-gray-700">PCS<span className="text-red-500 ml-1">*</span></label>
                                                <Input 
                                                    type="number" 
                                                    value={form.pcs || ''} 
                                                    onChange={(e) => handleFormChange('pcs', parseInt(e.target.value) || 0)} 
                                                    min="0" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1 text-gray-700">Harga Satuan<span className="text-red-500 ml-1">*</span></label>
                                                <CurrencyInput 
                                                    value={form.nominal} 
                                                    onValueChange={v => handleFormChange('nominal', v)} 
                                                    placeholder="Rp 0" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CALCULATED TOTAL */}
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                                        <span className="text-sm font-semibold text-blue-800">Total Nominal</span>
                                        <span className="text-xl font-bold text-blue-700">{formatRupiah(form.pcs * form.nominal)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                                        onClick={handleConfirmSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Update Barang
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
    const [displayValue, setDisplayValue] = useState("");
    
    const formatThousand = (numStr: string) => {
        if (!numStr) return "";
        const rawNum = numStr.replace(/\D/g, '');
        return Number(rawNum).toLocaleString('id-ID');
    };

    useEffect(() => {
        const parse = (str: string): number => {
            if (!str) return 0;
            const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(cleanStr) || 0;
        };

        const currentNumeric = parse(displayValue);

        if (value !== currentNumeric) {
            if (!value) {
                setDisplayValue("");
            } else {
                setDisplayValue(value.toLocaleString('id-ID', { maximumFractionDigits: 10 }));
            }
        }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;
        input = input.replace(/[^0-9,]/g, '');
        const parts = input.split(',');
        if (parts.length > 2) return;

        let integerPart = parts[0];
        if (integerPart.length > 1 && integerPart.startsWith('0')) {
            integerPart = integerPart.substring(1);
        }

        let formattedInteger = "";
        if (integerPart) {
            formattedInteger = formatThousand(integerPart);
        }

        let newDisplayValue = formattedInteger;

        if (parts.length > 1) {
            newDisplayValue += ',' + parts[1];
        } else if (input.endsWith(',')) {
            newDisplayValue += ',';
        }

        setDisplayValue(newDisplayValue);

        const parseToNumber = (str: string): number => {
            if (!str) return 0;
            const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(cleanStr) || 0;
        };
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

export default EditItemWorkOrderModal;