"use client";

import React, { useState, useMemo, useEffect } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import _ from "lodash";
import {
    FileText,
    Download,
    Loader2,
    Package,
    Banknote,
    Hash,
    Inbox,
    Send,
    Archive,
    MousePointerClick,
    FileClock,
} from "lucide-react";
import Table from "@/components/tables/Table";
import { endpointUrl, httpGet } from "@/../helpers";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FaEye } from "react-icons/fa";
import { useTableFilters } from "@/hooks/useTableFilters";

interface ICTReport {
    id?: number;
    no_order?: string;
    date?: string;
    payment_date?: string;
    nominal?: string;
    staff?: { name: string; };
    code_item?: string;
    order_date?: string;
    receipt_date?: string;
    item_type?: string;
    orderer?: string;
    weight_deposit?: string | null;
    scope?: number;
    sg?: number;
    xray?: number;
    weight?: string;
    cokim?: string;
    supplier?: any;
    pcs: string;
    total_nominal?: string;
}

export default function LMReportPage() {
    const [activeTab, setActiveTab] = useState<"1" | "2" | "3" | "4" | null>(null);
    const [reportData, setReportData] = useState<ICTReport[]>([]);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [notInvoice, setNotInvoice] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const router = useRouter();
    const DEFAULT_FILTERS = {
        page: 1,
        per_page: 20,
        search: '',
        status: ''
    };

    const { filters, setFilter } = useTableFilters(DEFAULT_FILTERS);
    useEffect(() => {
        if (activeTab) {
            fetchData(activeTab);
        }
    }, [activeTab, filters]);

    const fetchData = async (status: string) => {
        setIsLoadingReport(true);
        setReportData([]);
        try {
            let url = "";
            if (status === "1") {
                url = "report/not-received";
            } else if (status === "2") {
                url = "report/deposited";
            } else if (status === "3") {
                url = "report/stock-final";
            } else if (status === "4") {
                url = "invoice-order?is_invoice=0";
            }

            let params: any = {};
            if (status === "4") {
                params = {
                    ...(filters.search ? { search: filters.search.trim() } : {}),
                    per_page: filters.per_page,
                    page: filters.page,
                    type: 2,
                }
            } else {
                params = {
                    type: 2,
                };
            }
            const response = await httpGet(endpointUrl(url), true, params);

            if (response.data && response.data.status === 200) {
                if (status === "4") {
                    const data = response.data.data.data || [];
                    setReportData(data);
                    setNotInvoice(response.data.data.page_info.total_record);
                    setCount(response.data.data.page_info.total_record);
                    setLastPage(response.data.data.page_info.total_pages);
                } else {
                    setReportData(response.data.data || []);
                }
            } else {
                toast.error(response.data.message || "Gagal memuat laporan.");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Terjadi kesalahan saat memuat laporan.");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleExport = async () => {
        if (!activeTab || !reportData || reportData.length === 0) return;
        setIsExporting(true);

        try {
            let url = "";
            if (activeTab === "1") {
                url = "report/not-received/export";
            } else if (activeTab === "2") {
                url = "report/deposited/export";
            } else if (activeTab === "3") {
                url = "report/stock-final/export";
            }
            const response = await axios.post(
                endpointUrl(url),
                { type: 2 },
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

            let filename = `purchase_order-${moment().format("YYYY-MM-DD")}.pdf`;

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
            toast.error("Gagal mengunduh laporan. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    const summary = useMemo(() => {
        if (!reportData || reportData.length === 0) {
            return { totalData: 0, totalWeight: 0, totalNominal: 0, totalPcs: 0 };
        }
        return {
            totalData: reportData.length,
            totalWeight: _.sumBy(reportData, (item) => Number(item.weight || 0)),
            totalPcs: _.sumBy(reportData, (item) => Number(item.pcs || 0)),
            totalNominal: _.sumBy(reportData, (item) => {
                if (item.total_nominal) return Number(item.total_nominal);
                return Number(item.weight || 0) * Number(item.cokim || 0);
            })
        };
    }, [reportData]);

    const formatNumber = (val: string | number) => Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatRupiah = (val: string | number) => "Rp " + Number(val).toLocaleString('id-ID');

    const activeTabsList = [
        { id: "1", label: "Belum Terima", icon: Inbox },
        { id: "2", label: "Setor", icon: Send },
        { id: "3", label: "Stok Akhir", icon: Archive },
        { id: "4", label: "Belum Faktur", icon: FileClock },
    ] as const;

    const columns = useMemo(() => {
        if (activeTab === "1") {
            return [
                {
                    id: "code_item",
                    header: "KODE BARANG",
                    accessorKey: "code_item",
                    cell: ({ row }: { row: ICTReport }) => (
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {row.code_item || "-"}
                        </span>
                    )
                },
                {
                    id: "dates",
                    header: "Tanggal",
                    cell: ({ row }: { row: any }) => {
                        const format = (date: string) =>
                            date ? moment(date).format("DD MMM YYYY") : "-";

                        return (
                            <div className="text-sm grid grid-cols-1 gap-x-6 gap-y-1 min-w-[200px]">
                                <div className="flex gap-1">
                                    <span className="font-semibold ">Pesan:</span>
                                    <span>{format(row.order_date)}</span>
                                </div>

                                <div className="flex gap-1">
                                    <span className="font-semibold ">Surat Jalan:</span>
                                    <span>{format(row.wo_date)}</span>
                                </div>

                                <div className="flex gap-1">
                                    <span className="font-semibold ">Datang:</span>
                                    <span>{format(row.receipt_date)}</span>
                                </div>

                                <div className="flex gap-1">
                                    <span className="font-semibold ">Setor:</span>
                                    <span>{format(row.deposit_date)}</span>
                                </div>
                            </div>
                        );
                    }
                },
                {
                    id: "item_type",
                    header: "JENIS BARANG",
                    accessorKey: "item_type",
                    cell: ({ row }: { row: ICTReport }) => (
                        <span className="text-sm text-gray-600 capitalize">{row.item_type || "-"}</span>
                    )
                },
                {
                    id: "staff",
                    header: "PEMESAN",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm text-gray-600 capitalize">{row.staff?.name || "-"}</div>
                    )
                },
                {
                    id: "supplier",
                    header: "SUPPLIER",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm text-gray-700 font-medium uppercase">
                            {typeof row.supplier === 'object' ? row.supplier?.name : (row.supplier || "-")}
                        </div>
                    )
                },
                {
                    id: "weight",
                    header: "BERAT (GR)",
                    accessorKey: "weight",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm font-bold text-gray-800">{row.weight ? formatNumber(row.weight) : "0"}</div>
                    )
                },
                {
                    id: "cokim",
                    header: "COKIM",
                    accessorKey: "cokim",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm text-gray-600">{row.cokim ? formatNumber(row.cokim) : "-"}</div>
                    )
                },
                {
                    id: "pcs",
                    header: "PCS",
                    accessorKey: "pcs",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm font-bold text-gray-800">{row.pcs ? row.pcs : "0"}</div>
                    )
                },
                {
                    id: "total_nominal",
                    header: "NOMINAL",
                    accessorKey: "total_nominal",
                    cell: ({ row }: { row: ICTReport }) => (
                        <div className="text-sm font-bold text-emerald-600">{row.total_nominal ? formatRupiah(row.total_nominal) : "-"}</div>
                    )
                },
            ];
        }

        if (activeTab === "4") {
            return [
                {
                    id: "action",
                    header: "Aksi",
                    cell: ({ row }: { row: any }) => {
                        const data = row;

                        const handleClick = (e: any) => {
                            e.stopPropagation();
                            router.push(`/purchasing/orders/${data.id}`);
                        };
                        return (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleClick}
                                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                                >
                                    <FaEye className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    },
                },
                {
                    id: "no_order",
                    header: "No. Order",
                    accessorKey: "no_order",
                    cell: ({ row }: any) => (
                        <span className="font-medium">{row.no_order}</span>
                    ),
                },
                {
                    id: "name_supplier",
                    header: "Nama Supplier",
                    accessorKey: "name_supplier",
                    cell: ({ row }: any) => {
                        const data = row;
                        return (
                            <span>
                                {data?.supplier?.name}
                            </span>
                        );
                    }
                },
                {
                    id: "date",
                    header: "Tanggal",
                    cell: ({ row }: any) => (
                        <span>
                            {moment(row.date).format("DD MMM YYYY")}
                        </span>
                    ),
                },
                // 💰 DPP
                {
                    id: "dpp",
                    header: "DPP",
                    cell: ({ row }: any) => (
                        <span>
                            {formatRupiah(row.dpp_nominal)}
                        </span>
                    ),
                },
                {
                    id: "pph",
                    header: "PPH",
                    cell: ({ row }: any) => (
                        <span>
                            {formatRupiah(row.pph)}
                        </span>
                    ),
                },
                {
                    id: "nominal",
                    header: "Nominal",
                    cell: ({ row }: any) => (
                        <span>
                            {formatRupiah(row.nominal)}
                        </span>
                    ),
                },
            ];
        }

        return [
            {
                id: "code_item",
                header: "KODE BARANG",
                accessorKey: "code_item",
                cell: ({ row }: { row: ICTReport }) => (
                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {row.code_item || "-"}
                    </span>
                )
            },
            {
                id: "dates",
                header: "Tanggal",
                cell: ({ row }: { row: any }) => {
                    const format = (date: string) =>
                        date ? moment(date).format("DD MMM YYYY") : "-";

                    return (
                        <div className="text-sm grid grid-cols-1 gap-x-6 gap-y-1 min-w-[200px]">
                            <div className="flex gap-1">
                                <span className="font-semibold ">Pesan:</span>
                                <span>{format(row.order_date)}</span>
                            </div>

                            <div className="flex gap-1">
                                <span className="font-semibold ">Surat Jalan:</span>
                                <span>{format(row.wo_date)}</span>
                            </div>

                            <div className="flex gap-1">
                                <span className="font-semibold ">Datang:</span>
                                <span>{format(row.receipt_date)}</span>
                            </div>

                            <div className="flex gap-1">
                                <span className="font-semibold ">Setor:</span>
                                <span>{format(row.deposit_date)}</span>
                            </div>
                        </div>
                    );
                }
            },

            {
                id: "item_type",
                header: "JENIS BARANG",
                accessorKey: "item_type",
                cell: ({ row }: { row: ICTReport }) => (
                    <span className="text-sm text-gray-600 capitalize">{row.item_type || "-"}</span>
                )
            },
            {
                id: "orderer",
                header: "PEMESAN",
                accessorKey: "orderer",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm text-gray-600 capitalize">{row.orderer || "-"}</div>
                )
            },
            {
                id: "supplier",
                header: "SUPPLIER",
                accessorKey: "supplier",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm text-gray-700 font-medium uppercase">
                        {typeof row.supplier === 'object' ? row.supplier?.name : (row.supplier || "-")}
                    </div>
                )
            },
            {
                id: "weight",
                header: "BERAT (GR)",
                accessorKey: "weight",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm font-bold text-gray-800">{row.weight ? formatNumber(row.weight) : "0"}</div>
                )
            },
            {
                id: "pcs",
                header: "PCS",
                accessorKey: "pcs",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm font-bold text-gray-800">{row.pcs ? row.pcs : "0"}</div>
                )
            },
            {
                id: "cokim",
                header: "COKIM",
                accessorKey: "cokim",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm text-gray-600">{row.cokim ? formatNumber(row.cokim) : "-"}</div>
                )
            },
            {
                id: "total_nominal",
                header: "NOMINAL",
                accessorKey: "total_nominal",
                cell: ({ row }: { row: ICTReport }) => (
                    <div className="text-sm font-bold text-emerald-600">{row.total_nominal ? formatRupiah(row.total_nominal) : "-"}</div>
                )
            },
        ];
    }, [activeTab, router]);

    const handlePageChange = (page: number) => {
        setFilter("page", page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setFilter("per_page", newPerPage);
        setFilter("page", 1);
    };
    const clearFilters = () => {
        setFilter("search", '');
        setFilter("page", 1);
        setFilter("per_page", 20);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Laporan Status LM
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Pilih status di bawah untuk melihat laporan instan.</p>
                </div>
                {activeTab !== "4" && (
                    <button
                        onClick={handleExport}
                        disabled={isExporting || reportData.length === 0 || isLoadingReport || !activeTab}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-500" />}
                        Export PDF
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                {activeTabsList.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as "1" | "2" | "3" | "4");
                                clearFilters();
                            }}
                            disabled={isLoadingReport}
                            className={`
                                relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 outline-none
                                ${isActive
                                    ? 'bg-blue-50 border-2 border-blue-600 shadow-md text-blue-700 scale-[1.02] z-10'
                                    : 'bg-white border-2 border-gray-100 shadow-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                                }
                                ${isLoadingReport ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className={`p-4 rounded-full transition-colors ${isActive ? 'bg-blue-200/50' : 'bg-gray-50'}`}>
                                <Icon className={`w-8 h-8 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                            </div>
                            <span className="text-lg font-bold">{tab.label}</span>

                            {isActive && (
                                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {!activeTab ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px] p-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <MousePointerClick className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Pilih Status Laporan</h3>
                    <p className="text-gray-500 max-w-md">
                        Silakan klik salah satu tab di atas (<b>Belum Terima</b>, <b>Setor</b>, <b>Stok Akhir</b> atau <b>Belum Faktur</b>) untuk menampilkan data rekap laporan.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab !== "4" && (
                        <div
                            className={`grid grid-cols-1 gap-4 md:grid-cols-2`}
                        >
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                <div className="flex items-center gap-2 mb-1 z-10 relative">
                                    <div className="p-1 bg-blue-100 text-blue-600 rounded-full">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-medium text-blue-600 uppercase">Total Data</p>
                                </div>
                                <h3 className="text-2xl font-bold text-blue-700 z-10 relative mt-2">
                                    {isLoadingReport ? "..." : summary.totalData} <span className="text-sm font-normal text-blue-500">Data</span>
                                </h3>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                <div className="flex items-center gap-2 mb-1 z-10 relative">
                                    <div className="p-1 bg-orange-100 text-orange-600 rounded-full">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-medium text-orange-600 uppercase">Total Berat</p>
                                </div>
                                <h3 className="text-2xl font-bold text-orange-700 z-10 relative mt-2">
                                    {isLoadingReport ? "..." : formatNumber(summary.totalWeight)} <span className="text-sm font-normal text-orange-500">Gr</span>
                                </h3>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-full -mr-6 -mt-6 z-0"></div>

                                <div className="flex items-center gap-2 mb-1 z-10 relative">
                                    <Package className="w-4 h-4 text-blue-100" />
                                    <p className="text-xs font-medium text-blue-100 uppercase">
                                        Total PCS
                                    </p>
                                </div>

                                <h3 className="text-2xl font-bold z-10 relative mt-2">
                                    {isLoadingReport ? "..." : formatNumber(summary.totalPcs)}
                                </h3>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg shadow-emerald-200 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-full -mr-6 -mt-6 z-0"></div>
                                <div className="flex items-center gap-2 mb-1 z-10 relative">
                                    <Banknote className="w-4 h-4 text-emerald-100" />
                                    <p className="text-xs font-medium text-emerald-100 uppercase">Total Nominal</p>
                                </div>
                                <h3 className="text-2xl font-bold z-10 relative mt-2">
                                    {isLoadingReport ? "..." : formatRupiah(summary.totalNominal)}
                                </h3>
                            </div>

                        </div>
                    )}
                    {activeTab === "4" && (
                        <div
                            className={`grid grid-cols-1 gap-4`}
                        >
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                <div className="flex items-center gap-2 mb-1 z-10 relative">
                                    <div className="p-1 bg-blue-100 text-blue-600 rounded-full">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-medium text-blue-600 uppercase">Total Belum Faktur</p>
                                </div>
                                <h3 className="text-2xl font-bold text-blue-700 z-10 relative mt-2">
                                    {isLoadingReport ? "..." : notInvoice} <span className="text-sm font-normal text-blue-500">Data</span>
                                </h3>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {isLoadingReport && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-gray-600">Memuat data...</span>
                            </div>
                        )}

                        <Table
                            data={reportData}
                            columns={columns}
                            pagination={activeTab === "4" ? true : false}
                            lastPage={activeTab === "4" ? lastPage : undefined}
                            total={activeTab === "4" ? count : undefined}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            // onRowClick={handleRowClick}
                            currentPage={filters.page}
                            perPage={filters.per_page}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}