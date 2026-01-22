"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";
import axios from "axios";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet, alertToast, endpointUrlv2 } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Table from "@/components/tables/Table";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Loader2, Search, Download, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
interface SelectOption { value: string; label: string; }
interface IFilters {
    order_date_start: string | null;
    order_date_end: string | null;
    wo_date_start: string | null;
    wo_date_end: string | null;
    receipt_date_start: string | null;
    receipt_date_end: string | null;
    deposit_date_start: string | null;
    deposit_date_end: string | null;
    item_id: number | null;
    supplier_id: number | null;
    staff_id: number | null;
    belum_setor: boolean;
}
interface IStockData {
    code_item: string;
    order_date: string | null;
    wo_date: string | null;
    receipt_date: string | null;
    deposit_date: string | null;
    item_type: string;
    supplier: string;
    orderer: string;
    weight: string;
    weight_deposit: string | null;
    cokim: string;
    scope: string;
    sg: string;
    xray: string;
    id?: string;
}
const initialFilterState: IFilters = {
    order_date_start: null,
    order_date_end: null,
    wo_date_start: null,
    wo_date_end: null,
    receipt_date_start: null,
    receipt_date_end: null,
    deposit_date_start: null,
    deposit_date_end: null,
    item_id: null,
    supplier_id: null,
    staff_id: null,
    belum_setor: false,
};

export default function StockGlobalReportPage() {
    const [data, setData] = useState<IStockData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<IFilters>(initialFilterState);
    const [activeFilterCount, setActiveFilterCount] = useState(0);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    const [staffOptions, setStaffOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const formatGram = (value: string | number | null): string => {
        if (value === null || value === undefined) return "-";
        const num = Number(value);
        return num.toLocaleString('id-ID') + " gr";
    };
    const formatNumber = (value: string | number | null): string => {
        if (value === null || value === undefined) return "-";
        const num = Number(value);
        return num.toLocaleString('id-ID');
    };
    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMM YYYY');
    };
    const formatDateTime = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMM YYYY, HH:mm');
    };

    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                const [supplierRes, itemRes, staffRes] = await Promise.all([
                    httpGet(endpointUrl("master/supplier/dropdown"), true),
                    httpGet(endpointUrl("master/item/dropdown"), true),
                    httpGet(endpointUrl("master/staff/dropdown"), true)
                ]);

                setSupplierOptions(supplierRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));
                setItemOptions(itemRes.data.data.map((i: any) => ({ value: i.id.toString(), label: `${i.name_item} (${i.code})` })));
                setStaffOptions(staffRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));

            } catch (error) {
                toast.error("Gagal memuat data filter dropdown.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchOptions();
    }, []);

    const buildActiveFilters = (filters: IFilters) => {
        const activeFilters: any = {};
        let count = 0;

        (Object.keys(filters) as Array<keyof IFilters>).forEach(key => {
            const value = filters[key];
            if (value) {
                if (key.includes('_start') || key.includes('_end')) {
                    activeFilters[key] = moment(value as string).format('YYYY-MM-DD');
                } else {
                    activeFilters[key] = value;
                }
                count++;
            }
        });

        setActiveFilterCount(count);
        return activeFilters;
    };

    const getData = async () => {
        setIsLoading(true);

        const params = buildActiveFilters(appliedFilters);

        try {
            const response = await httpGet(endpointUrl("stock-global"), true, params);
            setData(response.data.data || []);

        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, [appliedFilters]);


    const handleExport = async () => {
        setIsExporting(true);
        const params = buildActiveFilters(appliedFilters);

        try {
            const response = await axios.get(endpointUrl("stock-global/export"), {
                params,
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = `Laporan_Stock_Global_${moment().format('YYYYMMDD')}.xlsx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            const blobUrl = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFilterChange = (field: keyof IFilters, value: any) => {
        setAppliedFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field: 'order_date' | 'wo_date' | 'receipt_date' | 'deposit_date', date: Date | null, type: 'start' | 'end') => {
        const key = `${field}_${type}` as keyof IFilters;
        handleFilterChange(key, date ? moment(date).format('YYYY-MM-DD') : null);
    };

    const handleResetFilters = () => {
        setAppliedFilters(initialFilterState);
    };

    const columns = useMemo(() => [
        {
            id: "numbering",
            header: "No",
            cell: ({ row }: any) => {
                const index = data.indexOf(row);
                return <span className="font-medium">{index + 1}</span>;
            }
        },
        {
            id: "code_item",
            header: "Kode Barang",
            accessorKey: "code_item",
            cell: ({ row }: any) => <span className="font-medium">{row.code_item}</span>
        },
        {
            id: "order_date",
            header: "Tanggal Pesan",
            accessorKey: "order_date",
            cell: ({ row }: any) => formatDate(row.order_date)
        },
        {
            id: "wo_date",
            header: "Tanggal Surat Jalan",
            accessorKey: "wo_date",
            cell: ({ row }: any) => formatDate(row.wo_date)
        },
        {
            id: "receipt_date",
            header: "Tanggal Datang",
            accessorKey: "receipt_date",
            cell: ({ row }: any) => formatDateTime(row.receipt_date)
        },
        {
            id: "deposit_date",
            header: "Tanggal Setor",
            accessorKey: "deposit_date",
            cell: ({ row }: any) => formatDate(row.deposit_date)
        },
        { id: "item_type", header: "Jenis Barang", accessorKey: "item_type" },
        { id: "supplier", header: "Supplier", accessorKey: "supplier" },
        { id: "orderer", header: "Pemesan", accessorKey: "orderer" },
        // {
        //     id: "status_setor",
        //     header: "Status Setor",
        //     cell: ({ row }: any) => (
        //         row.deposit_date ?
        //             <Badge color="success">Sudah Setor</Badge> :
        //             <Badge color="warning">Belum Setor</Badge>
        //     )
        // },
        {
            id: "weight",
            header: "Berat",
            accessorKey: "weight",
            cell: ({ row }: any) => <span className="text-right block">{formatGram(row.weight)}</span>
        },
        {
            id: "cokim",
            header: "Cokim",
            accessorKey: "cokim",
            cell: ({ row }: any) => <span className="text-right block">{formatNumber(row.cokim)}</span>
        },
        { id: "scope", header: "Scope", accessorKey: "scope" },
        { id: "sg", header: "SG", accessorKey: "sg" },
        { id: "xray", header: "X-Ray", accessorKey: "xray" },
    ], [data]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <button
                    onClick={() => setShowFilters(prev => !prev)}
                    className={`w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                {activeFilterCount > 0 && (
                    <button
                        onClick={handleResetFilters}
                        className="w-full sm:w-auto px-4 py-2 border border-red-500 text-red-500 rounded-md flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                )}
                <button
                    onClick={handleExport}
                    disabled={isLoading || isExporting || data.length === 0}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                    {isExporting ? <Loader2 className="animate-spin w-5 h-5" /> : <Download />}
                    Export
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        key="filters"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        <ComponentCard title="Filter Laporan">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Pesan (Mulai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.order_date_start ? new Date(appliedFilters.order_date_start) : null}
                                        onChange={(date) => handleDateChange('order_date', date, 'start')}
                                        onClearFilter={() => handleFilterChange('order_date_start', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Pesan (Selesai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.order_date_end ? new Date(appliedFilters.order_date_end) : null}
                                        onChange={(date) => handleDateChange('order_date', date, 'end')}
                                        onClearFilter={() => handleFilterChange('order_date_end', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Jenis Barang</label>
                                    <Select
                                        options={itemOptions}
                                        value={appliedFilters.item_id ? _.find(itemOptions, { value: appliedFilters.item_id.toString() }) : null}
                                        onValueChange={(opt) => handleFilterChange('item_id', opt ? Number(opt.value) : null)}
                                        placeholder="Semua Barang"
                                        isClearable disabled={loadingOptions}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Surat Jalan (Mulai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.wo_date_start ? new Date(appliedFilters.wo_date_start) : null}
                                        onChange={(date) => handleDateChange('wo_date', date, 'start')}
                                        onClearFilter={() => handleFilterChange('wo_date_start', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Surat Jalan (Selesai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.wo_date_end ? new Date(appliedFilters.wo_date_end) : null}
                                        onChange={(date) => handleDateChange('wo_date', date, 'end')}
                                        onClearFilter={() => handleFilterChange('wo_date_end', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Pemesan (Staff)</label>
                                    <Select
                                        options={staffOptions}
                                        value={appliedFilters.staff_id ? _.find(staffOptions, { value: appliedFilters.staff_id.toString() }) : null}
                                        onValueChange={(opt) => handleFilterChange('staff_id', opt ? Number(opt.value) : null)}
                                        placeholder="Semua Staff"
                                        isClearable disabled={loadingOptions}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Datang (Mulai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.receipt_date_start ? new Date(appliedFilters.receipt_date_start) : null}
                                        onChange={(date) => handleDateChange('receipt_date', date, 'start')}
                                        onClearFilter={() => handleFilterChange('receipt_date_start', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Datang (Selesai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.receipt_date_end ? new Date(appliedFilters.receipt_date_end) : null}
                                        onChange={(date) => handleDateChange('receipt_date', date, 'end')}
                                        onClearFilter={() => handleFilterChange('receipt_date_end', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Supplier</label>
                                    <Select
                                        options={supplierOptions}
                                        value={appliedFilters.supplier_id ? _.find(supplierOptions, { value: appliedFilters.supplier_id.toString() }) : null}
                                        onValueChange={(opt) => handleFilterChange('supplier_id', opt ? Number(opt.value) : null)}
                                        placeholder="Semua Supplier"
                                        isClearable disabled={loadingOptions}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Setor (Mulai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.deposit_date_start ? new Date(appliedFilters.deposit_date_start) : null}
                                        onChange={(date) => handleDateChange('deposit_date', date, 'start')}
                                        onClearFilter={() => handleFilterChange('deposit_date_start', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-sm">Tanggal Setor (Selesai)</label>
                                    <SingleDatePicker
                                        selectedDate={appliedFilters.deposit_date_end ? new Date(appliedFilters.deposit_date_end) : null}
                                        onChange={(date) => handleDateChange('deposit_date', date, 'end')}
                                        onClearFilter={() => handleFilterChange('deposit_date_end', null)}
                                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        id="belum_setor"
                                        checked={appliedFilters.belum_setor}
                                        onChange={(e) => handleFilterChange('belum_setor', e.target.checked)}
                                        className="h-4 w-4 rounded"
                                    />
                                    <label htmlFor="belum_setor" className="ml-2 block text-sm font-medium">
                                        Hanya yg belum setor
                                    </label>
                                </div>
                            </div>
                        </ComponentCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading && data.length === 0 ? (
                <div className="text-center p-10 border rounded-lg bg-white dark:bg-gray-800">
                    <Loader2 className="w-6 h-6 animate-spin inline-block mb-2" />
                    <p className="text-gray-500">Memuat data awal...</p>
                </div>
            ) : (
                <Table
                    data={data}
                    columns={columns}
                    loading={isLoading}
                    pagination={false}
                />
            )}

            {data.length === 0 && !isLoading && activeFilterCount > 0 && (
                <div className="text-center p-10 border rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-gray-500">Tidak ada data yang cocok dengan filter Anda.</p>
                </div>
            )}
        </div>
    );
}