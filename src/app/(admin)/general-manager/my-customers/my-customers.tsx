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
import { Filter, X } from "lucide-react";
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
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState<number | "">("");
    const [isAssigning, setIsAssigning] = useState(false);

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
                    httpGet(endpointUrlv2('/data-filter'), true),
                    httpGet(endpointUrlv2('master/customer-category/dropdown'), true)
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

    const selectCategoryAssignOptions = useMemo(() => {
        const mappedOptions = categoryOptions.map(cat => ({
            value: cat.id.toString(),
            label: cat.name
        }));

        return [...mappedOptions];
    }, [categoryOptions]);

    const handleBulkAssign = async () => {
        if (!targetCategoryId) {
            toast.error("Silakan pilih kategori terlebih dahulu.");
            return;
        }

        if (selectedRows.length === 0) {
            toast.error("Tidak ada customer yang dipilih.");
            return;
        }

        setIsAssigning(true);
        try {
            const payload = {
                customer_ids: selectedRows.map((row) => row.id),
                category_id: Number(targetCategoryId)
            };

            await httpPost(endpointUrlv2("/customer/assign-category-customer"), payload, true);

            toast.success("Berhasil mengubah kategori customer!");

            setIsAssignModalOpen(false);
            setTargetCategoryId("");
            setSelectedRows([]);
            getData();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengubah kategori.");
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
            assign_by_me: 1
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
        setAssignCategory(0);
        setCurrentPage(1);
    };

    const handleRowClick = (rowData: TableDataItem) => {
        const activeFilterCount = Object.keys(appliedFilters).length;
        const detailUrl = `/area-manager/my-customers/${rowData.id}`;
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