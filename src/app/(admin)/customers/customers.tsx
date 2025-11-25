"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, endpointUrlv2, httpGet, httpPost } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditUserModal from "@/components/modal/edit/EditUserModal";
import DynamicFilterCard from "@/components/filters/DynamicFilterCard";
import { Filter, X, Users, Check } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion";
import Select from "@/components/form/Select-custom";
import _ from "lodash";

interface TableDataItem {
    id: number;
    email: string;
    name: string;
    phone: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function CustomerPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedRows, setSelectedRows] = useState<TableDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); 
    const [selectedData, setSelectedData] = useState<any>(null);
    const router = useRouter();
    const page = searchParams.get("page") || "1";
    const [data, setData] = useState<TableDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [role, setRole] = useState<number | null>(null);
    const [filterOptions, setFilterOptions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(""); 
    const [isAssigning, setIsAssigning] = useState(false); 

    const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        getData();
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            const roleId = parseInt(storedRole);
            setRole(roleId);
            if (roleId === 2) {
                fetchCategories();
            }
        }
    }, [searchParams, currentPage, perPage, page, searchTerm, appliedFilters]);

    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const response = await httpGet(endpointUrlv2('/data-filter'), true);
                setFilterOptions(response.data.data);
            } catch (error) {
                toast.error("Failed to load filter options.");
            }
        };
        fetchFilterData();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await httpGet(endpointUrlv2('/master/customer-category/dropdown'), true);
            setCategories(
                response.data.data.map((cat: any) => ({
                    value: cat.id.toString(), label: cat.name
                }))
            );
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const handleAssignCategory = async () => {
        if (!selectedCategory) {
            toast.warning("Harap pilih kategori terlebih dahulu.");
            return;
        }

        setIsAssigning(true);
        try {
            const payload = {
                customer_ids: selectedRows.map((row) => row.id),
                category_id: parseInt(selectedCategory),
            };

            await httpPost(endpointUrlv2('/customer/assign-category-customer'), payload, true);

            toast.success("Berhasil meng-assign kategori ke pelanggan.");
            setIsAssignModalOpen(false);
            setSelectedRows([]); 
            setSelectedCategory(""); 
            getData(); 
        } catch (error) {
            toast.error("Gagal meng-assign kategori.");
        } finally {
            setIsAssigning(false);
        }
    };

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
                header: "Action",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    if (role === 2) {
                        return (
                            <div className="flex items-center gap-3 w-[100px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/customers/edit/${row.id}`);
                                    }}
                                    title="Edit"
                                    className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                                >
                                    <FaEdit className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    } else {
                        return (
                            <div className="flex items-center gap-3 w-[100px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/customers/edit/${row.id}`);
                                    }}
                                    title="Edit"
                                    className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                                >
                                    <FaEdit className="w-4 h-4" />
                                </button>
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
                    }
                },
                minWidth: 160,
                maxWidth: 220,
            },
            {
                id: "member_no",
                header: "Nomor Anggota",
                accessorKey: "member_no",
                cell: ({ row }: any) => {
                    const data = row;
                    return (
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => handleRowClick(data)}
                        >
                            {data.member_no}
                        </button>
                    );
                }
            },
            {
                id: "name",
                header: "Nama",
                accessorKey: "name",
                cell: ({ row }: any) => {
                    const name = row.name;
                    const captionsString = row.captions;
                    const showCaptions = activeFilterCount > 0 && captionsString;

                    return (
                        <div>
                            <span className={`${showCaptions ? "font-semibold" : ""} text-gray-800 dark:text-white`}>
                                {name}
                            </span>
                            {showCaptions && (
                                <div className="text-xs text-gray-500 mt-1 max-w-sm truncate" title={captionsString}>
                                    {captionsString}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "category",
                header: "Kategori",
                accessorKey: "category",
                cell: ({ row }: any) => {
                    return (
                        <>
                            {row.categories && row.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {row.categories.map((cat: any) => (
                                        <span key={cat.id} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                            {cat.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {row.captions && activeFilterCount > 0 && (
                                <div className="text-xs text-gray-500 mt-1 max-w-sm truncate" title={row.captions}>
                                    {row.captions}
                                </div>
                            )}
                        </>
                    )
                }
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
        const search = searchTerm.trim();
        const page = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const payload: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
            filters: appliedFilters,
        };

        try {
            const response = await httpPost(
                endpointUrlv2("/customer/list"),
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
    };

    const handleRowClick = (rowData: TableDataItem) => {
        const detailUrl = `/customers/${rowData.id}`;

        if (activeFilterCount > 0) {
            window.open(detailUrl, '_blank');
        } else {
            router.push(detailUrl);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                    {role === 2 && selectedRows.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setIsAssignModalOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            <span>Assign Kategori ({selectedRows.length})</span>
                        </motion.button>
                    )}

                    <button
                        onClick={() => setShowFilters(prev => !prev)}
                        className={`w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
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
                    <button
                        onClick={() => router.push("/customers/create")}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="text-lg font-bold">+</span>
                        Tambahkan Pelanggan
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

                {/* Table: Selection Enabled */}
                <Table
                    data={data}
                    columns={columnsNew}
                    pagination={true}
                    selection={true} // ENABLED
                    lastPage={lastPage}
                    total={count}
                    loading={isLoading}
                    checkedData={selectedRows}
                    setCheckedData={setSelectedRows}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                // onRowClick={handleRowClick}
                />

                <DeactiveModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedData(null);
                    }}
                    url={`customer/${selectedData?.id}/deactive`}
                    itemName={selectedData?.name || ""}
                    selectedData={selectedData}
                    onSuccess={getData}
                    message="Customer deleted successfully!"
                />

                <EditUserModal
                    isOpen={isEditOpen}
                    selectedId={selectedData?.id}
                    onClose={() => setIsEditOpen(false)}
                    onSuccess={getData}
                />

                <AnimatePresence>
                    {isAssignModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
                            >
                                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                                    Assign Kategori ke {selectedRows.length} Pelanggan
                                </h3>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Pilih Kategori
                                    </label>
                                    <Select
                                        onValueChange={(e) => setSelectedCategory(e.value)}
                                        placeholder={"Pilih Kategori"}
                                        value={_.find(categories, { value: selectedCategory })}
                                        options={categories}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                        disabled={isAssigning}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleAssignCategory}
                                        disabled={isAssigning || !selectedCategory}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isAssigning ? (
                                            <>
                                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Simpan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}