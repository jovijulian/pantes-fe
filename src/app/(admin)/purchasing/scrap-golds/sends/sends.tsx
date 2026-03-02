"use client";

import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import _ from "lodash";
import axios from "axios";
import {
    FaEdit, FaEye, FaFileExport, FaCheckCircle,
    FaBoxOpen, FaClipboardCheck, FaTruck, FaWarehouse, FaIndustry, FaStore, FaDolly, FaArrowRight
} from "react-icons/fa";
import { Loader2, Calendar as CalendarIcon, X, Search, Plus, Info, Download } from "lucide-react";

import Table from "@/components/tables/Table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from '@/components/ui/modal';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";

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
}

interface ISendTransaction {
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
    details?: ISendDetail[];
}

interface ICountStats {
    new: number;
    send: number;
    receipt: number;
    stock: number;
}

interface ICountPurpose {
    "gudang": number;
    "supplier": number;
    "vendor": number;
}

export default function ScrapGoldSendPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [data, setData] = useState<ISendTransaction[]>([]);
    const [stats, setStats] = useState<ICountStats>({ new: 0, send: 0, receipt: 0, stock: 0 });
    const [purposeStats, setPurposeStats] = useState<ICountPurpose>({ "gudang": 0, "supplier": 0, "vendor": 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [purposeFilter, setPurposeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [totalRecord, setTotalRecord] = useState(0);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [nextStatus, setNextStatus] = useState<number | null>(null);
    const [processDate, setProcessDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const page = searchParams.get("page") || currentPage;
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(purposeFilter ? { type_purpose: purposeFilter } : {}),
            per_page: perPageParam,
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("purchase/scrap-gold/send"), true, params);
            const result = response.data.data;

            setData(result.data);
            setStats(result.count);
            setPurposeStats(result.count_purpose);

            setTotalRecord(result.page_info.total_record);
            setLastPage(result.page_info.total_pages);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data kirim rongsok.");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, searchTerm, statusFilter, purposeFilter]);


    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleFilterStatus = (status: string) => {
        if (statusFilter === status) {
            setStatusFilter('');
            setPurposeFilter('');
        } else {
            setStatusFilter(status);
            setPurposeFilter('');
        }
        setCurrentPage(1);
    };

    const handleFilterPurpose = (type: string) => {
        if (purposeFilter === type) {
            setPurposeFilter('');
        } else {
            setPurposeFilter(type);
        }
        setCurrentPage(1);
    };

    const calculateTotal = (items: ISendDetail[] | undefined, field: 'bruto' | 'netto') => {
        if (!items || items.length === 0) return 0;
        return _.sumBy(items, (item) => Number(item[field]));
    };

    const formatGram = (val: number) => val.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + " Gr";

    const getPurposeName = (row: ISendTransaction) => {
        if (row.type_purpose === "1") return "Gudang CT";
        if (row.type_purpose === "2") return row.supplier?.name || "Supplier Unknown";
        if (row.type_purpose === "3") return row.vendor?.name || "Vendor Unknown";
        return "-";
    };

    const handleOpenProcessModal = (id: number, targetStatus: number) => {
        setSelectedId(id);
        setNextStatus(targetStatus);
        setProcessDate(moment().format('YYYY-MM-DD'));
        setViewingMonthDate(new Date());
        setIsProcessModalOpen(true);
    };

    const handleProcessSubmit = async () => {
        if (!selectedId || !nextStatus) return;
        setIsProcessing(true);
        try {
            const payload: any = {
                status: nextStatus,
                receipt_date: null
            };

            if (nextStatus === 3) {
                payload.receipt_date = processDate;
            }

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${selectedId}/change-status`), payload, true);

            toast.success("Status berhasil diupdate!");
            setIsProcessModalOpen(false);
            getData();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsProcessing(false);
        }
    };



    const handleExport = async (id: number) => {
        setIsExporting(true);

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
            setIsExporting(false);
        }
    };

    const handleExportReceipt = async (id: number) => {
        setIsExporting(true);

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
            setIsExporting(false);
        }
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            cell: ({ row }: { row: ISendTransaction }) => {
                const currentStatus = row.status;

                return (
                    <div className="flex flex-col gap-2">
                        {/* Detail */}
                        <button
                            onClick={() => {
                                // router.push(`/purchasing/scrap-golds/sends/${row.id}`)
                                window.open(`/purchasing/scrap-golds/sends/${row.id}`, "_blank");
                            }}
                            title="Lihat Detail"
                            className="flex items-center justify-center h-9 w-full rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <FaEye className="w-4 h-4 mr-1" />
                        </button>

                        {/* Status 1 -> Kirim */}
                        {/* {currentStatus === "1" && (
                            <button
                                onClick={() => handleOpenProcessModal(row.id, 2)}
                                className="flex items-center justify-center h-9 w-full rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
                            >
                                Kirim
                            </button>
                        )} */}

                        {/* Status 2 -> Terima */}
                        {/* {currentStatus === "2" && (
                            <button
                                onClick={() => handleOpenProcessModal(row.id, 3)}
                                className="flex items-center justify-center h-9 w-full rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                            >
                                Terima
                            </button>
                        )} */}

                        {/* Status 3 -> Stock */}
                        {/* {currentStatus === "3" && (
                            <button
                                onClick={() => handleOpenProcessModal(row.id, 4)}
                                className="flex items-center justify-center h-9 w-full rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 text-xs font-semibold transition-colors"
                            >
                                Stock
                            </button>
                        )} */}

                        {/* Export Surat Kirim (Status 2 & 3) */}
                        {/* {(currentStatus === "2" || currentStatus === "3") && (
                            <button
                                onClick={() => handleExport(row.id)}
                                disabled={isExporting}
                                className="flex items-center justify-center gap-1.5 h-9 w-full rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export Surat Jalan
                            </button>
                        )} */}

                        {/* Status 4 -> 2 Export */}
                        {/* {currentStatus === "4" && (
                            <>
                                <button
                                    onClick={() => handleExport(row.id)}
                                    disabled={isExporting}
                                    className="flex items-center justify-center gap-1.5 h-9 w-full rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export Surat Jalan
                                </button>

                                <button
                                    onClick={() => handleExportReceipt(row.id)}
                                    disabled={isExporting}
                                    className="flex items-center justify-center gap-1.5 h-9 w-full rounded-md bg-indigo-600 text-white text-xs font-medium shadow-sm hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export Surat Terima Stock
                                </button>
                            </>
                        )} */}
                    </div>
                );
            },

        },
        {
            id: "no_scrap_gold_send",
            header: "No. Dokumen",
            accessorKey: "no_scrap_gold_send",
            cell: ({ row }: { row: any }) => <span className="font-semibold text-gray-700">{row.no_scrap_gold_send}</span>
        },
        {
            id: "date",
            header: "Tanggal",
            accessorKey: "date",
            cell: ({ row }: { row: any }) => <span>{moment(row.date).format("DD MMM YYYY")}</span>
        },
        {
            id: "tujuan",
            header: "Tujuan Kirim",
            cell: ({ row }: { row: ISendTransaction }) => {
                const name = getPurposeName(row);
                let sub = "";
                if (row.type_purpose === "1") sub = "Gudang";
                if (row.type_purpose === "2") sub = "Supplier";
                if (row.type_purpose === "3") sub = "External Vendor";

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{name}</span>
                        <span className="text-xs text-gray-400">{sub}</span>
                    </div>
                )
            }
        },
        {
            id: "expedition",
            header: "Ekspedisi",
            cell: ({ row }: { row: ISendTransaction }) => (
                <span className="text-gray-600">{row.expedition?.name || "-"}</span>
            )
        },
        {
            id: "total_items",
            header: "Item",
            cell: ({ row }: { row: ISendTransaction }) => (
                <span className="font-semibold text-gray-700"> {row.details?.length || 0} Item</span>
            )
        },
        {
            id: "bruto",
            header: "Total Bruto",
            cell: ({ row }: { row: ISendTransaction }) => (
                <span className="font-medium">{formatGram(calculateTotal(row.details, 'bruto'))}</span>
            )
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }: { row: ISendTransaction }) => {
                if (row.status === "1") return <Badge color="warning">New</Badge>;
                if (row.status === "2") return <Badge color="info">Dikirim</Badge>;
                if (row.status === "3") return <Badge color="success">Diterima</Badge>;
                if (row.status === "4") return <Badge color="primary">Stock</Badge>;
                return <Badge color="info">Unknown</Badge>;
            }
        },
    ], [isExporting]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-800">Data Kirim Rongsok</h1>
                <p className="text-gray-500 text-sm">Monitor pengiriman rongsok ke Gudang, Supplier, atau Vendor.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FilterCard
                    label=" New"
                    count={stats.new}
                    isActive={statusFilter === '1'}
                    onClick={() => handleFilterStatus('1')}
                    color="yellow"
                    icon={<FaBoxOpen className="w-5 h-5" />}
                />
                <FilterCard
                    label=" Kirim"
                    count={stats.send}
                    isActive={statusFilter === '2'}
                    onClick={() => handleFilterStatus('2')}
                    color="blue"
                    icon={<FaTruck className="w-5 h-5" />}
                />
                <FilterCard
                    label=" Terima"
                    count={stats.receipt}
                    isActive={statusFilter === '3'}
                    onClick={() => handleFilterStatus('3')}
                    color="emerald"
                    icon={<FaClipboardCheck className="w-5 h-5" />}
                />
                <FilterCard
                    label=" Stock"
                    count={stats.stock}
                    isActive={statusFilter === '4'}
                    onClick={() => handleFilterStatus('4')}
                    color="gray"
                    icon={<FaDolly className="w-5 h-5" />}
                />
            </div>

            {statusFilter && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Filter Berdasarkan Tujuan:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FilterCard
                            label="Gudang"
                            count={purposeStats["gudang"]}
                            isActive={purposeFilter === '1'}
                            onClick={() => handleFilterPurpose('1')}
                            color="indigo"
                            icon={<FaWarehouse className="w-4 h-4" />}
                            compact
                        />
                        <FilterCard
                            label="Supplier"
                            count={purposeStats["supplier"]}
                            isActive={purposeFilter === '2'}
                            onClick={() => handleFilterPurpose('2')}
                            color="purple"
                            icon={<FaStore className="w-4 h-4" />}
                            compact
                        />
                        <FilterCard
                            label="Vendor / Pabrik"
                            count={purposeStats["vendor"]}
                            isActive={purposeFilter === '3'}
                            onClick={() => handleFilterPurpose('3')}
                            color="orange"
                            icon={<FaIndustry className="w-4 h-4" />}
                            compact
                        />
                    </div>
                </div>
            )}

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
                        onClick={() => router.push("/purchasing/scrap-golds/sends/create")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Kirim Rongsok
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
            </div>

            <ProcessModal
                isOpen={isProcessModalOpen}
                onClose={() => setIsProcessModalOpen(false)}
                onConfirm={handleProcessSubmit}
                isProcessing={isProcessing}
                dateValue={processDate}
                onDateChange={setProcessDate}
                viewingMonthDate={viewingMonthDate}
                onMonthChange={setViewingMonthDate}
                nextStatus={nextStatus}
            />
        </div>
    );
}


const FilterCard = ({ label, count, isActive, onClick, color, icon, compact = false }: any) => {
    const colorClasses: any = {
        yellow: "border-l-yellow-400 ring-yellow-400 bg-yellow-50 text-yellow-600",
        blue: "border-l-blue-400 ring-blue-400 bg-blue-50 text-blue-600",
        emerald: "border-l-emerald-400 ring-emerald-400 bg-emerald-50 text-emerald-600",
        gray: "border-l-gray-400 ring-gray-400 bg-gray-50 text-gray-600",
        indigo: "border-l-indigo-400 ring-indigo-400 bg-indigo-50 text-indigo-600",
        purple: "border-l-purple-400 ring-purple-400 bg-purple-50 text-purple-600",
        orange: "border-l-orange-400 ring-orange-400 bg-orange-50 text-orange-600",
    };

    const activeClass = isActive ? `ring-2 ${colorClasses[color]}` : "border-gray-100 bg-white hover:bg-gray-50";

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl border border-l-4 shadow-sm transition-all duration-200 p-4 flex items-center justify-between ${activeClass} ${colorClasses[color].split(' ')[0]}`}
        >
            <div>
                <p className={`text-gray-500 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{label}</p>
                <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mt-1`}>{count}</h2>
            </div>
            <div className={`p-3 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-50'}`}>
                {icon}
            </div>
        </div>
    )
}

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
                    desc: "Barang akan dimasukkan kembali ke STOCK. Pastikan fisik barang sudah kembali.",
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