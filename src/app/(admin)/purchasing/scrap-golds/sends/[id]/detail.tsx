"use client";

import React, { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import _ from "lodash";
import axios from "axios";
import {
    Loader2, User, Calendar, Info, CheckCircle,
    FileText, Scale, Download, UserCheck, X, Box,
    Truck, Warehouse, Store, Factory, ArrowRight,
    MapPin, PackageCheck, Plus, Edit, Trash2, AlertTriangle
} from "lucide-react";
import {
    FaTruck, FaClipboardCheck, FaDolly
} from "react-icons/fa";

// Components & Helpers
import { endpointUrl, httpGet, httpPost, alertToast } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Modal } from '@/components/ui/modal';
import AddFinishedGoodModal from "@/components/modal/scrap-gold/AddFinishedGoodModal";
import AddItemModal from "@/components/modal/scrap-gold/AddItemModal";
import Select from "@/components/form/Select-custom";
import AddSendItemModal from "@/components/modal/scrap-gold/AddSendItemModal";


interface IExpedition {
    id: number;
    code: string;
    name: string;
}

interface IPartner {
    id: number;
    name: string;
    email?: string;
    code?: string;
    phone?: string;
}

interface ISendDetail {
    id: number;
    scrap_gold_send_id: string;
    item_id: string;
    no_scrap_gold_send: string;
    name_item: string;
    bruto: string | number;
    kadar: string | number;
    netto: string | number;
    status: string;
}

interface IFinishedGood {
    id: number;
    item_id: number;
    item_type: string;
    netto: string | number;
    sg: string | number;
    scope: string | number;
    xray: string | number;
    code_item?: string;
}

interface ISendTransactionData {
    id: number;
    expedition_id: string;
    type_purpose: "1" | "2" | "3";
    supplier_id: string | null;
    vendor_id: string | null;
    no_scrap_gold_send: string;
    date: string;
    notes: string;
    receipt_date: string | null;
    status: "1" | "2" | "3" | "4";
    created_at: string;
    updated_at: string;
    created_by?: IPartner;
    expedition?: IExpedition;
    supplier?: IPartner;
    vendor?: IPartner;
    details: ISendDetail[];
    items_finished_good?: IFinishedGood[];
}

export default function ScrapGoldSendDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [data, setData] = useState<ISendTransactionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processDate, setProcessDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [nextStatus, setNextStatus] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<IFinishedGood | null>(null);
    const [isFGModalOpen, setIsFGModalOpen] = useState(false);
    const [isFGSubmitting, setIsFGSubmitting] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isRongsokModalOpen, setIsRongsokModalOpen] = useState(false);
    const [isRongsokSubmitting, setIsRongsokSubmitting] = useState(false);
    const [isManageRongsokModalOpen, setIsManageRongsokModalOpen] = useState(false);
    const [isDeleteRongsokModalOpen, setIsDeleteRongsokModalOpen] = useState(false);
    const [selectedRongsok, setSelectedRongsok] = useState<ISendDetail | null>(null);

    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + " Gr";
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMMM YYYY');
    };

    const formatDateTime = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMM YYYY HH:mm');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '1': return <Badge color="warning">New</Badge>;
            case '2': return <Badge color="info">Dikirim</Badge>;
            case '3': return <Badge color="success">Diterima</Badge>;
            case '4': return <Badge color="primary">Stock</Badge>;
            default: return <Badge color="info">Unknown</Badge>;
        }
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/scrap-gold/send/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("Data Pengiriman tidak ditemukan.");
                router.push('/purchasing/scrap-golds/sends');
            } else {
                toast.error("Gagal mengambil detail.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);


    const handleOpenProcessModal = (targetStatus: number) => {
        setNextStatus(targetStatus);
        setProcessDate(moment().format('YYYY-MM-DD'));
        setViewingMonthDate(new Date());
        setIsModalOpen(true);
    };

    const handleProcessSubmit = async () => {
        if (!data || !nextStatus) return;
        setIsProcessing(true);
        try {
            const payload: any = { status: nextStatus };
            if (nextStatus === 3) {
                payload.receipt_date = processDate;
            }

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/change-status`), payload, true);

            toast.success("Status berhasil diupdate!");
            setIsModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddFinishedGood = async (payload: any) => {
        if (!data) return;
        setIsFGSubmitting(true);
        try {
            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/add-items-finished-good`), payload, true);
            toast.success("Barang Jadi berhasil ditambahkan!");
            setIsFGModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsFGSubmitting(false);
        }
    };


    const handleAddRongsok = async (payload: any) => {
        if (!data) return;
        setIsRongsokSubmitting(true);
        try {
            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/add-item-scrap`), payload, true);
            toast.success("Rongsok berhasil ditambahkan!");
            setIsRongsokModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsRongsokSubmitting(false);
        }
    };

    const handleEditScrapItem = (item: ISendDetail) => {
        toast.info(`Edit Item: ${item.name_item} (Implementasi Modal Edit)`);
    };


    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`purchase/scrap-gold/send/${id}/export`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            console.log(response.headers['content-disposition'])
            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);
            // window.open(blobUrl, '_blank');

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

    const handleExportReceipt = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`purchase/scrap-gold/send/${id}/export-stock`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            console.log(response.headers['content-disposition'])
            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);
            // window.open(blobUrl, '_blank');

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

    const openEditModal = (fg: IFinishedGood) => {
        setSelectedItem(fg);
        setIsManageModalOpen(true);
    };

    const openDeleteModal = (fg: IFinishedGood) => {
        setSelectedItem(fg);
        setIsDeleteModalOpen(true);
    };

    const openEditRongsokModal = (item: ISendDetail) => {
        setSelectedRongsok(item);
        setIsManageRongsokModalOpen(true);
    };

    const openDeleteRongsokModal = (item: ISendDetail) => {
        setSelectedRongsok(item);
        setIsDeleteRongsokModalOpen(true);
    };

    const handleUpdateFinishedGood = async (payload: any) => {
        if (!selectedItem || !data) return;
        setIsSubmitting(true);
        try {
            const apiPayload = {
                items_finished_good_id: selectedItem.id,
                netto: payload.netto,
                sg: payload.sg,
                scope: payload.scope,
                xray: payload.xray
            };

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/update-item-finished-good`), apiPayload, true);

            toast.success("Item Finished Good berhasil diupdate!");
            setIsManageModalOpen(false);
            setSelectedItem(null);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateItem = async (payload: any) => {
        if (!selectedRongsok || !data) return;
        setIsRongsokSubmitting(true);
        try {
            const apiPayload = {
                netto: payload.netto,
                bruto: payload.bruto,
                kadar: payload.kadar
            };

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${selectedRongsok.id}/update-item-scrap`), apiPayload, true);

            toast.success("Rongsok berhasil diupdate!");
            setIsManageRongsokModalOpen(false);
            setSelectedRongsok(null);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsRongsokSubmitting(false);
        }
    };


    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            const apiPayload = {
                scrap_gold_detail_id: selectedItem.id
            };

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${id}/delete-item`), apiPayload, true);
            toast.success("Item berhasil dihapus!");
            setIsDeleteModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (!event.target.closest(".relative")) {
                setIsOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleDeleteRongsok = async () => {
        if (!selectedRongsok) return;
        setIsSubmitting(true);
        try {
            const apiPayload = {};
            const scrapGoldSendDetailId = selectedRongsok.id;

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${scrapGoldSendDetailId}/delete-item-scrap`), apiPayload, true);
            toast.success("Item berhasil dihapus!");
            setIsDeleteRongsokModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Helpers ---
    const getPurposeInfo = (row: ISendTransactionData) => {
        if (row.type_purpose === "1") return { icon: <Warehouse />, label: "Gudang Internal", name: "Gudang CT" };
        if (row.type_purpose === "2") return { icon: <Store />, label: "Supplier", name: row.supplier?.name || "-" };
        if (row.type_purpose === "3") return { icon: <Factory />, label: "Vendor / Pabrik", name: row.vendor?.name || "-" };
        return { icon: <Info />, label: "Unknown", name: "-" };
    };

    const totalBruto = data ? _.sumBy(data.details, (d) => Number(d.bruto)) : 0;
    const totalNetto = data ? _.sumBy(data.details, (d) => Number(d.netto)) : 0;
    const totalNettoBarang = data ? _.sumBy(data.items_finished_good || [], (d) => Number(d.netto)) : 0;

    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail...</p>
        </div>
    );
    if (!data) return null;

    const purposeInfo = getPurposeInfo(data);
    const isReceived = ["3", "4"].includes(data.status);

    return (
        <>
            <ComponentCard title="Detail Pengiriman Rongsok">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">No. Dokumen</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_scrap_gold_send}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                        {getStatusBadge(data.status)}

                        {data.status !== '1' && (
                           
                            <div className="relative inline-block text-left">
                            {/* Main Button */}
                            <button
                              type="button"
                              disabled={isDownloadLoading}
                              onClick={() => setIsOpen(!isOpen)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                                bg-blue-600 text-white text-sm font-medium shadow-md
                                hover:bg-blue-700 active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          
                            {/* Dropdown */}
                            {isOpen && (
                              <div
                                className="absolute right-0 mt-2 w-60 origin-top-right
                                  rounded-xl bg-white shadow-xl ring-1 ring-black/5
                                  animate-in fade-in zoom-in-95 duration-150 z-50"
                              >
                                <div className="p-2">
                                  {/* Export Surat Jalan: untuk status >= 2 */}
                                  {parseInt(data.status) >= 2 && (
                                    <button
                                      onClick={() => {
                                        handleExport();
                                        setIsOpen(false);
                                      }}
                                      className="group flex items-center gap-3 w-full
                                        px-4 py-2.5 rounded-lg text-sm font-medium
                                        text-gray-700 hover:bg-blue-50 hover:text-blue-600
                                        transition-all duration-150"
                                    >
                                      <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                      Export Surat Jalan
                                    </button>
                                  )}
                          
                                  {/* Divider */}
                                  {parseInt(data.status) >= 2 && parseInt(data.status) === 4 && (
                                    <div className="my-2 border-t border-gray-100" />
                                  )}
                          
                                  {/* Export Surat Terima: hanya status === 4 */}
                                  {parseInt(data.status) === 4 && (
                                    <button
                                      onClick={() => {
                                        handleExportReceipt();
                                        setIsOpen(false);
                                      }}
                                      className="group flex items-center gap-3 w-full
                                        px-4 py-2.5 rounded-lg text-sm font-medium
                                        text-gray-700 hover:bg-indigo-50 hover:text-indigo-600
                                        transition-all duration-150"
                                    >
                                      <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                      Export Surat Terima Stock
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<Calendar />} label="Tanggal Kirim" value={formatDate(data.date)} />
                    <DetailItem icon={<Truck />} label="Ekspedisi" value={data.expedition?.name} />
                    <DetailItem icon={purposeInfo.icon} label={`Tujuan (${purposeInfo.label})`} value={purposeInfo.name} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by?.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <FileText className="text-blue-600" />
                                    Daftar Barang Dikirim (Rongsok)
                                </h4>
                                {(data.status === '1') && (
                                    <button
                                        onClick={() => setIsRongsokModalOpen(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 shadow-sm transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Tambah Barang Dikirim
                                    </button>
                                )}
                            </div>
                            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {(data.status === '1') && (
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            )}
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.details.map((item, index) => (
                                            <tr key={index}>
                                                {(data.status === '1') && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditRongsokModal(item)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Edit Rongsok"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteRongsokModal(item)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                title="Hapus Rongsok"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="font-medium text-gray-800">{item.name_item}</div>
                                                    <div className="text-xs text-gray-400">{item.item_id ? item.name_item.split(' ')[0] : '-'}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.bruto)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.kadar}%</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600">{formatGram(item.netto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-semibold">
                                        <tr>
                                            <td
                                                colSpan={data.status === '1' ? 2 : 1}
                                                className="px-4 py-3 text-left"
                                            >
                                                Total
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                {formatGram(totalBruto)}
                                            </td>

                                            <td></td>

                                            <td className="px-4 py-3 text-right text-blue-700">
                                                {formatGram(totalNetto)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>

                            </div>
                        </div>
                        <hr />
                        {isReceived && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <PackageCheck className="text-blue-600" />
                                        Hasil Produksi / Barang Jadi
                                    </h4>
                                    {data.status == '3' && (
                                        <button
                                            onClick={() => setIsFGModalOpen(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 shadow-sm transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Tambah Barang Jadi
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-blue-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.items_finished_good && data.items_finished_good.length > 0 ? (
                                                data.items_finished_good.map((fg, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center items-center gap-2">
                                                                <button
                                                                    onClick={() => openEditModal(fg)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                    title="Edit Item"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteModal(fg)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                    title="Hapus Item"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{fg.item_type}</td>
                                                        {data.status == '4' ? (
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{fg.code_item}</td>
                                                        ) : (
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-400 italic">-</td>
                                                        )}

                                                        <td className="px-4 py-3 text-sm text-right">{formatGram(fg.netto)}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.sg}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.scope}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.xray}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic text-sm">
                                                        Belum ada hasil produksi yang diinput.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr>
                                                <td></td>
                                                <td className="px-4 py-3 text-left" colSpan={1}>Total</td>
                                                <td></td>
                                                <td className="px-4 py-3 text-right">{formatGram(totalNettoBarang)}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>

                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                <Info /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status Saat Ini" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat Pada" value={formatDateTime(data.created_at)} />
                                <InfoRow label="Terakhir Update" value={formatDateTime(data.updated_at)} />
                                {data.receipt_date && (
                                    <InfoRow label="Tanggal Diterima" value={formatDate(data.receipt_date)} />
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <h5 className="text-sm font-medium text-gray-500 mb-2">Keterangan / Notes:</h5>
                                <div className="p-3 bg-gray-50 rounded-md text-gray-700 text-sm italic min-h-[80px]">
                                    {data.notes || "Tidak ada keterangan."}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t space-y-3">
                                {data.status === "1" && (
                                    <button
                                        onClick={() => handleOpenProcessModal(2)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-all"
                                    >
                                        Proses Kirim Barang
                                    </button>
                                )}
                                {data.status === "2" && (
                                    <button
                                        onClick={() => handleOpenProcessModal(3)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm transition-all"
                                    >
                                        Proses Terima Barang
                                    </button>
                                )}
                                {data.status === "3" && (data.items_finished_good?.length ?? 0) > 0 && (
                                    <button
                                        onClick={() => handleOpenProcessModal(4)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-sm transition-all"
                                    >
                                        Masukkan ke Stock
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-start mt-8 pt-6 border-t">
                    <button
                        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => router.push('/purchasing/scrap-golds/sends')}
                    >
                        Kembali ke List
                    </button>
                </div>
            </ComponentCard >

            <ProcessModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleProcessSubmit}
                isProcessing={isProcessing}
                dateValue={processDate}
                onDateChange={setProcessDate}
                viewingMonthDate={viewingMonthDate}
                onMonthChange={setViewingMonthDate}
                nextStatus={nextStatus}
            />

            <AddFinishedGoodModal
                isOpen={isFGModalOpen}
                onClose={() => setIsFGModalOpen(false)}
                onConfirm={handleAddFinishedGood}
                isSubmitting={isFGSubmitting}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteItem}
                isSubmitting={isSubmitting}
                itemName={selectedItem?.item_type || ''}
            />
            <EditFinishedGoodModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                onConfirm={handleUpdateFinishedGood}
                isSubmitting={isSubmitting}
                initialData={selectedItem}
            />

            {/* <AddItemModal
                isOpen={isRongsokModalOpen}
                onClose={() => setIsRongsokModalOpen(false)}
                onConfirm={handleAddRongsok}
                isSubmitting={isRongsokSubmitting}
            /> */}

            <AddSendItemModal
                isOpen={isRongsokModalOpen}
                onClose={() => setIsRongsokModalOpen(false)}
                onConfirm={handleAddRongsok}
            />
            <DeleteItemConfirmationModal
                isOpen={isDeleteRongsokModalOpen}
                onClose={() => setIsDeleteRongsokModalOpen(false)}
                onConfirm={handleDeleteRongsok}
                isSubmitting={isRongsokSubmitting}
                itemName={selectedRongsok?.name_item || ''}
            />
            <EditItemModal
                isOpen={isManageRongsokModalOpen}
                onClose={() => setIsManageRongsokModalOpen(false)}
                onConfirm={handleUpdateItem}
                isSubmitting={isRongsokSubmitting}
                initialData={selectedRongsok}
            />
        </>
    );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            <span className="text-blue-500">{icon}</span> {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null | undefined }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full shadow-sm">
        <div className="text-blue-500 text-xl mt-1 p-2 bg-blue-50 rounded-full">{icon}</div>
        <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex justify-between items-center py-2 ${!isTotal && 'border-b border-gray-50 last:border-0'} ${isTotal ? 'bg-blue-50 p-3 rounded-lg mt-2' : ''}`}>
        <span className={`${isTotal ? 'font-bold text-blue-800' : 'text-gray-500'} text-sm`}>{label}</span>
        <span className={`font-semibold text-right text-sm ${isTotal ? 'text-lg text-blue-700' : 'text-gray-800'}`}>
            {value || '-'}
        </span>
    </div>
);

const ProcessModal = ({
    isOpen, onClose, onConfirm, isProcessing,
    dateValue, onDateChange,
    viewingMonthDate, onMonthChange,
    nextStatus
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isProcessing: boolean,
    dateValue: string,
    onDateChange: (val: string) => void,
    viewingMonthDate: Date,
    onMonthChange: (date: Date) => void,
    nextStatus: number | null
}) => {


    const modalContent = useMemo(() => {
        switch (nextStatus) {
            case 2:
                return {
                    title: "Konfirmasi Pengiriman",
                    desc: "Anda akan mengubah status menjadi DIKIRIM. Pastikan barang sudah disiapkan.",
                    icon: <FaTruck className="text-blue-500 text-4xl" />,
                    btnColor: "bg-blue-600 hover:bg-blue-700",
                    btnText: "Kirim",
                    needsDate: false
                };
            case 3:
                return {
                    title: "Konfirmasi Penerimaan",
                    desc: "Anda akan mengubah status menjadi DITERIMA. Silakan isi tanggal terima.",
                    icon: <FaClipboardCheck className="text-emerald-500 text-4xl" />,
                    btnColor: "bg-emerald-600 hover:bg-emerald-700",
                    btnText: "Terima Barang",
                    needsDate: true
                };
            case 4:
                return {
                    title: "Konfirmasi Masuk Stock",
                    desc: "Barang akan dimasukkan kembali ke STOCK.",
                    icon: <FaDolly className="text-purple-500 text-4xl" />,
                    btnColor: "bg-purple-600 hover:bg-purple-700",
                    btnText: "Masuk Stock",
                    needsDate: false
                };
            default:
                return {
                    title: "Proses Data",
                    desc: "Lanjutkan proses?",
                    icon: <Info className="text-gray-500 text-4xl" />,
                    btnColor: "bg-gray-600 hover:bg-gray-700",
                    btnText: "Proses",
                    needsDate: false
                };
        }
    }, [nextStatus]);
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    {modalContent.icon}
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                    <p className="text-sm text-gray-600">
                        {modalContent.desc}
                    </p>
                </div>

                {modalContent.needsDate && (
                    <div className="mb-6">
                        <label className="block font-medium mb-1 text-sm text-gray-700">
                            Tanggal Terima <span className="text-red-400">*</span>
                        </label>
                        <SingleDatePicker
                            placeholderText="Pilih Tanggal"
                            selectedDate={dateValue ? new Date(dateValue) : null}
                            onChange={(date: any) => onDateChange(moment(date).format('YYYY-MM-DD'))}
                            onClearFilter={() => onDateChange('')}
                            viewingMonthDate={viewingMonthDate}
                            onMonthChange={onMonthChange}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${modalContent.btnColor}`}
                    >
                        {isProcessing && <Loader2 className="animate-spin w-4 h-4" />}
                        {isProcessing ? "Memproses..." : modalContent.btnText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const DeleteConfirmationModal = ({
    isOpen, onClose, onConfirm, isSubmitting, itemName
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isSubmitting: boolean,
    itemName: string
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus <b>{itemName}</b> dari daftar? Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="flex justify-center gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Batal</button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Hapus
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const EditFinishedGoodModal = ({
    isOpen, onClose, onConfirm, isSubmitting, initialData
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (payload: any) => void,
    isSubmitting: boolean,
    initialData: IFinishedGood | null
}) => {
    const [netto, setNetto] = useState<number | ''>('');
    const [sg, setSg] = useState<number | ''>('');
    const [scope, setScope] = useState<number | ''>('');
    const [xray, setXray] = useState<number | ''>('');

    // Pre-fill data saat modal dibuka
    useEffect(() => {
        if (isOpen && initialData) {
            setNetto(Number(initialData.netto));
            setSg(Number(initialData.sg));
            setScope(Number(initialData.scope));
            setXray(Number(initialData.xray));
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (netto === '' || netto < 0) {
            toast.error("Netto wajib diisi.");
            return;
        }

        onConfirm({
            netto: Number(netto),
            sg: Number(sg) || 0,
            scope: Number(scope) || 0,
            xray: Number(xray) || 0
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                        Edit Barang Jadi
                    </h3>
                    <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Info Barang (Read Only) */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                        <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Nama Barang</span>
                        <span className="text-gray-800 font-medium">{initialData?.item_type || '-'}</span>
                        {initialData?.code_item && (
                            <div className="mt-2">
                                <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Kode Barang</span>
                                <span className="text-gray-800 font-medium">{initialData.code_item}</span>
                            </div>
                        )}
                    </div>

                    {/* Input Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Netto (Gr) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={netto}
                            onChange={(e) => setNetto(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            placeholder="0"
                            step="0.01"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SG</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                value={sg}
                                onChange={(e) => setSg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                value={scope}
                                onChange={(e) => setScope(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">X-Ray</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                value={xray}
                                onChange={(e) => setXray(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const DeleteItemConfirmationModal = ({
    isOpen, onClose, onConfirm, isSubmitting, itemName
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isSubmitting: boolean,
    itemName: string
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Apakah Anda yakin ingin menghapus <b>{itemName}</b> dari daftar? Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="flex justify-center gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Batal</button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Hapus
                    </button>
                </div>
            </div>
        </Modal>
    );
}


const EditItemModal = ({
    isOpen, onClose, onConfirm, isSubmitting, initialData
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (payload: any) => void,
    isSubmitting: boolean,
    initialData: ISendDetail | null
}) => {
    const [bruto, setBruto] = useState<number | ''>('');
    const [kadar, setKadar] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen && initialData) {
            setBruto(Number(initialData.bruto));
            setKadar(Number(initialData.kadar));
        } else if (!isOpen) {
            setBruto('');
            setKadar('');
        }
    }, [isOpen, initialData]);

    const calculatedNetto = useMemo(() => {
        if (
            bruto === '' ||
            kadar === '' ||
            isNaN(Number(bruto)) ||
            isNaN(Number(kadar))
        ) {
            return 0;
        }
        return Number(bruto) * (Number(kadar) / 100);
    }, [bruto, kadar]);

    const handleSubmit = () => {
        if (bruto === '' || kadar === '') {
            toast.error("Bruto dan Kadar wajib diisi.");
            return;
        }

        if (calculatedNetto <= 0) {
            toast.error("Netto tidak valid (harus lebih dari 0).");
            return;
        }

        onConfirm({
            netto: calculatedNetto,
            bruto: Number(bruto),
            kadar: Number(kadar)
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                        Edit Rongsok
                    </h3>
                    <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Info Barang (Read Only) */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                        <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Nama Barang</span>
                        <span className="text-gray-800 font-medium">{initialData?.name_item || '-'}</span>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bruto (Gr)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                value={bruto}
                                onChange={(e) => setBruto(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                                disabled={isSubmitting}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kadar (%)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                value={kadar}
                                onChange={(e) => setKadar(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                                disabled={isSubmitting}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Netto (Gr)</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-gray-50 focus:outline-none cursor-not-allowed text-gray-500"
                            value={calculatedNetto.toFixed(2)}
                            readOnly
                            placeholder="0"
                            disabled={true}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </Modal>
    );
};
