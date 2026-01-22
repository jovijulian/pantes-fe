"use client";

import Table from "@/components/tables/Table";
import { Metadata } from "next";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrl, endpointUrlv2, httpDelete, httpGet, httpPost } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import EditUserModal from "@/components/modal/edit/EditUserModal";
import DynamicFilterCard from "@/components/filters/DynamicFilterCard";
import { Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

interface TableDataItem {
    id: number;
    date: string;
    customer: {
        name: string;
        phone: string;
    };
    name_purchase: string;
    created_at: string;
    updated_at: string;
}

interface CategoryOption {
    id: number;
    name: string;
}

export default function SalesPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedRows, setSelectedRows] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState<TableDataItem | null>(null);
    const [deleteData, setDeleteData] = useState<TableDataItem | null>(null);
    const router = useRouter()
    const page = searchParams.get("page") || "1";
    const [data, setData] = useState<TableDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedData, setSelectedData] = useState<any>(null);
    const [role, setRole] = useState<number | null>(null);
    const [filterOptions, setFilterOptions] = useState<any[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [assignCategory, setAssignCategory] = useState<any>(0);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    useEffect(() => {
        getData();
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(parseInt(storedRole));
        }

    }, [searchParams, currentPage, perPage, page, searchTerm, role, appliedFilters]);

    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const response = await httpGet(endpointUrl('/data-filter'), true);
                setFilterOptions(response.data.data);
            } catch (error) {
                toast.error("Failed to load filter options.");
            }
        };
        fetchFilterData();
    }, []);

    useEffect(() => {
        if (role === 6 || role === 7) {
            const fetchInitialData = async () => {
                try {
                    const [categoryRes] = await Promise.all([
                        httpGet(endpointUrl('master/customer-category/dropdown'), true)
                    ]);
                    setCategoryOptions(categoryRes.data.data);
                } catch (error) {
                    console.error("Failed to load initial options", error);
                }
            };
            fetchInitialData();
        }

    }, [role]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (assignCategory !== 0) {
            params.set('assign_category', assignCategory.toString());
        } else {
            params.delete('assign_category');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [assignCategory]);

    const selectCategoryOptions = useMemo(() => {
        const defaultOption = [{ value: "0", label: "Semua Kategori" }];
        const mappedOptions = categoryOptions.filter(cat => cat.name.toLowerCase() !== "regular")
            .map(cat => ({
                value: cat.id.toString(),
                label: cat.name
            }));

        return [...defaultOption, ...mappedOptions];
    }, [categoryOptions]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const activeFilterCount = Object.keys(appliedFilters).length;

    const columnsNew = useMemo(() => {
        const defaultColumns = [
            {
                id: "action",
                header: "Aksi",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    return (
                        <div className="flex items-center gap-3 w-[100px]">
                            {/* Edit */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/transactions/edit/${row.id}`);
                                }}
                                title="Edit"
                                className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                            >
                                <FaEdit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedData(row);
                                    setIsDeleteModalOpen(true);
                                }}
                                title="Delete"
                                className="px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
                minWidth: 160, // lebih lebar
                maxWidth: 220,
            },
            {
                id: "date",
                header: "Tanggal Transaksi",
                accessorKey: "date",
                cell: ({ row }: any) => {
                    const data = row;
                    return (
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => handleRowClick}
                        >
                            {moment(data.date).format("DD/MM/YYYY")}
                        </button>
                    );
                }
            },
            {
                id: "name",
                header: "Nama Pelanggan",
                accessorKey: "name",
                cell: ({ row }: any) => {
                    const name = row.customer?.name;
                    const captionsString = row.captions;

                    const showCaptions = activeFilterCount > 0 && captionsString;

                    return (
                        <div>
                            <span
                                className={`${showCaptions ? "font-semibold" : ""} text-gray-800 dark:text-white`}
                            >
                                {name}
                            </span>

                            {showCaptions && (
                                <div
                                    className="text-xs text-gray-500 mt-1 max-w-sm truncate"
                                    title={captionsString}
                                >
                                    {captionsString}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "phone",
                header: "No. Telp Pelanggan",
                accessorKey: "phone",
                cell: ({ row }: any) => <span>{row.customer?.phone}</span>,
            },
            {
                id: "name_purchase",
                header: "Nama Pembelian",
                accessorKey: "name_purchase",
                cell: ({ row }: any) => <span>{row.name_purchase}</span>,
            },
            ...(role === 1 || role === 4 || role === 8
                ? [
                    {
                        id: "sales",
                        header: "Nama Sales",
                        accessorKey: "sales",
                        cell: ({ row }: any) => {
                            const salesName = row.sales?.name || 'N/A';
                            return <span>{salesName}</span>;
                        }
                    },
                ]
                : []),
            {
                id: "total_price",
                header: "Total Harga",
                accessorKey: "total_price",
                cell: ({ row }: any) => <span className="font-semibold"> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.total_price)}</span>,
            },
            {
                id: "created_at",
                header: "Dibuat pada",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
            {
                id: "updated_at",
                header: "Diubah pada",
                accessorKey: "updated_at",
                cell: ({ row }: any) => <span>{moment(row.updated_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
        ];
        return [...defaultColumns, ...columns.filter((col) => col.field !== "id" && col.field !== "hide_this_column_field")];
    }, [columns, role, activeFilterCount]);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();;
        const page = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const payload: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
            filters: appliedFilters,
        };
        if (role === 6 || role === 7) {
            payload.assign_by_me = 1;
            payload.assign_category = assignCategory
        }

        let endpoint = '';
        if (role === 1 || role === 4 || role === 8) {
            endpoint = endpointUrl(`/transaction/list`);
        } else if (role === 2) {
            endpoint = endpointUrl(`/sales/transaction/list`);
        } else if (role === 6 || role === 7) {
            endpoint = endpointUrl(`transaction/list`);
        } else {
            console.error("Unknown user role:", role);
            return;
        }

        try {
            const response = await httpPost(
                endpoint,
                payload,
                true,
            );

            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);
        } catch (error) {
            toast.error("Failed to fetch data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (label: string, value: string[]) => {
        setAppliedFilters(prevFilters => {
            const newFilters = { ...prevFilters };
            if (value.length > 0) {
                newFilters[label] = value;
            } else {
                delete newFilters[label];
            }
            return newFilters;
        });
        setCurrentPage(1);
    };
    const handleResetFilters = () => {
        setAppliedFilters({});
        setSearchTerm('');
        setShowFilters(false);
        setCurrentPage(1);
        setAssignCategory(0);
    };

    const handleRowClick = (rowData: TableDataItem) => {
        const detailUrl = `/transactions/${rowData.id}`;

        if (activeFilterCount > 0) {
            window.open(detailUrl, '_blank');
        } else {
            router.push(detailUrl);
        }
    };
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                {
                    role === 6 || role === 7 && (
                        <div className="w-full xl:w-64">
                            <Select
                                placeholder="Semua Kategori"
                                options={selectCategoryOptions}
                                value={_.find(selectCategoryOptions, { value: assignCategory.toString() })}
                                onValueChange={(selectedOption: any) => {
                                    setAssignCategory(Number(selectedOption?.value || 0));
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    )
                }
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
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search..."
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {
                    role === 2 && (
                        <button
                            onClick={() => router.push("/transactions/create")}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg font-bold">+</span>
                            Tambahkan Transaksi
                        </button>
                    )
                }
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

            {/* Table */}
            <Table
                data={data}
                columns={columnsNew}
                pagination={true}
                // selection={true}
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
                url={
                    role === 1 || role === 4 || role === 8
                        ? `transaction/${selectedData?.id}`
                        : `sales/transaction/${selectedData?.id}/delete`
                }
                itemName={""}
                selectedData={selectedData}
                onSuccess={getData}
                message="Transaction deleted successfully!"
            />

            <EditUserModal
                isOpen={isEditOpen}
                selectedId={selectedData?.id}
                onClose={() => setIsEditOpen(false)}
                onSuccess={getData}
            />
        </div>
    );
}


