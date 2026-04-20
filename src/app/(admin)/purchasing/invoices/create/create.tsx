"use client";

import React, { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import {
    Check, Loader2, Save, X, Info, Receipt, Package, FileText, Calculator, CreditCard
} from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Dialog, Transition } from '@headlessui/react';

interface IPaymentType {
    id: number;
    order_id: number;
    payment_type: string;
    bank_id: number | null;
    supplier_bank_id: number | null;
    name: string | null;
    number: string | null;
    nominal: string;
    notes: string;
    bank?: {
        bank_name: string;
        alias: string;
    };
}

interface IOrder {
    id: number;
    no_order: string;
    type: string;
    date: string;
    weight: string;
    nominal: string;
    dpp_nominal: string;
    pph: string;
    cashback: string;
    supplier?: { name: string; };
    staff?: { name: string; };
    payment_types: IPaymentType[];
}

interface InvoicePaymentForm {
    order_payment_type_id: number;
    payment_info: IPaymentType; 
    invoice_date: string;
    invoice_number: string;
    invoice_nominal: number | '';
    withholding_tax_slip_date: string;
    withholding_tax_slip_number: string;
    withholding_tax_slip_nominal: number | '';
}

interface FormState {
    order_id: number | null;
    invoice_payment: InvoicePaymentForm[];
}

interface SelectOption { value: string; label: string; }

export default function CreateInvoiceOrderPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [orderOptions, setOrderOptions] = useState<SelectOption[]>([]);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [formData, setFormData] = useState<FormState>({
        order_id: null,
        invoice_payment: [],
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async (searchQuery: string = "") => {
        setLoadingOptions(true);
        try {
            const res = await httpGet(endpointUrl(`get-order?search=${searchQuery}`), true);
            const fetchedOrders = res.data.data || [];

            setOrders(fetchedOrders);
            setOrderOptions(fetchedOrders.map((o: IOrder) => ({
                value: o.id.toString(),
                label: `${o.no_order} - ${o.supplier?.name || 'Tanpa Supplier'}`
            })));

        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat daftar order.");
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleSearchOrder = useCallback(
        _.debounce((inputValue: string) => {
            if (!inputValue) {
                fetchOrders("");
                return;
            }
            if (inputValue.length >= 5) {
                fetchOrders(inputValue);
            }
        }, 600),
        []
    );

    const handleOrderChange = (opt: any) => {
        const selectedId = opt ? parseInt(opt.value) : null;
        const foundOrder = orders.find(o => o.id === selectedId);

        if (foundOrder) {
            const mappedInvoices: InvoicePaymentForm[] = foundOrder.payment_types.map(pt => ({
                order_payment_type_id: pt.id,
                payment_info: pt,
                invoice_date: moment().format('YYYY-MM-DD'),
                invoice_number: "",
                invoice_nominal: Number(pt.nominal), 
                withholding_tax_slip_date: moment().format('YYYY-MM-DD'),
                withholding_tax_slip_number: "",
                withholding_tax_slip_nominal: 0,
            }));

            setFormData({
                order_id: selectedId,
                invoice_payment: mappedInvoices
            });
        } else {
            setFormData({ order_id: null, invoice_payment: [] });
        }
    };

    const handleInvoiceFieldChange = (index: number, field: keyof InvoicePaymentForm, value: any) => {
        const newInvoicePayments = [...formData.invoice_payment];
        (newInvoicePayments[index][field] as any) = value;
        setFormData(prev => ({ ...prev, invoice_payment: newInvoicePayments }));
    };

    const selectedOrder = useMemo(() => {
        if (!formData.order_id) return null;
        return orders.find(o => o.id === formData.order_id) || null;
    }, [formData.order_id, orders]);

    const validateForm = (): boolean => {
        if (!formData.order_id || formData.invoice_payment.length === 0) {
            toast.error("Harap pilih Order terlebih dahulu.");
            return false;
        }

        for (let i = 0; i < formData.invoice_payment.length; i++) {
            const inv = formData.invoice_payment[i];
            if (!inv.invoice_number || !inv.invoice_date || inv.invoice_nominal === '') {
                toast.error(`Harap isi Nomor, Tanggal, dan Nominal Faktur pada termin pembayaran ke-${i + 1}.`);
                return false;
            }
            if (!inv.withholding_tax_slip_number || !inv.withholding_tax_slip_date || inv.withholding_tax_slip_nominal === '') {
                toast.error(`Harap isi Nomor, Tanggal, dan Nominal Bukti Potong Pajak pada termin pembayaran ke-${i + 1}.`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsModalOpen(true);
        }
    };

    const handleConfirmSubmit = async () => {
        setIsModalOpen(false);
        setIsSubmitting(true);
        const payload = {
            order_id: formData.order_id,
            invoice_payment: formData.invoice_payment.map(inv => ({
                order_payment_type_id: inv.order_payment_type_id,
                invoice_date: moment(inv.invoice_date).format('YYYY-MM-DD'),
                invoice_number: inv.invoice_number,
                invoice_nominal: inv.invoice_nominal,
                withholding_tax_slip_date: moment(inv.withholding_tax_slip_date).format('YYYY-MM-DD'),
                withholding_tax_slip_number: inv.withholding_tax_slip_number,
                withholding_tax_slip_nominal: inv.withholding_tax_slip_nominal
            }))
        };

        try {
            await httpPost(endpointUrl('invoice-order'), payload, true);
            toast.success("Faktur berhasil dibuat!");
            router.push('/purchasing/invoices');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan faktur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (val: string | number | null) => "Rp " + Number(val || 0).toLocaleString('id-ID');
    const formatGram = (val: string | number | null) => Number(val || 0).toLocaleString('id-ID') + " Gr";

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4 max-w-full mx-auto">
                <div className="w-full flex flex-col gap-6">
                    <ComponentCard title="Pilih Pesanan (Order)">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700">Nomor Order / Pesanan <span className="text-red-400 ml-1">*</span></label>
                            <Select
                                options={orderOptions}
                                value={_.find(orderOptions, { value: formData.order_id?.toString() })}
                                onValueChange={handleOrderChange}
                                isLoading={loadingOptions}
                                onInputChange={(inputValue: string, actionMeta: any) => {
                                    if (actionMeta.action === 'input-change') {
                                        handleSearchOrder(inputValue);
                                    }
                                }}
                                isClearable={true}
                                placeholder={loadingOptions ? "Mencari Order..." : "Ketik No. Order atau Supplier..."}
                                disabled={loadingOptions && orderOptions.length === 0}
                            />
                        </div>

                        {selectedOrder && (
                            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 uppercase tracking-wide">
                                    Preview Detail Order
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Supplier</p>
                                        <p className="font-semibold text-gray-800">{selectedOrder.supplier?.name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Pemesan</p>
                                        <p className="font-semibold text-gray-800">{selectedOrder.staff?.name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Tanggal Order</p>
                                        <p className="font-semibold text-gray-800">{moment(selectedOrder.date).format("DD MMM YYYY")}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Berat Order</p>
                                        <p className="font-semibold text-blue-600 flex items-center gap-1">
                                            <Package className="w-4 h-4" /> {formatGram(selectedOrder.weight)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ComponentCard>

                    {formData.invoice_payment.length > 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {formData.invoice_payment.map((invoice, index) => (
                                <ComponentCard key={invoice.order_payment_type_id} title={`Pembayaran #${index + 1}`}>
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{invoice.payment_info.payment_type}</p>
                                                <p className="text-sm font-medium text-gray-700 mt-0.5">
                                                    {invoice.payment_info?.bank?.bank_name
                                                        ? `${invoice.payment_info.bank.bank_name} (${invoice.payment_info.name})`
                                                        : invoice.payment_info?.name || "Lainnya"}
                                                    {invoice.payment_info.number && ` - ${invoice.payment_info.number}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</p>
                                            <p className="text-lg font-black text-gray-800">{formatRupiah(invoice.payment_info.nominal)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                                                Faktur (Invoice)
                                            </h5>
                                            <div>
                                                <label className="block font-medium mb-1 text-sm text-gray-700">Nomor Faktur <span className="text-red-400 ml-1">*</span></label>
                                                <Input
                                                    value={invoice.invoice_number}
                                                    onChange={(e) => handleInvoiceFieldChange(index, 'invoice_number', e.target.value)}
                                                    placeholder="Masukkan No. Faktur..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-medium mb-1 text-sm text-gray-700">Tgl Faktur <span className="text-red-400 ml-1">*</span></label>
                                                    <SingleDatePicker
                                                        placeholderText="Pilih tanggal"
                                                        selectedDate={invoice.invoice_date ? new Date(invoice.invoice_date) : null}
                                                        onChange={(date: any) => handleInvoiceFieldChange(index, 'invoice_date', moment(date).format('YYYY-MM-DD'))}
                                                        onClearFilter={() => handleInvoiceFieldChange(index, 'invoice_date', '')}
                                                        viewingMonthDate={viewingMonthDate}
                                                        onMonthChange={setViewingMonthDate}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-medium mb-1 text-sm text-gray-700">Nominal <span className="text-red-400 ml-1">*</span></label>
                                                    <CurrencyInput
                                                        value={Number(invoice.invoice_nominal)}
                                                        onValueChange={(val) => handleInvoiceFieldChange(index, 'invoice_nominal', val)}
                                                        placeholder="Rp 0"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                                                Bukti Potong PPh
                                            </h5>
                                            <div>
                                                <label className="block font-medium mb-1 text-sm text-gray-700">Nomor Bukti Potong <span className="text-red-400 ml-1">*</span></label>
                                                <Input
                                                    value={invoice.withholding_tax_slip_number}
                                                    onChange={(e) => handleInvoiceFieldChange(index, 'withholding_tax_slip_number', e.target.value)}
                                                    placeholder="Masukkan No. Bukti Potong..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-medium mb-1 text-sm text-gray-700">Tgl Bukti Potong <span className="text-red-400 ml-1">*</span></label>
                                                    <SingleDatePicker
                                                        placeholderText="Pilih tanggal"
                                                        selectedDate={invoice.withholding_tax_slip_date ? new Date(invoice.withholding_tax_slip_date) : null}
                                                        onChange={(date: any) => handleInvoiceFieldChange(index, 'withholding_tax_slip_date', moment(date).format('YYYY-MM-DD'))}
                                                        onClearFilter={() => handleInvoiceFieldChange(index, 'withholding_tax_slip_date', '')}
                                                        viewingMonthDate={viewingMonthDate}
                                                        onMonthChange={setViewingMonthDate}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-medium mb-1 text-sm text-gray-700">Nominal Potongan <span className="text-red-400 ml-1">*</span></label>
                                                    <CurrencyInput
                                                        value={Number(invoice.withholding_tax_slip_nominal)}
                                                        onValueChange={(val) => handleInvoiceFieldChange(index, 'withholding_tax_slip_nominal', val)}
                                                        placeholder="Rp 0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ComponentCard>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingOptions || !formData.order_id || formData.invoice_payment.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-md"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSubmitting ? "Menyimpan..." : "Simpan Faktur"}
                    </button>
                </div>
            </form>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                orderNo={selectedOrder?.no_order || "-"}
                paymentCount={formData.invoice_payment.length}
            />
        </>
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
            if (!value && value !== 0) {
                setDisplayValue("");
            } else {
                setDisplayValue(value.toLocaleString("id-ID", { maximumFractionDigits: 10 }));
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

// --- Helper Component: Modal ---
const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    orderNo: string;
    paymentCount: number;
}> = ({ isOpen, onClose, onConfirm, isSubmitting, orderNo, paymentCount }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 h-full w-full bg-black/40 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                                    <Info className="w-6 h-6 text-blue-600" />
                                    Konfirmasi Simpan
                                </Dialog.Title>
                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Anda akan menyimpan data Faktur ini. Pastikan nomor faktur dan bukti potong pajak sudah sesuai dengan dokumen fisik.
                                    </p>
                                    <div className="text-sm p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-1">
                                        <p className="text-gray-600">Order Terpilih: <span className="font-bold text-gray-900 block sm:inline">{orderNo}</span></p>
                                        <p className="text-gray-600">Total Termin: <span className="font-bold text-gray-900 block sm:inline">{paymentCount} Data Faktur</span></p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={onClose} disabled={isSubmitting}>
                                        Periksa Lagi
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
                                        onClick={onConfirm}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {isSubmitting ? "Menyimpan..." : "Ya, Simpan Faktur"}
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