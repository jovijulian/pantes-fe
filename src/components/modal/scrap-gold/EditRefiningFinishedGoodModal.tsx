"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { endpointUrl, httpPost } from '@/../helpers';
import Input from '@/components/form/input/InputField';
import { Loader2, Save } from 'lucide-react';

export interface IFinishedGoodItem {
    id: number;
    item_id?: number;
    netto: number | string;
    sg: number | string;
    scope: number | string;
    xray: number | string;
    item_type?: string;
    name_item?: string;
    item?: {
        id?: number;
        name?: string;
        name_item?: string;
        code?: string;
    };
}

interface EditRefiningFinishedGoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    refiningId: number;
    itemToEdit: IFinishedGoodItem | null;
    status: number | string;
    onSuccess: () => void;
}

export default function EditRefiningFinishedGoodModal({
    isOpen,
    onClose,
    refiningId,
    itemToEdit,
    status,
    onSuccess,
}: EditRefiningFinishedGoodModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [netto, setNetto] = useState<number>(0);
    const [sg, setSg] = useState<number>(0);
    const [scope, setScope] = useState<number>(0);
    const [xray, setXray] = useState<number>(0);

    const isSelesai = String(status) === "3";

    useEffect(() => {
        if (itemToEdit && isOpen) {
            setNetto(Number(itemToEdit.netto) || 0);
            setSg(Number(itemToEdit.sg) || 0);
            setScope(Number(itemToEdit.scope) || 0);
            setXray(Number(itemToEdit.xray) || 0);
        }
    }, [itemToEdit, isOpen]);

    const itemName =
        itemToEdit?.name_item ||
        itemToEdit?.item?.name_item ||
        itemToEdit?.item?.name ||
        itemToEdit?.item_type ||
        (itemToEdit ? `Item #${itemToEdit.id}` : "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToEdit) return;

        if (netto <= 0) {
            toast.error("Netto harus diisi dengan benar.");
            return;
        }

        setIsSubmitting(true);
        const payload = {
            items_finished_good_id: itemToEdit.id,
            netto: Number(netto),
            sg: Number(sg || 0),
            scope: Number(scope || 0),
            xray: Number(xray || 0),
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${refiningId}/update-item-finished-good`),
                payload,
                true
            );
            toast.success("Barang berhasil diupdate!");
            onClose();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal mengupdate barang.");
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 border-b pb-3">
                                    Edit Barang Jadi
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <div>
                                            <label className="block font-medium mb-1">Nama Barang</label>
                                            <Input
                                                type="text"
                                                value={itemName || "-"}
                                                disabled={true}
                                                readOnly
                                                className="bg-gray-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-medium mb-1">
                                                Netto (gr)<span className="text-red-400">*</span>
                                                {isSelesai && (
                                                    <span className="text-xs text-amber-600 ml-2 font-normal">
                                                        (Status Selesai: tidak dapat diubah)
                                                    </span>
                                                )}
                                            </label>
                                            <CurrencyInput
                                                value={netto}
                                                onValueChange={setNetto}
                                                disabled={isSelesai}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold">Analisa</h4>
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
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            Update Barang
                                        </button>
                                    </div>
                                </form>
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
