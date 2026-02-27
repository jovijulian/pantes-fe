"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPost, alertToast, httpPut } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, User, Building, Calendar, Info, Check,
    FileText, DollarSign, UserCheck, Download, AlertTriangle, Box,
    Trash2, Plus, Edit, X
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import { Dialog, Transition } from '@headlessui/react';
import axios from "axios";
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';

interface IUserSimple { id: number; name: string; email: string; }
interface ISupplier { id: number; name: string; code: string; }
interface IStaff { id: number; name: string; email: string; }

interface IPaymentType {
    id: number;
    payment_type: string;
    bank_id: string | null;
    supplier_bank_id: number | null;
    name: string | null;
    nominal: string;
    account_number?: string;
    account_name?: string;
    bank: { bank_name: string, account_name: string, alias: string } | null;
    notes: string;
}

interface IOrderItem {
    id: number;
    item_id: number;
    name_item: string;
    weight: number;
    pcs: number;
    nominal: number;
    total_nominal: number;
}

interface IPurchaseOrderData {
    id: number;
    no_order: string;
    date: string;
    weight: string;
    pcs: string;
    cokim: string | null;
    nominal: string;
    status: "1" | "2" | "3" | "4" | string;
    validated_date: string | null;
    approved_date: string | null;
    payment_date: string | null;
    created_at: string;
    created_by: IUserSimple;
    supplier: ISupplier;
    staff: IStaff;
    payment_types: IPaymentType[];
    order_items: IOrderItem[];
    work_order_id: string | number | null;
    work_order: { no_surat_jalan: string } | null;
}

interface SelectOption { value: string; label: string; }

type ModalAction = 'Validasi' | 'Disetujui' | 'Bayar' | null;

export default function PurchaseOrderDetailPage() {
    const [data, setData] = useState<IPurchaseOrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<ModalAction | null>(null);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{ type: 'item' | 'payment', id: number } | null>(null);
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [bankOptions, setBankOptions] = useState<SelectOption[]>([]);
    const [masterBankOptions, setMasterBankOptions] = useState<SelectOption[]>([]); // Tambahan Master Bank
    const [newItemForm, setNewItemForm] = useState({ item_id: '', weight: 0, pcs: 0, nominal: 0 });
    
    // Penyesuaian form payment dengan field manual
    const [newPaymentForm, setNewPaymentForm] = useState({ 
        payment_type: 'BANK TRANSFER', 
        supplier_bank_id: '', 
        bank_id: '', 
        account_number: '', 
        account_name: '', 
        notes: '', 
        nominal: 0 
    });

    const paymentMethodOptions: SelectOption[] = [
        { value: "BANK TRANSFER", label: "Bank Transfer" },
        { value: "SETOR TUNAI", label: "Setor Tunai" },
        { value: "CV(FAKTUR)", label: "CV (Faktur)" },
        { value: "LAINNYA", label: "Lainnya" },
    ];

    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gram";
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMMM YYYY');
    };

    const getStatusBadge = (status: string) => {
        let color: "success" | "error" | "warning" | "info";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'Baru'; break;
            case '2': color = 'info'; label = 'Valid'; break;
            case '3': color = 'success'; label = 'Disetujui'; break;
            case '4': color = 'success'; label = 'Bayar'; break;
            case '99': color = 'error'; label = 'Rejected'; break;
            default: color = 'info'; label = `Status (${status})`; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/order/${id}`), true);
            const detailData = response.data.data;
            setData(detailData);
            if (detailData.supplier?.id) fetchBanks(detailData.supplier.id);
        } catch (error: any) {
            toast.error("Gagal mengambil detail PO.");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const fetchItems = async () => {
        if (itemOptions.length > 0) return;
        try {
            const res = await httpGet(endpointUrl("master/item/dropdown"), true, { type: 2 });
            setItemOptions(res.data.data.map((i: any) => ({
                value: i.id.toString(),
                label: `${i.name_item} (${i.code})`,
            })));
        } catch (error) { toast.error("Gagal memuat item"); }
    };

    const fetchBanks = async (supplierId: number) => {
        try {
            const res = await httpGet(endpointUrl(`master/supplier/${supplierId}/bank/dropdown`), true);
            setBankOptions(res.data.data.map((b: any) => ({
                value: b.id.toString(),
                label: `${b.bank_name} - ${b.account_number} (${b.account_name})`
            })));
        } catch (error) { toast.error("Gagal memuat bank supplier"); }
    };

    const fetchMasterBanks = async () => {
        if (masterBankOptions.length > 0) return;
        try {
            const res = await httpGet(endpointUrl("master/bank/dropdown"), true);
            setMasterBankOptions(res.data.data.map((b: any) => ({
                value: b.id.toString(),
                label: `${b.bank_name} (${b.alias})`
            })));
        } catch (error) { toast.error("Gagal memuat master bank"); }
    };

    useEffect(() => { 
        getDetail(); 
        fetchItems(); 
        fetchMasterBanks(); 
    }, [getDetail]);

    const handleDeleteConfirm = async () => {
        if (!deleteConfig || !data) return;
        setIsSubmitting(true);
        try {

            if (deleteConfig.type === 'item') {
                await httpPut(endpointUrl(`purchase/order/${data.id}/item`), { order_item_id: deleteConfig.id }, true);
                toast.success("Item berhasil dihapus");
            } else {
                await httpPut(endpointUrl(`purchase/order/${data.id}/payment-type`), { order_payment_type_id: deleteConfig.id }, true);
                toast.success("Pembayaran berhasil dihapus");
            }
            setDeleteConfig(null);
            getDetail(); // Refresh data
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        }
        finally { setIsSubmitting(false); }
    };

    const handleAddItem = async () => {
        if (!data) return;
        if (!newItemForm.item_id || newItemForm.weight <= 0 || newItemForm.pcs <= 0 || newItemForm.nominal <= 0) {
            return toast.error("Harap isi semua field item dengan benar.");
        }
        setIsSubmitting(true);
        try {
            const payload = {
                item_id: Number(newItemForm.item_id),
                weight: newItemForm.weight,
                pcs: newItemForm.pcs,
                nominal: newItemForm.nominal,
                total_nominal: newItemForm.nominal * newItemForm.pcs
            };
            await httpPost(endpointUrl(`purchase/order/${data.id}/item`), payload, true);
            toast.success("Item berhasil ditambahkan");
            setIsAddItemModalOpen(false);
            setNewItemForm({ item_id: '', weight: 0, pcs: 0, nominal: 0 });
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        }
        finally { setIsSubmitting(false); }
    };

    const handleAddPayment = async () => {
        if (!data) return;
        if (newPaymentForm.nominal <= 0) return toast.error("Nominal harus lebih dari 0.");
        
        const isTransferOrSetor = newPaymentForm.payment_type === "BANK TRANSFER" || newPaymentForm.payment_type === "SETOR TUNAI";

        if (isTransferOrSetor) {
            if (!newPaymentForm.supplier_bank_id) return toast.error("Harap pilih bank supplier.");
        } else {
            if (!newPaymentForm.bank_id) return toast.error("Harap pilih Bank.");
            if (!newPaymentForm.account_number || !newPaymentForm.account_name) return toast.error("No. Rekening dan Atas Nama harus diisi.");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                payment_type: newPaymentForm.payment_type,
                supplier_bank_id: isTransferOrSetor ? Number(newPaymentForm.supplier_bank_id) : null,
                bank_id: !isTransferOrSetor ? Number(newPaymentForm.bank_id) : null,
                account_number: !isTransferOrSetor ? newPaymentForm.account_number : "",
                account_name: !isTransferOrSetor ? newPaymentForm.account_name : "",
                notes: newPaymentForm.notes,
                nominal: newPaymentForm.nominal
            };
            
            await httpPost(endpointUrl(`purchase/order/${data.id}/payment-type`), payload, true);
            toast.success("Pembayaran berhasil ditambahkan");
            setIsAddPaymentModalOpen(false);
            setNewPaymentForm({ payment_type: 'BANK TRANSFER', supplier_bank_id: '', bank_id: '', account_number: '', account_name: '', notes: '', nominal: 0 });
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        }
        finally { setIsSubmitting(false); }
    };

    const handleOpenModal = (order: IPurchaseOrderData, action: ModalAction) => {
        setData(order); setModalAction(action); setPaymentDate(moment().format('YYYY-MM-DD')); setIsModalOpen(true);
    };

    const handleConfirmAction = async (date?: string) => {
        if (!data || !modalAction) return;
        setIsSubmitting(true);
        const payload: any = { status: 0 };
        let successMessage = "";

        switch (modalAction) {
            case 'Validasi': payload.status = 2; successMessage = "Order berhasil divalidasi!"; break;
            case 'Disetujui': payload.status = 3; successMessage = "Order berhasil disetujui!"; break;
            case 'Bayar': payload.status = 4; payload.payment_date = moment(date).format('YYYY-MM-DD'); successMessage = "Order berhasil dibayar!"; break;
            default: setIsSubmitting(false); return;
        }

        try {
            await httpPost(endpointUrl(`purchase/order/${data.id}/change-status`), payload, true);
            toast.success(successMessage); setIsModalOpen(false); getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        }
        finally { setIsSubmitting(false); }
    };

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`purchase/order-lm/${data.id}/export`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];

            let filename = `purchase_order.pdf`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            link.href = blobUrl;

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error("Error saat memproses PDF:", error);
            toast.error("Failed to generate report. Please try again later.");
        } finally {
            setIsDownloadLoading(false);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen dark:bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700 dark:text-gray-300">Memuat detail Purchase Order...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4 dark:bg-gray-900">
            <p className="text-red-600 dark:text-red-400">Gagal memuat data atau PO tidak ditemukan.</p>
            <button onClick={() => router.push('/purchasing/orders-lm')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );

    const totalItemNominal = data.order_items?.reduce((sum, item) => sum + Number(item.total_nominal), 0);
    const totalPayment = data.payment_types.reduce((sum, p) => sum + Number(p.nominal), 0);
    const remainingBalance = totalItemNominal - totalPayment;
    const isUnbalanced = remainingBalance !== 0;
    const isEditable = data.status === "1";

    const isTransferOrSetorForm = newPaymentForm.payment_type === "BANK TRANSFER" || newPaymentForm.payment_type === "SETOR TUNAI";

    return (
        <div className="dark:bg-gray-900 min-h-screen pb-10 transition-colors">
            <ComponentCard title="Detail Purchase Order">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b dark:border-gray-700">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Purchase Order</span>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{data.no_order}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                        {getStatusBadge(data.status)}
                        {data.status == "1" && (
                            <button
                                type="button"
                                onClick={() => router.push(`/purchasing/orders-lm/edit/${data.id}`)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-all"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={isDownloadLoading}
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md 
                            bg-indigo-600 text-white text-sm font-medium shadow-sm 
                            hover:bg-indigo-700 disabled:opacity-50
                            transition-all duration-200"
                        >
                            {isDownloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>Export</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<User />} label="Pemesan" value={data.staff.name} />
                    <DetailItem icon={<Building />} label="Supplier" value={data.supplier.name} />
                    <DetailItem icon={<Calendar />} label="Tanggal PO" value={moment(data.date).format('DD MMMM YYYY')} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Rincian Pembayaran" icon={<FileText />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jenis</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Info Bank</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nominal</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                                            {isEditable && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                        {data.payment_types && data.payment_types.length > 0 ? (
                                            data.payment_types.map((payment) => {
                                                const isManual = payment.payment_type !== "BANK TRANSFER" && payment.payment_type !== "SETOR TUNAI";
                                                return (
                                                    <tr key={payment.id}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{payment.payment_type}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                                                            {isManual ? (
                                                                <div>
                                                                    <p className="font-semibold">{payment.bank?.bank_name || "-"}</p>
                                                                    <p className="text-xs text-gray-500">{payment.account_number} - {payment.account_name}</p>
                                                                </div>
                                                            ) : (
                                                                <p>{payment.bank ? `${payment.bank.bank_name} - ${payment.name}` : "-"}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                                                            {formatRupiah(payment.nominal)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-800 dark:text-gray-200 break-words max-w-[150px]">{payment.notes || "-"}</td>
                                                        {isEditable && (
                                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                <button onClick={() => setDeleteConfig({ type: 'payment', id: payment.id })} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={isEditable ? 5 : 4} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    Tidak ada data pembayaran.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {isEditable && (
                                <div className="mt-3 flex justify-start">
                                    <button onClick={() => { setIsAddPaymentModalOpen(true); setNewPaymentForm(prev => ({ ...prev, nominal: remainingBalance > 0 ? remainingBalance : 0 })); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors">
                                        <Plus className="w-4 h-4" /> Tambah Pembayaran
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col items-end gap-2 p-4 mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-right w-full sm:w-1/2 flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Nominal Pembayaran:</span>
                                    <span className="font-semibold ">{formatRupiah(totalPayment)}</span>
                                </div>
                            </div>
                        </Section>

                        <Section title="Data LM" icon={<Box />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jenis Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Berat (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PCS</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Nominal</th>
                                            {isEditable && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                        {data.order_items && data.order_items.length > 0 ? (
                                            data.order_items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{item.name_item}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 text-right">{item.weight}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 text-right">{item.pcs}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 text-right">{formatRupiah(item.nominal)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">{formatRupiah(item.total_nominal)}</td>
                                                    {isEditable && (
                                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                                            <button onClick={() => setDeleteConfig({ type: 'item', id: item.id })} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={isEditable ? 6 : 5} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    Tidak ada data item.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {isEditable && (
                                <div className="mt-3 flex justify-start">
                                    <button onClick={() => setIsAddItemModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors">
                                        <Plus className="w-4 h-4" /> Tambah Item
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-end gap-6 p-4 mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-right">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Berat & Pcs</span>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatGram(data.weight)} ({data.pcs} Pcs)
                                    </p>
                                </div>
                                <div className="text-right border-l pl-6 dark:border-gray-700">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Nominal Item</span>
                                    <p className="text-lg font-semibold">
                                        {formatRupiah(totalItemNominal)}
                                    </p>
                                </div>
                            </div>
                        </Section>

                        <div className="flex flex-col items-end gap-2 p-4 mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className={`w-full sm:w-1/2 mt-2 flex justify-between items-center font-medium ${!isUnbalanced ? 'text-emerald-500' : 'text-orange-500'
                                }`}>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status Balance:</span>
                                {!isUnbalanced ? (
                                    <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Pembayaran Balance</span>
                                ) : (
                                    <span className="flex items-center gap-1 font-bold">
                                        Selisih: {formatRupiah(Math.abs(remainingBalance))}
                                    </span>
                                )}
                            </div>

                            {isUnbalanced && (
                                <div className="w-full mt-3 p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-orange-700 dark:text-orange-400 text-left">
                                        <span className="font-semibold">Perhatian:</span> Terdapat selisih antara nominal Data LM dan nominal Pembayaran. Harap pastikan kembali sebelum memproses approval.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                <Info className="w-5 h-5" /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat" value={`${formatDate(data.created_at)}`} />
                                <InfoRow label="Tanggal Validasi" value={formatDate(data.validated_date)} />
                                <InfoRow label="Tanggal Approval" value={formatDate(data.approved_date)} />
                                <InfoRow label="Tanggal Bayar" value={formatDate(data.payment_date)} />
                                <InfoRow label="No. Surat Jalan" value={data.work_order?.no_surat_jalan || data.work_order_id || "-"} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t dark:border-gray-700">
                    {data.status === "1" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                            onClick={() => handleOpenModal(data, 'Validasi')}
                        >
                            <Check className="w-4 h-4" /> Validasi
                        </button>
                    )}
                    {data.status === "2" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
                            onClick={() => handleOpenModal(data, 'Disetujui')}
                        >
                            <Check className="w-4 h-4" /> Approve
                        </button>
                    )}
                    {data.status === "3" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                            onClick={() => handleOpenModal(data, 'Bayar')}
                        >
                            <DollarSign className="w-4 h-4" /> Bayar
                        </button>
                    )}
                </div>
            </ComponentCard>

            <ChangeStatusOrderModal
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                order={data} actionType={modalAction} isSubmitting={isSubmitting}
                onConfirm={handleConfirmAction} paymentDate={paymentDate} setPaymentDate={setPaymentDate}
            />

            <Transition appear show={deleteConfig !== null} as={Fragment}>
                <Dialog as="div" className="relative z-[99999]" onClose={() => setDeleteConfig(null)}>
                    <div className="fixed inset-0 bg-black/70" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-red-500" /> Konfirmasi Hapus
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Apakah Anda yakin ingin menghapus {deleteConfig?.type === 'item' ? 'Item' : 'Pembayaran'} ini?
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" onClick={() => setDeleteConfig(null)} disabled={isSubmitting}>Batal</button>
                                    <button type="button" className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : null} Hapus
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isAddItemModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[99999]" onClose={() => setIsAddItemModalOpen(false)}>
                    <div className="fixed inset-0 bg-black/70" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Tambah Item LM</Dialog.Title>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Item</label>
                                        <Select options={itemOptions} value={itemOptions.find(o => o.value === newItemForm.item_id)} onValueChange={(opt) => setNewItemForm(p => ({ ...p, item_id: opt ? opt.value : '' }))} placeholder="Pilih item..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Berat (gr)</label>
                                            <Input type="number" value={newItemForm.weight || ''} onChange={(e) => setNewItemForm(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PCS</label>
                                            <Input type="number" value={newItemForm.pcs || ''} onChange={(e) => setNewItemForm(p => ({ ...p, pcs: parseInt(e.target.value) || 0 }))} placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Satuan</label>
                                        <CurrencyInput value={newItemForm.nominal} onValueChange={(val) => setNewItemForm(p => ({ ...p, nominal: val }))} placeholder="Rp 0" />
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Total Nominal</span>
                                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatRupiah(newItemForm.nominal * newItemForm.pcs)}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" onClick={() => setIsAddItemModalOpen(false)}>Batal</button>
                                    <button type="button" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center" onClick={handleAddItem} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} Simpan
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isAddPaymentModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[99999]" onClose={() => setIsAddPaymentModalOpen(false)}>
                    <div className="fixed inset-0 bg-black/70" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Tambah Pembayaran</Dialog.Title>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Pembayaran</label>
                                        <Select 
                                            options={paymentMethodOptions} 
                                            value={paymentMethodOptions.find(o => o.value === newPaymentForm.payment_type)} 
                                            onValueChange={(opt) => setNewPaymentForm(p => ({ 
                                                ...p, 
                                                payment_type: opt ? opt.value : 'BANK TRANSFER',
                                                supplier_bank_id: '',
                                                bank_id: '',
                                                account_number: '',
                                                account_name: '',
                                                notes: '' 
                                            }))} 
                                        />
                                    </div>
                                    
                                    {isTransferOrSetorForm ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Supplier</label>
                                            <Select options={bankOptions} value={bankOptions.find(o => o.value === newPaymentForm.supplier_bank_id) || null} onValueChange={(opt) => setNewPaymentForm(p => ({ ...p, supplier_bank_id: opt ? opt.value : '' }))} placeholder="Pilih bank supplier..." />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank</label>
                                                <Select options={masterBankOptions} value={masterBankOptions.find(o => o.value === newPaymentForm.bank_id) || null} onValueChange={(opt) => setNewPaymentForm(p => ({ ...p, bank_id: opt ? opt.value : '' }))} placeholder="Pilih Bank..." />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Rekening</label>
                                                <Input type="text" value={newPaymentForm.account_number} onChange={(e) => setNewPaymentForm(p => ({...p, account_number: e.target.value}))} placeholder="Input No. Rekening" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atas Nama</label>
                                                <Input type="text" value={newPaymentForm.account_name} onChange={(e) => setNewPaymentForm(p => ({...p, account_name: e.target.value}))} placeholder="Input Atas Nama" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                                <Input type="text" value={newPaymentForm.notes} onChange={(e) => setNewPaymentForm(p => ({...p, notes: e.target.value}))} placeholder="Catatan tambahan" />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominal</label>
                                        <CurrencyInput value={newPaymentForm.nominal} onValueChange={(val) => setNewPaymentForm(p => ({ ...p, nominal: val }))} placeholder="Rp 0" />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" onClick={() => setIsAddPaymentModalOpen(false)}>Batal</button>
                                    <button type="button" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center" onClick={handleAddPayment} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} Simpan
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
            <span>{icon}</span> {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 flex items-start gap-4 h-full">
        <div className="text-blue-500 dark:text-blue-400 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800 dark:text-gray-200">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex flex-col sm:flex-row justify-between border-b border-gray-100 dark:border-gray-700 py-2 last:border-b-0 ${isTotal ? 'bg-gray-50 dark:bg-gray-800/50 -mx-3 px-3' : ''}`}>
        <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{label}</span>
        <span className={`font-semibold text-gray-800 dark:text-gray-200 text-left sm:text-right text-sm sm:text-base ${isTotal ? 'text-lg text-blue-600 dark:text-blue-400' : ''}`}>
            {value || '-'}
        </span>
    </div>
);

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