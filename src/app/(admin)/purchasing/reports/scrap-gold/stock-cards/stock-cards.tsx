"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import _ from "lodash";
import {
    Search,
    FileText,
    Download,
    Loader2,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Package,
    AlertCircle
} from "lucide-react";
import Table from "@/components/tables/Table";
import Select from '@/components/form/Select-custom';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { endpointUrl, httpGet } from "@/../helpers";
import axios from "axios";

interface IItemDropdown {
    id: number;
    name: string;
    code: string;
    name_item?: string;
}

interface IStockCardItem {
    id: number;
    type: string;
    code: string;
    name_item: string;
    status: string;
}

interface IStockCardDetail {
    date: string;
    no_reference: string;
    bruto_awal: string | number;
    netto_awal: string | number;
    bruto_masuk: string | number;
    netto_masuk: string | number;
    bruto_keluar: string | number;
    netto_keluar: string | number;
    bruto_akhir: number;
    netto_akhir: number;
    notes: string | null;
}

interface IReportResponse {
    now: string;
    items: IStockCardItem;
    details: IStockCardDetail[];
}

interface SelectOption {
    value: string;
    label: string;
}

export default function ScrapGoldStockCardPage() {
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
    const [selectedItemId, setSelectedItemId] = useState<string>("");

    const [viewingMonthDateStart, setViewingMonthDateStart] = useState(new Date());
    const [viewingMonthDateEnd, setViewingMonthDateEnd] = useState(new Date());

    const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
    const [reportData, setReportData] = useState<IReportResponse | null>(null);

    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoadingItems(true);
        try {
            const response = await httpGet(endpointUrl("master/item/dropdown"), true);
            const data: IItemDropdown[] = response.data.data || response.data;
            const options = data.map(item => ({
                value: item.id.toString(),
                label: `${item.code} - ${item.name || item.name_item || "Unnamed"}`
            }));
            setSelectOptions(options);
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error("Gagal memuat data item.");
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleProcess = async () => {
        if (!selectedItemId) {
            toast.warning("Silakan pilih item terlebih dahulu.");
            return;
        }
        if (!startDate || !endDate) {
            toast.warning("Silakan pilih rentang tanggal.");
            return;
        }

        setIsLoadingReport(true);
        try {
            const params = {
                item_id: selectedItemId,
                start_date: startDate,
                end_date: endDate
            };
            const response = await httpGet(endpointUrl("report/scrap-gold-stock-card"), true, params);
            if (response.data && response.data.status === 200) {
                setReportData(response.data.data);
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
        const payload = {
            item_id: selectedItemId,
            start_date: startDate,
            end_date: endDate
        };
        try {
            const response = await axios.post(endpointUrl(`report/scrap-gold-stock-card/export`), payload, {
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

            let filename = `stock_card.pdf`;

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

    const summary = useMemo(() => {
        if (!reportData?.details || reportData.details.length === 0) {
            return { 
                masukB: 0, masukN: 0, 
                keluarB: 0, keluarN: 0, 
                awalB: 0, awalN: 0,
                akhirB: 0, akhirN: 0
            };
        }

        const details = reportData.details;
        const firstRecord = details[0]; // Acuan Saldo Awal (Record Pertama)

        // 1. Hitung Total Mutasi (Akumulasi)
        const masukB = _.sumBy(details, (item) => Number(item.bruto_masuk || 0));
        const masukN = _.sumBy(details, (item) => Number(item.netto_masuk || 0));
        const keluarB = _.sumBy(details, (item) => Number(item.bruto_keluar || 0));
        const keluarN = _.sumBy(details, (item) => Number(item.netto_keluar || 0));
        
        // 2. Ambil Saldo Awal (Dari record pertama periode ini)
        const awalB = Number(firstRecord.bruto_awal || 0);
        const awalN = Number(firstRecord.netto_awal || 0);
        
        // 3. Hitung Saldo Akhir (Rumus Matematis: Awal + Masuk - Keluar)
        // Tidak lagi mengambil dari lastRecord.bruto_akhir
        const akhirB = awalB + masukB - keluarB;
        const akhirN = awalN + masukN - keluarN;

        return {
            masukB, masukN,
            keluarB, keluarN,
            awalB, awalN,
            akhirB, akhirN,
        };
    }, [reportData]);

    const formatNumber = (val: string | number) => {
        const num = Number(val);
        return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const columns = useMemo(() => [
        {
            id: "date",
            header: "TANGGAL",
            accessorKey: "date",
            cell: ({ row }: { row: IStockCardDetail }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{moment(row.date).format("DD/MM/YYYY")}</span>
                    <span className="text-xs text-gray-500 font-mono mt-0.5">{row.no_reference}</span>
                </div>
            )
        },
        {
            id: "awal",
            header: "SALDO AWAL",
            cell: ({ row }: { row: IStockCardDetail }) => (
                <div className="flex justify-between items-center gap-4 text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-300">
                    <div className="flex flex-col items-end w-full">
                        <span className="text-gray-400 text-[10px] uppercase">Bruto</span>
                        <span className="font-medium text-gray-600">{formatNumber(row.bruto_awal)}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-gray-200"></div>
                    <div className="flex flex-col items-end w-full">
                        <span className="text-gray-400 text-[10px] uppercase">Netto</span>
                        <span className="font-bold text-gray-700">{formatNumber(row.netto_awal)}</span>
                    </div>
                </div>
            )
        },
        {
            id: "masuk",
            header: "MUTASI MASUK (+)",
            cell: ({ row }: { row: IStockCardDetail }) => {
                const hasValue = Number(row.bruto_masuk) > 0 || Number(row.netto_masuk) > 0;
                return (
                    <div className={`flex justify-between items-center gap-4 text-xs p-2 rounded-lg border ${hasValue ? 'bg-emerald-50 border-emerald-100' : 'bg-transparent border-transparent'}`}>
                        {hasValue ? (
                            <>
                                <div className="flex flex-col items-end w-full">
                                    <span className="text-emerald-400 text-[10px] uppercase">Bruto</span>
                                    <span className="font-medium text-emerald-700">{formatNumber(row.bruto_masuk)}</span>
                                </div>
                                <div className="w-[1px] h-6 bg-emerald-200/50"></div>
                                <div className="flex flex-col items-end w-full">
                                    <span className="text-emerald-400 text-[10px] uppercase">Netto</span>
                                    <span className="font-bold text-emerald-800">{formatNumber(row.netto_masuk)}</span>
                                </div>
                            </>
                        ) : <span className="font-medium mx-auto">-</span>}
                    </div>
                )
            }
        },
        {
            id: "keluar",
            header: "MUTASI KELUAR (-)",
            cell: ({ row }: { row: IStockCardDetail }) => {
                const hasValue = Number(row.bruto_keluar) > 0 || Number(row.netto_keluar) > 0;
                return (
                    <div className={`flex justify-between items-center gap-4 text-xs p-2 rounded-lg border ${hasValue ? 'bg-red-50 border-red-100' : 'bg-transparent border-transparent'}`}>
                        {hasValue ? (
                            <>
                                <div className="flex flex-col items-end w-full">
                                    <span className="text-red-400 text-[10px] uppercase">Bruto</span>
                                    <span className="font-medium text-red-700">{formatNumber(row.bruto_keluar)}</span>
                                </div>
                                <div className="w-[1px] h-6 bg-red-200/50"></div>
                                <div className="flex flex-col items-end w-full">
                                    <span className="text-red-400 text-[10px] uppercase">Netto</span>
                                    <span className="font-bold text-red-800">{formatNumber(row.netto_keluar)}</span>
                                </div>
                            </>
                        ) : <span className="font-medium mx-auto">-</span>}
                    </div>
                )
            }
        },
        {
            id: "akhir",
            header: "SALDO AKHIR",
            cell: ({ row }: { row: IStockCardDetail }) => (
                <div className="flex justify-between items-center gap-4 text-xs bg-blue-50 p-2 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex flex-col items-end w-full">
                        <span className="text-blue-400 text-[10px] uppercase">Bruto</span>
                        <span className="font-medium text-blue-700">{formatNumber(row.bruto_akhir)}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-blue-200"></div>
                    <div className="flex flex-col items-end w-full">
                        <span className="text-blue-400 text-[10px] uppercase">Netto</span>
                        <span className="font-bold text-blue-800">{formatNumber(row.netto_akhir)}</span>
                    </div>
                </div>
            )
        },
        {
            id: "notes",
            header: "KETERANGAN",
            accessorKey: "notes",
            cell: ({ row }: { row: IStockCardDetail }) => (
                <div className="max-w-[200px] truncate text-xs text-gray-500 italic" title={row.notes || ""}>
                    {row.notes || "-"}
                </div>
            )
        },
    ], []);

    return (
        <div className="space-y-4 ">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Kartu Stok Rongsok
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Laporan mutasi stok per item (Masuk/Keluar/Saldo).</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pilih Item <span className="text-red-400">*</span>
                        </label>
                        <Select
                            options={selectOptions}
                            value={selectedItemId ? _.find(selectOptions, { value: selectedItemId }) : null}
                            onValueChange={(opt) => setSelectedItemId(opt ? opt.value : "")}
                            placeholder="-- Cari Barang --"
                            disabled={isLoadingItems}
                        />
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

                    <div className="w-full">
                        <button
                            onClick={handleProcess}
                            disabled={isLoadingReport || isLoadingItems}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 transition-colors"
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
                                <h2 className="text-lg font-bold text-gray-800">{reportData.items.name_item}</h2>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded border border-gray-200">
                                        {reportData.items.code}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        Periode: <span className="font-semibold text-gray-700">{moment(startDate).format("DD MMM YYYY")}</span> - <span className="font-semibold text-gray-700">{moment(endDate).format("DD MMM YYYY")}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-500" />}
                            Export
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
                        
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full">
                                    <ArrowUpCircle className="w-3 h-3" />
                                </div>
                                <p className="text-xs font-medium text-emerald-600">Total Masuk</p>
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-700 z-10 relative">
                                {formatNumber(summary.masukN)} <span className="text-xs font-normal text-emerald-500">Gr</span>
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1">Bruto: {formatNumber(summary.masukB)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                            <div className="flex items-center gap-2 mb-1 z-10 relative">
                                <div className="p-1 bg-red-100 text-red-600 rounded-full">
                                    <ArrowDownCircle className="w-3 h-3" />
                                </div>
                                <p className="text-xs font-medium text-red-600">Total Keluar</p>
                            </div>
                            <h3 className="text-2xl font-bold text-red-700 z-10 relative">
                                {formatNumber(summary.keluarN)} <span className="text-xs font-normal text-red-500">Gr</span>
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1">Bruto: {formatNumber(summary.keluarB)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-full -mr-6 -mt-6 z-0"></div>
                            <p className="text-xs font-medium text-blue-100 mb-1 z-10 relative">Saldo Akhir (Netto)</p>
                            <h3 className="text-2xl font-bold z-10 relative">
                                {formatNumber(summary.akhirN)} <span className="text-xs font-normal text-blue-200">Gr</span>
                            </h3>
                            <p className="text-[10px] text-blue-200 mt-1">Bruto: {formatNumber(summary.akhirB)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <Table
                            data={reportData.details}
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