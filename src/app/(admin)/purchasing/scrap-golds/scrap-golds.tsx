"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import _ from "lodash";
import axios from "axios";
import {
    FaEdit, FaEye, FaFileExport, FaCheckCircle,
    FaBoxOpen, FaClipboardCheck
} from "react-icons/fa";
import { Loader2, X, Search, Plus, Info, Download } from "lucide-react";
import Table from "@/components/tables/Table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from '@/components/ui/modal';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";

interface IScrapSource {
    id: number;
    name: string;
    email: string;
}

interface IScrapDetail {
    id: number;
    scrap_gold_id: string;
    item_id: string;
    no_scrap_gold: string;
    name_item: string;
    bruto: string | number;
    kadar: string | number;
    netto: string | number;
}

interface IScrapGoldTransaction {
    id: number;
    staff_id: string;
    no_scrap_gold: string;
    date: string;
    notes: string;
    processed_date: string | null;
    status: "1" | "2" | string;
    created_at: string;
    updated_at: string;
    source?: IScrapSource;
    details?: IScrapDetail[];
}

interface ICountStats {
    new: number;
    processed: number;
}

export default function ScrapGoldsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [data, setData] = useState<IScrapGoldTransaction[]>([]);
    const [stats, setStats] = useState<ICountStats>({ new: 0, processed: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [totalRecord, setTotalRecord] = useState(0);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [processDate, setProcessDate] = useState(moment().format('YYYY-MM-DD'));
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const page = searchParams.get("page") || currentPage;
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            per_page: perPageParam,
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("purchase/scrap-gold"), true, params);
            const result = response.data.data;

            setData(result.data);
            setStats(result.count);

            setTotalRecord(result.page_info.total_record);
            setLastPage(result.page_info.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data rongsok.");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, searchTerm, statusFilter]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleFilterStatus = (status: string) => {
        if (statusFilter === status) {
            setStatusFilter('');
        } else {
            setStatusFilter(status);
        }
        setCurrentPage(1);
    };

    const calculateTotal = (items: IScrapDetail[] | undefined, field: 'bruto' | 'netto') => {
        if (!items || items.length === 0) return 0;
        return _.sumBy(items, (item) => Number(item[field]));
    };

    const formatGram = (val: number) => val.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + " Gr";

    const handleOpenProcessModal = (id: number) => {
        setSelectedId(id);
        setProcessDate(moment().format('YYYY-MM-DD'));
        setViewingMonthDate(new Date());
        setIsProcessModalOpen(true);
    };

    const handleProcessSubmit = async () => {
        if (!selectedId) return;
        setIsProcessing(true);
        try {
            const payload = { processed_date: processDate };
            await httpPost(endpointUrl(`purchase/scrap-gold/${selectedId}/process`), payload, true);

            toast.success("Status berhasil diubah menjadi Diproses!");
            setIsProcessModalOpen(false);
            getData();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExport = async (id: number, no_doc: string) => {
        setIsExporting(true);
        try {
            const response = await axios.get(endpointUrl(`purchase/scrap-gold/${id}/export`), {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `Rongsok_${no_doc}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Berhasil mengunduh laporan.");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Gagal melakukan export PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: IScrapGoldTransaction }) => {
                const isNew = row.status === "1";
                const isProcessed = row.status === "2";

                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/purchasing/scrap-golds/${row.id}`)}
                            title="Lihat Detail"
                            className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <FaEye className="w-4 h-4" />
                        </button>

                        {isNew && (
                            <>
                                <button
                                    onClick={() => router.push(`/purchasing/scrap-golds/edit/${row.id}`)}
                                    title="Edit Data"
                                    className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                    <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenProcessModal(row.id)}
                                    title="Proses (Selesaikan)"
                                    className="flex items-center gap-1 px-3 py-2 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-semibold"
                                >
                                    <FaCheckCircle className="w-3.5 h-3.5" />
                                    Proses
                                </button>
                            </>
                        )}

                        {isProcessed && (
                            <button
                                onClick={() => handleExport(row.id, row.no_scrap_gold)}
                                disabled={isExporting}
                                title="Export PDF"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                                bg-gradient-to-r from-blue-500 to-indigo-600 
                                text-white text-xs font-medium shadow-md hover:shadow-lg 
                                hover:from-blue-600 hover:to-indigo-700 
                                transition-all duration-200"
                            >
                                {isExporting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> :  <Download className="w-3.5 h-3.5" />}
                                Export
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            id: "no_scrap_gold",
            header: "No. Rongsok",
            accessorKey: "no_scrap_gold",
            cell: ({ row }: { row: any }) => <span className="font-semibold text-gray-700">{row.no_scrap_gold}</span>
        },
        {
            id: "date",
            header: "Tanggal",
            accessorKey: "date",
            cell: ({ row }: { row: any }) => <span>{moment(row.date).format("DD MMM YYYY")}</span>
        },
        {
            id: "source",
            header: "Sumber",
            cell: ({ row }: { row: IScrapGoldTransaction }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{row.source?.name || "-"}</span>
                    <span className="text-xs text-gray-400">{row.source?.email}</span>
                </div>
            )
        },
        {
            id: "notes",
            header: "Keterangan",
            accessorKey: "notes",
            cell: ({ row }: { row: any }) => <span className="text-sm text-gray-500 italic truncate max-w-[150px] block">{row.notes || "-"}</span>
        },
        {
            id: "total_items",
            header: "Item",
            cell: ({ row }: { row: IScrapGoldTransaction }) => (
                <span className="font-semibold text-gray-700"> {row.details?.length || 0} Item</span>
            )
        },
        {
            id: "bruto",
            header: "Total Bruto",
            cell: ({ row }: { row: IScrapGoldTransaction }) => (
                <span className="font-medium">{formatGram(calculateTotal(row.details, 'bruto'))}</span>
            )
        },
        {
            id: "netto",
            header: "Total Netto",
            cell: ({ row }: { row: IScrapGoldTransaction }) => (
                <span className="font-bold text-blue-600">{formatGram(calculateTotal(row.details, 'netto'))}</span>
            )
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }: { row: IScrapGoldTransaction }) => {
                if (row.status === "1") return <Badge color="warning">Baru</Badge>;
                if (row.status === "2") return <Badge color="success">Diproses</Badge>;
                return <Badge color="info">Unknown</Badge>;
            }
        },
    ], [isExporting]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col justify-center">
                    <h1 className="text-2xl font-bold text-gray-800">Data Rongsok</h1>
                    <p className="text-gray-500 text-sm">Kelola penerimaan emas rongsok</p>
                </div>

                <div
                    onClick={() => handleFilterStatus('1')}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-400 flex items-center justify-between cursor-pointer transition-all hover:shadow-md
                    ${statusFilter === '1' ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'border-gray-100'}`}
                >
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Status Baru</p>
                        <h2 className="text-2xl font-bold text-gray-800 mt-1">{stats.new}</h2>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-full">
                        <FaBoxOpen className="w-6 h-6" />
                    </div>
                </div>

                <div
                    onClick={() => handleFilterStatus('2')}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-emerald-400 flex items-center justify-between cursor-pointer transition-all hover:shadow-md
                    ${statusFilter === '2' ? 'ring-2 ring-emerald-400 bg-emerald-50' : 'border-gray-100'}`}
                >
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Diproses</p>
                        <h2 className="text-2xl font-bold text-gray-800 mt-1">{stats.processed}</h2>
                    </div>
                    <div className="p-3 rounded-full bg-gray-50">
                        <FaClipboardCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />

                    <button
                        onClick={() => router.push("/purchasing/scrap-golds/create")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Rongsok
                    </button>
                </div>
            </div>

            <Table
                data={data}
                columns={columns}
                pagination={true}
                lastPage={lastPage}
                total={totalRecord}
                loading={isLoading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />

            <ProcessModal
                isOpen={isProcessModalOpen}
                onClose={() => setIsProcessModalOpen(false)}
                onConfirm={handleProcessSubmit}
                isProcessing={isProcessing}
                dateValue={processDate}
                onDateChange={setProcessDate}
                viewingMonthDate={viewingMonthDate}
                onMonthChange={setViewingMonthDate}
            />
        </div>
    );
}

const ProcessModal = ({
    isOpen, onClose, onConfirm, isProcessing,
    dateValue, onDateChange,
    viewingMonthDate, onMonthChange
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isProcessing: boolean,
    dateValue: string,
    onDateChange: (val: string) => void,
    viewingMonthDate: Date,
    onMonthChange: (date: Date) => void
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    <Info className="text-emerald-500 text-4xl" />
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Proses Rongsok?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Anda akan mengubah status data ini menjadi <b>Diproses</b>.
                        Pastikan data fisik rongsok sudah diterima.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block font-medium mb-1 text-sm text-gray-700">
                        Tanggal Proses <span className="text-red-400">*</span>
                    </label>
                    <SingleDatePicker
                        placeholderText="Pilih Tanggal Proses"
                        selectedDate={dateValue ? new Date(dateValue) : null}
                        onChange={(date: any) => onDateChange(moment(date).format('YYYY-MM-DD'))}
                        onClearFilter={() => onDateChange('')}
                        viewingMonthDate={viewingMonthDate}
                        onMonthChange={onMonthChange}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-2 rounded-md border text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="px-6 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing && <Loader2 className="animate-spin w-4 h-4" />}
                        {isProcessing ? "Memproses..." : "Ya, Proses"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};