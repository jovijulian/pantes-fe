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
    Hash,
    Inbox,
    Send,
    Archive,
    MousePointerClick,
    Scale
} from "lucide-react";
import Table from "@/components/tables/Table";
import { endpointUrl, httpGet } from "@/../helpers";
import axios from "axios";
interface IScrapGoldReport {
    id?: number;
    no_scrap_gold_send?: string;
    date?: string;
    purpose?: string;
    expedition?: string;
    supplier?: string | null;
    vendor?: string | null;
    code_item?: string;
    item_type?: string;
    bruto?: number | string;
    netto?: number | string;
    kadar?: number | string;
    code?: string;
    name_item?: string;
    bruto_masuk?: number | string;
    netto_masuk?: number | string;
    bruto_keluar?: number | string;
    netto_keluar?: number | string;
    bruto_saldo?: number | string;
    netto_saldo?: number | string;
}

export default function ScrapGoldReportPage() {
    const [activeTab, setActiveTab] = useState<"1" | "2" | "3" | null>(null);
    const [reportData, setReportData] = useState<IScrapGoldReport[]>([]);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (activeTab) {
            fetchData(activeTab);
        }
    }, [activeTab]);

    const fetchData = async (status: string) => {
        setIsLoadingReport(true);
        setReportData([]);
        try {
            let url = "";
            if (status === "1") {
                url = "report/not-received/scrap-gold";
            } else if (status === "2") {
                url = "report/deposited/scrap-gold";
            } else if (status === "3") {
                url = "report/scrap-gold-stock-final";
            }

            const response = await httpGet(endpointUrl(url), true);

            if (response.data && response.data.status === 200) {
                if (status === "3") {
                    setReportData(response.data.data.details || []);
                } else {
                    setReportData(response.data.data.data || []);
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
                url = "report/not-received/scrap-gold/export";
            } else if (activeTab === "2") {
                url = "report/deposited/scrap-gold/export";
            } else if (activeTab === "3") {
                url = "report/scrap-gold-stock-final/export";
            }

            const response = await axios.post(
                endpointUrl(url),
                {},
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

            const tabName = activeTabsList.find(t => t.id === activeTab)?.label.replace(" ", "_").toLowerCase();
            const filename = `laporan_rongsok_${tabName}_${moment().format('DDMMYYYY')}.pdf`;

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
            return { totalData: 0, totalBruto: 0, totalNetto: 0 };
        }

        let totalBruto = 0;
        let totalNetto = 0;

        if (activeTab === "3") {
            totalBruto = _.sumBy(reportData, (item) => Number(item.bruto_saldo || 0));
            totalNetto = _.sumBy(reportData, (item) => Number(item.netto_saldo || 0));
        } else {
            totalBruto = _.sumBy(reportData, (item) => Number(item.bruto || 0));
            totalNetto = _.sumBy(reportData, (item) => Number(item.netto || 0));
        }

        return {
            totalData: reportData.length,
            totalBruto: totalBruto,
            totalNetto: totalNetto
        };
    }, [reportData, activeTab]);

    const formatNumber = (val: string | number) => Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const activeTabsList = [
        { id: "1", label: "Belum Terima", icon: Inbox },
        { id: "2", label: "Setor", icon: Send },
        { id: "3", label: "Stok Akhir", icon: Archive },
    ] as const;

    const columns = useMemo(() => {
        if (activeTab === "1" || activeTab === "2") {
            return [
                {
                    id: "date",
                    header: "TANGGAL",
                    accessorKey: "date",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="font-medium text-gray-800">
                            {row.date ? moment(row.date).format("DD/MM/YYYY") : "-"}
                        </div>
                    )
                },
                {
                    id: "no_scrap_gold_send",
                    header: "NO SURAT JALAN",
                    accessorKey: "no_scrap_gold_send",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {row.no_scrap_gold_send || "-"}
                        </span>
                    )
                },
                {
                    id: "destination",
                    header: "TUJUAN",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div>
                            <span className="text-xs text-gray-500 uppercase block leading-tight">{row.purpose || "-"}</span>
                            <span className="text-sm font-medium text-gray-800">{row.supplier || row.vendor || "-"}</span>
                        </div>
                    )
                },
                {
                    id: "expedition",
                    header: "EKSPEDISI",
                    accessorKey: "expedition",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm text-gray-600 capitalize">{row.expedition || "-"}</div>
                    )
                },
                {
                    id: "item_info",
                    header: "BARANG",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div>
                            <span className="text-xs text-gray-500 font-mono block leading-tight">{row.code_item || "-"}</span>
                            <span className="text-sm text-gray-700 font-medium">{row.item_type || "-"}</span>
                        </div>
                    )
                },
                {
                    id: "kadar",
                    header: "KADAR (%)",
                    accessorKey: "kadar",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm text-gray-600">{row.kadar ? `${row.kadar}%` : "-"}</div>
                    )
                },
                {
                    id: "bruto",
                    header: "BRUTO (GR)",
                    accessorKey: "bruto",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm font-bold text-gray-800">{row.bruto ? formatNumber(row.bruto) : "0"}</div>
                    )
                },
                {
                    id: "netto",
                    header: "NETTO (GR)",
                    accessorKey: "netto",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm font-bold text-emerald-600">{row.netto ? formatNumber(row.netto) : "0"}</div>
                    )
                }
            ];
        }

        if (activeTab === "3") {
            return [
                {
                    id: "code",
                    header: "KODE",
                    accessorKey: "code",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {row.code || "-"}
                        </span>
                    )
                },
                {
                    id: "name_item",
                    header: "NAMA BARANG",
                    accessorKey: "name_item",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <span className="text-sm text-gray-700 font-medium">{row.name_item || "-"}</span>
                    )
                },
                {
                    id: "masuk",
                    header: "MASUK (BRUTO / NETTO)",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm text-gray-600 font-medium">
                            <span className="text-gray-800">{formatNumber(row.bruto_masuk || 0)}</span> / <span className="text-emerald-600">{formatNumber(row.netto_masuk || 0)}</span>
                        </div>
                    )
                },
                {
                    id: "keluar",
                    header: "KELUAR (BRUTO / NETTO)",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm text-gray-600 font-medium">
                            <span className="text-gray-800">{formatNumber(row.bruto_keluar || 0)}</span> / <span className="text-red-500">{formatNumber(row.netto_keluar || 0)}</span>
                        </div>
                    )
                },
                {
                    id: "saldo",
                    header: "SALDO AKHIR (BRUTO / NETTO)",
                    cell: ({ row }: { row: IScrapGoldReport }) => (
                        <div className="text-sm font-bold bg-gray-50 px-2 py-1.5 rounded inline-block">
                            <span className="text-gray-800">{formatNumber(row.bruto_saldo || 0)}</span> <span className="text-gray-400 font-normal px-1">/</span> <span className="text-emerald-600">{formatNumber(row.netto_saldo || 0)}</span>
                        </div>
                    )
                }
            ];
        }

        return [];
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Laporan Status Rongsok
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Pilih status di bawah untuk melihat laporan instan.</p>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting || reportData.length === 0 || isLoadingReport || !activeTab}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-500" />}
                    Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {activeTabsList.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "1" | "2" | "3")}
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
                        Silakan klik salah satu tab di atas (<b>Belum Terima</b>, <b>Setor</b>, atau <b>Stok Akhir</b>) untuk menampilkan data rekap laporan Rongsok.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <div className="p-1 bg-blue-100 text-blue-600 rounded-full">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-medium text-blue-600 uppercase">Total Data</p>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-700 z-10 relative mt-2">
                                {isLoadingReport ? "..." : summary.totalData} <span className="text-sm font-normal text-blue-500">Baris</span>
                            </h3>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <div className="p-1 bg-orange-100 text-orange-600 rounded-full">
                                    <Package className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-medium text-orange-600 uppercase">Total Bruto</p>
                            </div>
                            <h3 className="text-2xl font-bold text-orange-700 z-10 relative mt-2">
                                {isLoadingReport ? "..." : formatNumber(summary.totalBruto)} <span className="text-sm font-normal text-orange-500">Gr</span>
                            </h3>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg shadow-emerald-200 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-full -mr-6 -mt-6 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <Scale className="w-4 h-4 text-emerald-100" />
                                <p className="text-xs font-medium text-emerald-100 uppercase">Total Netto</p>
                            </div>
                            <h3 className="text-2xl font-bold z-10 relative mt-2">
                                {isLoadingReport ? "..." : formatNumber(summary.totalNetto)} <span className="text-sm font-normal text-emerald-100">Gr</span>
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[300px]">
                        {isLoadingReport && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-gray-600">Memuat data...</span>
                            </div>
                        )}

                        <Table
                            data={reportData}
                            columns={columns}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}