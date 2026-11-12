"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import axios from "axios";
import {
    Loader2, Calendar, Info, Building, Truck, UserCheck,
    DollarSign, FileText, Package, PackagePlus, Edit, Trash2, Check, Download
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import _ from "lodash";
import AddRefiningFinishedGoodModal from "@/components/modal/scrap-gold/AddRefiningFinishedGoodModal";
import EditRefiningFinishedGoodModal, {
    IFinishedGoodItem,
} from "@/components/modal/scrap-gold/EditRefiningFinishedGoodModal";
import DeleteConfirmationModal from "@/components/modal/deactive/DeleteItemWorkOrderConfirmationModal";
import ChangeStatusRefiningModal from "@/components/modal/scrap-gold/ChangeStatusRefiningModal";
import ChangeStatusRefiningDoneModal from "@/components/modal/scrap-gold/ChangeStatusRefiningDoneModal";

interface IPartner {
    id: number;
    name: string;
    email?: string;
    code?: string;
}

interface IExpedition {
    id: number;
    code: string;
    name: string;
}

export interface IRefiningDetailRongsok {
    id: number;
    scrap_gold_refining_id?: number;
    scrap_gold_send_id?: number;
    no_scrap_gold_send?: string;
    expedition_id?: number;
    type_purpose?: string | number;
    supplier_id?: number | null;
    vendor_id?: number | null;
    notes?: string | null;
    date?: string;
    receipt_date?: string | null;
    status?: string | number;
    created_by?: any;
    created_at?: string;
    updated_at?: string;
    pcs?: number | string;
    total_bruto?: number | string;
    total_netto?: number | string;
    name_item?: string;
    code?: string;
    bruto?: string | number;
    kadar?: string | number;
    netto?: string | number;
}

export interface IFinishedGood {
    id: number;
    item_id: number;
    netto: string | number;
    sg: string | number;
    scope: string | number;
    xray: string | number;
    item_type?: string;
    name_item?: string;
    code_item?: string;
    item?: {
        id?: number;
        name?: string;
        name_item?: string;
        code?: string;
    };
}

export interface IRefiningDetailData {
    id: number;
    expedition_id: number;
    type_purpose: number | string;
    supplier_id: number | null;
    vendor_id: number | null;
    no_scrap_gold_refining: string;
    date: string;
    receipt_date: string | null;
    complete_date?: string | null;
    notes: string | null;
    susut_bruto: string | number;
    susut_netto: string | number;
    ongkos_bruto: string | number;
    ongkos_netto: string | number;
    tambah_bruto: string | number;
    tambah_netto: string | number;
    status: number | string;
    created_at: string;
    updated_at: string;
    created_by?: IPartner | null;
    expedition?: IExpedition | null;
    supplier?: IPartner | null;
    vendor?: IPartner | null;
    details: IRefiningDetailRongsok[];
    items_finished_good: IFinishedGood[];
}

export default function RefiningDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');

    const [data, setData] = useState<IRefiningDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>("null");

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IFinishedGood | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Status change states
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

    // Export states
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);

    const formatGram = (value: string | number | null | undefined): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " Gr";
    };

    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMMM YYYY');
    };

    const getStatusBadge = (status: number | string | undefined) => {
        switch (String(status)) {
            case '1':
                return <Badge color="warning">New</Badge>;
            case '2':
                return <Badge color="success">Diterima</Badge>;
            case '3':
                return <Badge color="primary">Selesai</Badge>;
            default:
                return <Badge color="warning">Unknown</Badge>;
        }
    };

    const getPurposeName = (item: IRefiningDetailData) => {
        const type = String(item.type_purpose);
        if (type === "1") return "Gudang CT";
        if (type === "2") return item.supplier?.name || "Supplier";
        if (type === "3") return item.vendor?.name || "Vendor / Pabrik";
        return "-";
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/scrap-gold/refining/${id}`), true);
            const resData = response.data?.data;
            if (resData) {
                if (!resData.details) resData.details = [];
                if (!resData.items_finished_good) resData.items_finished_good = [];
                setData(resData);
            }
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Surat Jalan tidak ditemukan.");
                router.push('/purchasing/scrap-golds/refining');
            } else {
                toast.error(error.response?.data?.message || "Gagal mengambil detail Surat Jalan.");
            }
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(storedRole);
        }
    }, [getDetail]);

    // Totals
    const totalBrutoRongsok = useMemo(() => {
        return _.sumBy(data?.details || [], (d) => Number(d.total_bruto ?? d.bruto ?? 0));
    }, [data?.details]);

    const totalNettoRongsok = useMemo(() => {
        return _.sumBy(data?.details || [], (d) => Number(d.total_netto ?? d.netto ?? 0));
    }, [data?.details]);

    const totalPcsRongsok = useMemo(() => {
        return _.sumBy(data?.details || [], (d) => Number(d.pcs || 0));
    }, [data?.details]);

    const totalNettoFinishedGood = useMemo(() => {
        return _.sumBy(data?.items_finished_good || [], (d) => Number(d.netto || 0));
    }, [data?.items_finished_good]);

    const totalAkhirBruto = useMemo(() => {
        const val =
            totalBrutoRongsok -
            Number(data?.susut_bruto || 0) -
            Number(data?.ongkos_bruto || 0) +
            Number(data?.tambah_bruto || 0);
        return Number(val.toFixed(3));
    }, [totalBrutoRongsok, data?.susut_bruto, data?.ongkos_bruto, data?.tambah_bruto]);

    const totalAkhirNetto = useMemo(() => {
        const val =
            totalNettoRongsok -
            Number(data?.susut_netto || 0) -
            Number(data?.ongkos_netto || 0) +
            Number(data?.tambah_netto || 0);
        return Number(val.toFixed(3));
    }, [totalNettoRongsok, data?.susut_netto, data?.ongkos_netto, data?.tambah_netto]);

    // Edit item handler
    const handleOpenEdit = (item: IFinishedGood) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    // Delete item handler
    const handleOpenDelete = (item: IFinishedGood) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem || !data) return;

        setIsDeleting(true);
        const payload = {
            items_finished_good_id: selectedItem.id,
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${data.id}/delete-item-finished-good`),
                payload,
                true
            );
            toast.success("Barang berhasil dihapus.");
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            getDetail();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal menghapus barang.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenReceiptModal = () => {
        setIsReceiptModalOpen(true);
    };

    const handleConfirmReceipt = async (receiptDate: string) => {
        if (!data) return;
        setIsSubmittingStatus(true);
        const payload = {
            status: 2,
            receipt_date: receiptDate,
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${data.id}/change-status`),
                payload,
                true
            );
            toast.success("Surat Jalan berhasil ditandai 'Diterima'!");
            setIsReceiptModalOpen(false);
            getDetail();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal mengubah status Surat Jalan.");
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    const handleOpenDoneModal = () => {
        setIsDoneModalOpen(true);
    };

    const handleConfirmDone = async (completedDate: string) => {
        if (!data) return;
        setIsSubmittingStatus(true);
        const payload = {
            status: 3,
            complete_date: completedDate,
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${data.id}/change-status`),
                payload,
                true
            );
            toast.success("Surat Jalan berhasil ditandai 'Selesai'!");
            setIsDoneModalOpen(false);
            getDetail();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal menyelesaikan Surat Jalan.");
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(
                endpointUrl(`purchase/scrap-gold/refining/${data.id}/export`),
                {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];

            let filename = `surat_jalan_refining-${moment().format("YYYY-MM-DD")}.pdf`;

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
            toast.error("Gagal mengunduh laporan Surat Jalan. Silakan coba lagi nanti.");
        } finally {
            setIsDownloadLoading(false);
        }
    };

    const handleExportReceiptItem = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(
                endpointUrl(`purchase/scrap-gold/refining/${data.id}/export-item`),
                {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];

            let filename = `barang_diterima_refining-${moment().format("YYYY-MM-DD")}.pdf`;

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
            toast.error("Gagal mengunduh laporan barang diterima. Silakan coba lagi nanti.");
        } finally {
            setIsDownloadLoading(false);
        }
    };

    const getItemDisplayName = (item: IFinishedGood): string => {
        return (
            item.name_item ||
            item.item?.name_item ||
            item.item?.name ||
            item.item_type ||
            (item.item_id ? `Item #${item.item_id}` : "-")
        );
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail Surat Jalan...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau Surat Jalan tidak ditemukan.</p>
            <button onClick={() => router.push('/purchasing/scrap-golds/refining')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );

    return (
        <>
            <ComponentCard title="Detail Surat Jalan">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">Surat Jalan</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_scrap_gold_refining}</h1>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        {getStatusBadge(data.status)}
                        <div className="relative inline-block text-left">
                            <button
                                type="button"
                                disabled={isDownloadLoading}
                                onClick={() => setIsExportOpen(!isExportOpen)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isExportOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isExportOpen && (
                                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                handleExport();
                                                setIsExportOpen(false);
                                            }}
                                            className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                                        >
                                            <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                            Export Surat Jalan
                                        </button>

                                        {(String(data.status) === "2" || String(data.status) === "3") && (
                                            <>
                                                <div className="my-2 border-t border-gray-100" />
                                                <button
                                                    onClick={() => {
                                                        handleExportReceiptItem();
                                                        setIsExportOpen(false);
                                                    }}
                                                    className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-150"
                                                >
                                                    <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                                    Export Barang Diterima
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<Building />} label={Number(data.type_purpose) === 1 ? "Tujuan" : (Number(data.type_purpose) === 2 ? "Supplier" : "Vendor")} value={getPurposeName(data)} />
                    <DetailItem icon={<Truck />} label="Ekspedisi" value={data.expedition?.name || "-"} />
                    <DetailItem icon={<Calendar />} label="Tanggal Surat Jalan" value={formatDate(data.date)} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by?.name || "-"} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Detail Total" icon={<DollarSign />}>
                            <InfoRow label="Total Berat Rongsok" value={formatGram(totalBrutoRongsok)} />
                            <InfoRow label="Total Netto Rongsok" value={formatGram(totalNettoRongsok)} />
                            <InfoRow
                                label="Susut"
                                value={`Bruto: ${formatGram(data.susut_bruto)} | Netto: ${formatGram(data.susut_netto)}`}
                            />
                            <InfoRow
                                label="Ongkos"
                                value={`Bruto: ${formatGram(data.ongkos_bruto)} | Netto: ${formatGram(data.ongkos_netto)}`}
                            />
                            <InfoRow
                                label="Penambahan"
                                value={`Bruto: ${formatGram(data.tambah_bruto)} | Netto: ${formatGram(data.tambah_netto)}`}
                            />
                            <InfoRow
                                label="Total Akhir Proses"
                                value={`Bruto: ${formatGram(totalAkhirBruto)} | Netto: ${formatGram(totalAkhirNetto)}`}
                                isTotal
                            />
                        </Section>

                        <Section title="Daftar Kirim Rongsok" icon={<FileText />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Kirim Rongsok</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pcs</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.details.length === 0 && (
                                            <tr><td colSpan={5} className="text-center p-3 italic text-gray-500">Tidak ada data kirim rongsok terlampir.</td></tr>
                                        )}
                                        {data.details.map((detail, idx) => (
                                            <tr key={detail.id || idx}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <a
                                                        href={`/purchasing/scrap-golds/sends/${detail.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:cursor-pointer hover:underline"
                                                    >
                                                        {detail.no_scrap_gold_send || "-"}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(detail.date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium">
                                                    {Number(detail.pcs || 0).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                                                    {formatGram(detail.total_bruto ?? detail.bruto)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-800">
                                                    {formatGram(detail.total_netto ?? detail.netto)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-left text-sm font-bold uppercase">Total</td>
                                            <td className="px-4 py-3 text-center text-sm font-bold">{totalPcsRongsok.toLocaleString('id-ID')} pcs</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatGram(totalBrutoRongsok)}</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatGram(totalNettoRongsok)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Section>

                        <Section title="Data Barang Diterima" icon={<Package />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.items_finished_good.length === 0 && (
                                            <tr><td colSpan={6} className="text-center p-3 italic text-gray-500">Belum ada barang yang ditambahkan.</td></tr>
                                        )}
                                        {data.items_finished_good.map((item) => (
                                            <tr key={item.id}>
                                                {role !== "5" && (
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            {String(data.status) !== "3" && (
                                                                <button
                                                                    onClick={() => handleOpenDelete(item)}
                                                                    className="p-1 text-red-600 hover:bg-red-100 rounded" title="Hapus">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{getItemDisplayName(item)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">{formatGram(item.netto)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.sg ?? 0}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.scope ?? 0}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.xray ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-left text-sm font-bold uppercase">Total </td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatGram(totalNettoFinishedGood)}</td>
                                            <td colSpan={3}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                <Info /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat" value={formatDate(data.created_at)} />
                                <InfoRow label="Tanggal Surat Jalan" value={formatDate(data.date)} />
                                <InfoRow label="Tanggal Diterima" value={formatDate(data.receipt_date)} />
                                <InfoRow label="Tanggal Surat Jalan Selesai" value={formatDate(data.complete_date || (String(data.status) === '3' ? data.updated_at : null))} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {String(data.status) === "1" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
                            onClick={handleOpenReceiptModal}
                        >
                            <Check className="w-4 h-4" />
                            Tandai Diterima
                        </button>
                    )}

                    {String(data.status) === "2" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1.5"
                                onClick={() => setIsAddModalOpen(true)}
                                title="Tambah Barang"
                            >
                                <PackagePlus className="w-4 h-4" />
                                Tambahkan Barang
                            </button>
                            <button
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                                onClick={handleOpenDoneModal}
                            >
                                <Check className="w-4 h-4" />
                                Surat Jalan Selesai
                            </button>
                        </>
                    )}
                </div>
            </ComponentCard>

            {/* Modal Tambah Barang Jadi */}
            <AddRefiningFinishedGoodModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                refiningId={data.id}
                details={data.details || []}
                initialSusutBruto={data.susut_bruto}
                initialSusutNetto={data.susut_netto}
                initialOngkosBruto={data.ongkos_bruto}
                initialOngkosNetto={data.ongkos_netto}
                initialTambahBruto={data.tambah_bruto}
                initialTambahNetto={data.tambah_netto}
                onSuccess={getDetail}
            />

            {/* Modal Edit Barang Jadi */}
            <EditRefiningFinishedGoodModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                }}
                refiningId={data.id}
                itemToEdit={selectedItem}
                status={data.status}
                onSuccess={getDetail}
            />

            {/* Modal Konfirmasi Hapus Barang Jadi */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedItem(null);
                }}
                onConfirm={handleConfirmDelete}
                isSubmitting={isDeleting}
                itemName={selectedItem ? getItemDisplayName(selectedItem) : "barang ini"}
            />

            {/* Modal Ganti Status -> Diterima (Status 2) */}
            {data && (
                <ChangeStatusRefiningModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    refining={{
                        id: data.id,
                        no_scrap_gold_refining: data.no_scrap_gold_refining,
                        status: data.status,
                    }}
                    isSubmitting={isSubmittingStatus}
                    onConfirm={handleConfirmReceipt}
                />
            )}

            {/* Modal Ganti Status -> Selesai (Status 3) */}
            {data && String(data.status) === "2" && (
                <ChangeStatusRefiningDoneModal
                    isOpen={isDoneModalOpen}
                    onClose={() => setIsDoneModalOpen(false)}
                    refining={{
                        id: data.id,
                        no_scrap_gold_refining: data.no_scrap_gold_refining,
                        status: data.status,
                    }}
                    isSubmitting={isSubmittingStatus}
                    onConfirm={handleConfirmDone}
                />
            )}
        </>
    );
}

// --- Helper Components (Persis sesuai work-orders/[id]/detail.tsx) ---

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            {icon} {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2 last:border-b-0 ${isTotal ? 'bg-gray-50 -mx-3 px-3' : ''}`}>
        <span className="text-gray-500 text-sm sm:text-base">{label}</span>
        <span className={`font-semibold text-gray-800 text-left sm:text-right text-sm sm:text-base ${isTotal ? 'text-lg text-blue-600' : ''}`}>
            {value || '-'}
        </span>
    </div>
);
