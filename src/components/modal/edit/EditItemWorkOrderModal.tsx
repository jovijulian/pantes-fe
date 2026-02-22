"use client";

import React, { useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrl, endpointUrlv2, httpGet, httpPost, httpPut } from '@/../helpers';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select-custom';
import { Loader2, Save, X } from 'lucide-react';
import _ from "lodash";

interface SelectOption { value: string; label: string; }
interface IWorkOrderItem {
    id: number;
    item_id: number;
    pcs: string;
    kadar: string;
    bruto: string;
    disc: string;
    sg: string;
    scope: string;
    xray: string;
    item_type: string;
    item: { name: string; };
    order_id: number;
    order?: { no_order: string; };
}

interface IItemFormState {
    order_id: number | null;
    item_id: number | null;
    weight: number;
    kadar: number;
    bruto: number;
    disc: number;
    sg: number;
    scope: number;
    xray: number;
}

interface IItemPayload {
    work_order_item_id: number;
    order_id?: number;
    item_id?: number;
    weight: number;
    kadar: number;
    bruto: number;
    disc: number;
    sg: number;
    scope: number;
    xray: number;
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
    baseNominal,
    onSuccess,
    type,
}) => {
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [itemPOOptions, setItemPOOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<IItemFormState>(initialFormState());
    const [calculatedNetto, setCalculatedNetto] = useState(0);
    const [calculatedBayarNett, setCalculatedBayarNett] = useState(0);
    useEffect(() => {
        if (itemToEdit) {
            setForm({
                order_id: itemToEdit.order_id,
                item_id: itemToEdit.item_id,
                weight: Number(itemToEdit.pcs) || 0,
                kadar: Number(itemToEdit.kadar) || 0,
                bruto: Number(itemToEdit.bruto) || 0,
                disc: Number(itemToEdit.disc) || 0,
                sg: Number(itemToEdit.sg) || 0,
                scope: Number(itemToEdit.scope) || 0,
                xray: Number(itemToEdit.xray) || 0,
            });
        }
    }, [itemToEdit, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchItems = async () => {
                setLoadingOptions(true);
                try {
                    const res = await httpGet(endpointUrl("master/item/dropdown"), true, { type: type });
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
                    const res = await httpGet(endpointUrl(`work-order/${workOrderId}/get-order`), true);
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
            setLoadingOptions
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
            item_id: null, weight: 0, kadar: 0, bruto: 0, disc: 0,
            sg: 0, scope: 0, xray: 0, order_id: null,
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

    const handleConfirmSubmit = async () => {
        if (!validateItem()) return;

        setIsSubmitting(true);

        const finalPayload: IItemPayload = {
            work_order_item_id: itemToEdit.id,
            order_id: Number(form.order_id),
            weight: form.weight,
            kadar: form.kadar,
            bruto: form.bruto,
            disc: form.disc,
            sg: form.sg,
            scope: form.scope,
            xray: form.xray,
        };

        try {
            await httpPost(endpointUrl(`work-order/${workOrderId}/update-item`), finalPayload, true);
            toast.success("Barang berhasil diupdate!");
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
                                    Edit Barang: {itemToEdit.item_type}
                                </Dialog.Title>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold">Input Barang</h4>
                                        <div className="relative z-30">
                                            <label className="block font-medium mb-1">No. Pesanan<span className="text-red-400">*</span></label>
                                            <Select
                                                options={itemPOOptions}
                                                value={form.order_id ? _.find(itemPOOptions, { value: form.order_id.toString() }) : null}
                                                onValueChange={(opt) => handleFormChange('order_id', opt ? parseInt(opt.value) : null)}
                                                placeholder="Pilih No Pesanan..."
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="relative z-30">
                                            <label className="block font-medium mb-1">Jenis Barang<span className="text-red-400">*</span></label>
                                            <Select
                                                options={itemOptions}
                                                value={form.item_id ? _.find(itemOptions, { value: form.item_id.toString() }) : null}
                                                onValueChange={(opt) => handleFormChange('item_id', opt ? parseInt(opt.value) : null)}
                                                placeholder="Pilih jenis barang..."
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-1">Bruto (gr)<span className="text-red-400">*</span></label>
                                                <CurrencyInput value={form.bruto} onValueChange={v => handleFormChange('bruto', v)} placeholder="0" />
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
        return Number(numStr).toLocaleString("id-ID");
    };

    const parseToNumber = (str: string): number => {
        if (!str) return 0;
        const cleanStr = str.replace(/\./g, "").replace(/,/g, ".");
        return parseFloat(cleanStr) || 0;
    };

    useEffect(() => {
        const currentNumeric = parseToNumber(displayValue);

        if (value !== currentNumeric) {
            if (!value) {
                setDisplayValue("");
            } else {
                setDisplayValue(
                    value.toLocaleString("id-ID", { maximumFractionDigits: 10 })
                );
            }
        }
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

export default EditItemWorkOrderModal;