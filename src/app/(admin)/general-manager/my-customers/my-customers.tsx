"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, endpointUrlv2, httpPost, httpGet } from "@/../helpers";
import { useSearchParams, useRouter } from "next/navigation";
import moment from "moment";
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { FaCheckDouble } from "react-icons/fa";
import DynamicFilterCard from "@/components/filters/DynamicFilterCard";
import { Filter, Users, X } from "lucide-react";
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
    categories?: any[];
}

interface CategoryOption {
    id: number;
    name: string;
}

export default function CustomerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [data, setData] = useState<TableDataItem[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<TableDataItem[]>([]);
    const [filterOptions, setFilterOptions] = useState<any[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [columns, setColumns] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [assignCategory, setAssignCategory] = useState<any>(0);

    useEffect(() => {
        const paramCategory = searchParams.get("assign_category");
        if (paramCategory) {
            setAssignCategory(Number(paramCategory));
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [filterRes, categoryRes] = await Promise.all([
                    httpGet(endpointUrl('/data-filter'), true),
                    httpGet(endpointUrl('master/customer-category/dropdown'), true)
                ]);

                setFilterOptions(filterRes.data.data);
                setCategoryOptions(categoryRes.data.data);
            } catch (error) {
                console.error("Failed to load initial options", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        getData();
    }, [currentPage, perPage, appliedFilters, assignCategory, searchTerm]);

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

    const columnsNew = useMemo(() => {
        const defaultColumns = [
            {
                id: "member_no",
                header: "Nomor Anggota",
                accessorKey: "member_no",
                cell: ({ row }: any) => (
                    <button className="text-blue-600 hover:underline" onClick={() => handleRowClick(row)}>
                        {row.member_no}
                    </button>
                )
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
                        </>
                    )
                }
            },
            {
                id: "phone",
                header: "No. Telp",
                accessorKey: "phone",
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
    }, [columns, appliedFilters]);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const pageParam = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const payload: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: pageParam ? Number(pageParam) : currentPage,
            filters: appliedFilters,
            assign_category: assignCategory,
            assign_by_me: 1,
        };

        try {
            const response = await httpPost(
                endpointUrl("/customer/list"),
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
        setAssignCategory(0);
        setCurrentPage(1);
    };

    const handleRowClick = (rowData: TableDataItem) => {
        const activeFilterCount = Object.keys(appliedFilters).length;
        const detailUrl = `/general-manager/customer-lists/${rowData.id}`;
        if (activeFilterCount > 0) {
            window.open(detailUrl, '_blank');
        } else {
            router.push(detailUrl);
        }
    };

    const activeFilterCount = Object.keys(appliedFilters).length;

    return (
        <div className="space-y-4">
            <div className="flex flex-col xl:flex-row justify-end items-start xl:items-center gap-3">
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

                <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-2 items-center">


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

                    {(activeFilterCount > 0 || assignCategory !== 0 || searchTerm !== '') && (
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
                        placeholder="Cari customer..."
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
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
                        className="relative z-[100]"
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
            />


        </div>
    );
}