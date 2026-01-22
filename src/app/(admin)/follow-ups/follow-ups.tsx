"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, endpointUrlv2, httpGet, httpPost } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/DeactivePurchasing";
import { FaEdit, FaTrash } from "react-icons/fa";
import DynamicFilterCard from "@/components/filters/DynamicFilterCard";
import { X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion";
import SummaryStats from "@/components/follow-up/SummaryStats";
import FollowUpChart from "@/components/follow-up/FollowUpChart";
import Leaderboard from "@/components/follow-up/Leaderboard";
import DateRangePicker from "@/components/common/DateRangePicker";

interface SummaryData {
    grafik: { date: string; follow_up_count: number | string }[];
    customer: {
        leaderboard: { id: number; name: string; total_follow_up: number; phone: string }[];
        count_customer: number;
    };
    sales: {
        leaderboard: { id: number; name: string; total_follow_up: number }[];
    };
    follow_up: {
        count_follow_up: number;
        count_customer_follow_up: number;
    };
}

interface TableDataItem {
    id: number;
    date: string;
    customer_id: string;
    customer: {
        id: number;
        name: string;
        member_no: string;
    }
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
    sales?: { name: string };
}

export default function FollowUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedRows, setSelectedRows] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [data, setData] = useState<TableDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [role, setRole] = useState<number | null>(null);
    const [filterOptions, setFilterOptions] = useState<any[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
    const [showFilters, setShowFilters] = useState(false);

    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const summaryStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const summaryEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const tableStartDate = searchParams.get("start_date_list") || null;
    const tableEndDate = searchParams.get("end_date_list") || null;
    
    const pageParam = searchParams.get("page") || "1";
    const perPageParam = searchParams.get("per_page");


    const getSummary = async () => {
        setLoadingSummary(true);
        try {
            const params: any = {
                start_date: summaryStartDate,
                end_date: summaryEndDate
            };
            const response = await httpGet(endpointUrlv2('follow-up/summary'), true, params);
            setSummaryData(response.data.data);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat summary data");
        } finally {
            setLoadingSummary(false);
        }
    };

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();

        const payload: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: pageParam ? Number(pageParam) : currentPage,
            filters: appliedFilters,
        };

        if (tableStartDate) payload.start_date = tableStartDate;
        if (tableEndDate) payload.end_date = tableEndDate;

        try {
            const url = role === 2 ? endpointUrlv2("sales/follow-up/list") : endpointUrlv2("follow-up/list");
            const response = await httpPost(url, payload, true);

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);
        } catch (error) {
            toast.error("Failed to fetch list data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const response = await httpGet(endpointUrl('/data-filter'), true);
                setFilterOptions(response.data.data);
            } catch (error) { }
        };
        fetchFilterData();
        const storedRole = localStorage.getItem("role");
        if (storedRole) setRole(parseInt(storedRole));
    }, []);

    useEffect(() => {
        getSummary();
    }, [summaryStartDate, summaryEndDate]);

    useEffect(() => {
        if (role) getData();
    }, [tableStartDate, tableEndDate, pageParam, perPage, searchTerm, appliedFilters, role]);


    const handleSummaryDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (dates.startDate) currentParams.set("start_date", dates.startDate);
        else currentParams.delete("start_date");

        if (dates.endDate) currentParams.set("end_date", dates.endDate);
        else currentParams.delete("end_date");

        router.push(`?${currentParams.toString()}`);
    };

    const handleTableDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (dates.startDate) currentParams.set("start_date_list", dates.startDate);
        else currentParams.delete("start_date_list");

        if (dates.endDate) currentParams.set("end_date_list", dates.endDate);
        else currentParams.delete("end_date_list");

        currentParams.set("page", "1");
        setCurrentPage(1);

        router.push(`?${currentParams.toString()}`, { scroll: false });
    };

    const handlePageChange = (page: number) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set("page", String(page));
        setCurrentPage(page);
        router.push(`?${currentParams.toString()}`, { scroll: false });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (label: string, value: string[]) => {
        setAppliedFilters(prev => {
            const next = { ...prev };
            if (value.length > 0) next[label] = value; else delete next[label];
            return next;
        });
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setAppliedFilters({});
        setSearchTerm('');
        setShowFilters(false);
        setCurrentPage(1);
    };

    const handleRowClick = (rowData: TableDataItem) => {
        const detailUrl = `/follow-ups/${rowData.id}`;
        window.open(detailUrl, '_blank');
    };

    const columnsNew = useMemo(() => {
        const defaultColumns = [
            ...(role === 2 ? [{
                id: "action",
                header: "Action",
                accessorKey: "action",
                cell: ({ row }: any) => (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/follow-ups/edit/${row.id}`); }}
                            className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                            <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedData(row); setIsDeleteModalOpen(true); }}
                            className="px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            <FaTrash className="w-4 h-4" />
                        </button>
                    </div>
                )
            }] : []),
            {
                id: "member_no",
                header: "Pelanggan",
                accessorKey: "member_no",
                cell: ({ row }: any) => (
                    <button className="text-blue-600 hover:underline text-left" onClick={() => handleRowClick(row)}>
                        <span className="font-semibold">{row.customer.name}</span>
                        <div className="text-xs mt-1 max-w-sm truncate">({row.customer.member_no})</div>
                    </button>
                )
            },
            {
                id: "date",
                header: "Tanggal Follow Up",
                accessorKey: "date",
                cell: ({ row }: any) => <span>{moment(row.date).format("DD MMMM YYYY")}</span>,
            },
            {
                id: "name",
                header: "Judul",
                accessorKey: "name",
                cell: ({ row }: any) => <span>{row.name}</span>
            },
            ...(role === 1 || role === 4 || role === 8 ? [{
                id: "sales",
                header: "Nama Sales",
                accessorKey: "sales",
                cell: ({ row }: any) => <span>{row.sales?.name || 'N/A'}</span>
            }] : []),
            {
                id: "created_at",
                header: "Dibuat pada",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
        ];
        return defaultColumns;
    }, [role]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white"> Dashboard Follow Up</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Ringkasan aktivitas follow up periode ini.</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <DateRangePicker
                            onDatesChange={handleSummaryDatesChange}
                            initialStartDate={summaryStartDate}
                            initialEndDate={summaryEndDate}
                        />
                    </div>
                    {role === 2 && (
                        <button
                            onClick={() => router.push("/follow-ups/create")}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <span className="text-lg font-bold">+</span>
                            Tambah Follow Up
                        </button>
                    )}
                </div>
            </div>

            {loadingSummary ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm font-medium">Memuat data summary...</p>
                    </div>
                </div>
            ) : summaryData ? (
                <>
                    <SummaryStats data={summaryData} />
                    <FollowUpChart data={summaryData.grafik} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Leaderboard
                            sales={summaryData.sales.leaderboard}
                            customers={summaryData.customer.leaderboard}
                            role={role}
                        />
                    </div>
                </>
            ) : null}

            <div className="space-y-6 mt-10">
                <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]`}>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
                        <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white self-start lg:self-center">
                                    Daftar Follow Up
                                </h3>

                                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                    <DateRangePicker
                                        onDatesChange={handleTableDatesChange}
                                        initialStartDate={tableStartDate}
                                        initialEndDate={tableEndDate}
                                    />

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {Object.keys(appliedFilters).length > 0 && (
                                            <button onClick={handleResetFilters} className="px-4 py-2 border border-red-500 text-red-500 rounded-md flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                                                <X className="w-4 h-4" /> <span>Reset</span>
                                            </button>
                                        )}
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            placeholder="Cari..."
                                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        key="filters"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.25 }}
                                        className="relative z-[1000]"
                                    >
                                        <DynamicFilterCard
                                            filters={filterOptions}
                                            appliedFilters={appliedFilters}
                                            onFilterChange={handleFilterChange}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Table
                                data={data}
                                columns={columnsNew}
                                pagination={true}
                                lastPage={lastPage}
                                total={count}
                                loading={isLoading}
                                checkedData={selectedRows}
                                setCheckedData={setSelectedRows}
                                onPageChange={handlePageChange}
                                onPerPageChange={handlePerPageChange}
                                onRowClick={handleRowClick}
                            />

                            <DeactiveModal
                                isOpen={isDeleteModalOpen}
                                onClose={() => {
                                    setIsDeleteModalOpen(false);
                                    setSelectedData(null);
                                }}
                                url={`sales/follow-up/${selectedData?.id}/delete`}
                                itemName={selectedData?.name || ""}
                                selectedData={selectedData}
                                onSuccess={getData}
                                message="Follow Up deleted successfully!"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}