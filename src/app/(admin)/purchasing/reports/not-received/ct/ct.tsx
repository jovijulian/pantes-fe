"use client";

import React, { useState, useMemo, useEffect } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import _ from "lodash";
import {
    Search,
    FileText,
    Download,
    Loader2,
    Package,
    Banknote,
    Hash
} from "lucide-react";
import Table from "@/components/tables/Table";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { endpointUrl, httpGet } from "@/../helpers";
import axios from "axios";
import Select from "@/components/form/Select-custom";

interface ICTNotReceived {
    id: number;
    type: string;
    no_order: string;
    date: string;
    weight: string;
    pcs: string | null;
    cokim: string;
    nominal: string;
    status: string;
    supplier?: {
        name: string;
    };
    staff?: {
        name: string;
    };
    payment_date: string;
}
interface SelectOption { value: string; label: string; }

export default function CTNotReceivedReportPage() {
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
    const [searchQuery, setSearchQuery] = useState("");

    const [viewingMonthDateStart, setViewingMonthDateStart] = useState(new Date());
    const [viewingMonthDateEnd, setViewingMonthDateEnd] = useState(new Date());

    const [reportData, setReportData] = useState<ICTNotReceived[] | null>(null);

    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [staffOptions, setStaffOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
            const [supplierRes, staffRes] = await Promise.all([
                httpGet(endpointUrl("master/supplier/dropdown"), true),
                httpGet(endpointUrl("master/staff/dropdown"), true)
            ]);

            setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
            setStaffOptions(staffRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));

        } catch (error) {
            toast.error("Gagal memuat data filter dropdown.");
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleProcess = async () => {
        if (!startDate || !endDate) {
            toast.warning("Silakan pilih rentang tanggal.");
            return;
        }

        setIsLoadingReport(true);
        try {
            const queryParams = new URLSearchParams({
                type: "1",
                start_date: startDate,
                end_date: endDate,
            });

            if (searchQuery) {
                queryParams.append("search", searchQuery);
            }

            if (selectedSupplier) {
                queryParams.append("supplier_id", selectedSupplier);
            }

            if (selectedStaff) {
                queryParams.append("staff_id", selectedStaff);
            }
            const response = await httpGet(endpointUrl(`report/not-received?${queryParams.toString()}`), true);

            if (response.data && response.data.status === 200) {
                setReportData(response.data.data || []);
                toast.success("Laporan berhasil dimuat.");
            } else {
                toast.error(response.data.message || "Gagal memuat laporan.");
                setReportData(null);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Terjadi kesalahan saat memuat laporan.");
            setReportData(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleExport = async () => {
        if (!reportData) return;
        setIsExporting(true);

        try {
            const queryParams = new URLSearchParams({
                type: "1",
                start_date: startDate,
                end_date: endDate,
            });

            if (searchQuery) {
                queryParams.append("search", searchQuery);
            }

            const response = await axios.post(
                endpointUrl(`report/not-received/export?${queryParams.toString()}`),
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
            const contentDisposition = response.headers['content-disposition'];

            let filename = `laporan_ct_belum_terima_${moment().format('DDMMYYYY')}.pdf`;

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
            return { totalData: 0, totalWeight: 0, totalNominal: 0 };
        }

        const totalData = reportData.length;
        const totalWeight = _.sumBy(reportData, (item) => Number(item.weight || 0));
        const totalNominal = _.sumBy(reportData, (item) => Number(item.nominal || 0));

        return { totalData, totalWeight, totalNominal };
    }, [reportData]);

    const formatNumber = (val: string | number) => {
        return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatRupiah = (val: string | number) => {
        return "Rp " + Number(val).toLocaleString('id-ID');
    };

    const columns = useMemo(() => [
        {
            id: "date",
            header: "TANGGAL PESAN",
            accessorKey: "date",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="font-medium text-gray-800">
                    {moment(row.date).format("DD/MM/YYYY")}
                </div>
            )
        },
        {
            id: "no_order",
            header: "NO ORDER",
            accessorKey: "no_order",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    {row.no_order}
                </span>
            )
        },
        {
            id: "staff",
            header: "PEMESAN",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="text-sm text-gray-600 capitalize">
                    {row.staff?.name || "-"}
                </div>
            )
        },
        {
            id: "supplier",
            header: "SUPPLIER",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="text-sm text-gray-700 font-medium uppercase">
                    {row.supplier?.name || "-"}
                </div>
            )
        },
        {
            id: "cokim",
            header: "COKIM",
            accessorKey: "cokim",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="text-sm text-gray-600">
                    {formatRupiah(row.cokim)}
                </div>
            )
        },
        {
            id: "weight",
            header: "BERAT (GR)",
            accessorKey: "weight",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="text-sm font-bold text-gray-800">
                    {formatNumber(row.weight)}
                </div>
            )
        },

        {
            id: "nominal",
            header: "NOMINAL",
            accessorKey: "nominal",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="text-sm font-bold text-emerald-600">
                    {formatRupiah(row.nominal)}
                </div>
            )
        },
        {
            id: "payment_date",
            header: "TANGGAL PESAN",
            accessorKey: "payment_date",
            cell: ({ row }: { row: ICTNotReceived }) => (
                <div className="font-medium text-gray-800">
                    {moment(row.payment_date).format("DD/MM/YYYY")}
                </div>
            )
        },
    ], []);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Laporan CT Belum Terima
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Laporan daftar pesanan CT yang belum diterima.</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ketik untuk mencari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                            <SingleDatePicker
                                placeholderText="Tanggal Awal"
                                selectedDate={startDate ? new Date(startDate) : null}
                                onChange={(date: any) => setStartDate(moment(date).format('YYYY-MM-DD'))}
                                onClearFilter={() => setStartDate("")}
                                viewingMonthDate={viewingMonthDateStart}
                                onMonthChange={setViewingMonthDateStart}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                            <SingleDatePicker
                                placeholderText="Tanggal Akhir"
                                selectedDate={endDate ? new Date(endDate) : null}
                                onChange={(date: any) => setEndDate(moment(date).format('YYYY-MM-DD'))}
                                onClearFilter={() => setEndDate("")}
                                viewingMonthDate={viewingMonthDateEnd}
                                onMonthChange={setViewingMonthDateEnd}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <Select
                                options={supplierOptions}
                                value={_.find(supplierOptions, { value: selectedSupplier }) || null}
                                onValueChange={(opt) => setSelectedSupplier(opt ? opt.value : null)}
                                placeholder="Semua Supplier"
                                isClearable disabled={loadingOptions}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pemesan</label>
                            <Select
                                options={staffOptions}
                                value={_.find(staffOptions, { value: selectedStaff }) || null}
                                onValueChange={(opt) => setSelectedStaff(opt ? opt.value : null)}
                                placeholder="Semua Pemesan"
                                isClearable disabled={loadingOptions}
                            />
                        </div>
                    </div>

                    <div className="w-full mt-2">
                        <button
                            onClick={handleProcess}
                            disabled={isLoadingReport}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isLoadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Proses Data
                        </button>
                    </div>
                </div>
            </div>

            {reportData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Hasil Laporan</h2>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        Periode: <span className="font-semibold text-gray-700">{moment(startDate).format("DD MMM YYYY")}</span> - <span className="font-semibold text-gray-700">{moment(endDate).format("DD MMM YYYY")}</span>
                                    </span>
                                    {searchQuery && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            | Pencarian: <span className="font-semibold text-gray-700">"{searchQuery}"</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || reportData.length === 0}
                            className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-500" />}
                            Export PDF
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <div className="p-1 bg-blue-100 text-blue-600 rounded-full">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-medium text-blue-600 uppercase">Total Transaksi</p>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-700 z-10 relative mt-2">
                                {summary.totalData} <span className="text-sm font-normal text-blue-500">Data</span>
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
                                {formatNumber(summary.totalWeight)} <span className="text-sm font-normal text-orange-500">Gr</span>
                            </h3>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg shadow-emerald-200 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-full -mr-6 -mt-6 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <Banknote className="w-4 h-4 text-emerald-100" />
                                <p className="text-xs font-medium text-emerald-100 uppercase">Total Nominal</p>
                            </div>
                            <h3 className="text-2xl font-bold z-10 relative mt-2">
                                {formatRupiah(summary.totalNominal)}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <Table
                            data={reportData}
                            columns={columns}
                            pagination={false}
                            loading={isLoadingReport}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}