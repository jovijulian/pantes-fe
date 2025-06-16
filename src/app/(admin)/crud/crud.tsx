"use client";

import Table from "@/components/tables/Table";
import { Metadata } from "next";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrl, httpDelete, httpGet } from "@/../helpers";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import EditModal from "@/components/modal/edit/EditModal";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import DateRangePicker from "@/components/common/DateRangePicker";

interface TableDataItem {
    id: number;
    user_id: number;
    customer_id: number;
    feature_id: number;
    number_spk: string;
    number_plate: string;
    notes: string | null;
    is_done: number;
    status: number;
    created_at: string;
    updated_at: string;
}


export default function CrudPage() {
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

    useEffect(() => {
        getData();
    }, [searchParams, currentPage, perPage, page, searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const statusText = (status: number) => {
        let className = "";
        let text = "";

        if (status == 1) {
            className = "text-white bg-green-600";
            text = "Done";
        } else {
            className = "text-white bg-yellow-600";
            text = "On Progress";
        }

        return (
            <span
                className={`inline-block w-[120px] text-center px-3 py-1 rounded-md text-xs font-medium ${className}`}
            >
                {text}
            </span>
        );
    };


    const columnsNew = useMemo(() => {
        const defaultColumns = [
            {
                id: "action",
                header: "Action",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    const role = localStorage.getItem("role")
                    if (role == "3") {
                        return <span className="text-xs italic text-gray-500">No access</span>;
                    }
                    return (
                        <div className="flex items-center gap-2">
                            {/* Add Field */}
                            {/* Edit */}
                            <button
                                onClick={() => {
                                    setSelectedData(row);
                                    setIsEditOpen(true);
                                }}
                                title="Edit"
                                className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                            >
                                <FaEdit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => {
                                    setSelectedData(row);
                                    setIsDeleteModalOpen(true);
                                }}
                                title="Delete"
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
                minWidth: "50px",
                maxWidth: "70px",
            },
            {
                id: "number_spk",
                header: "SPK Number",
                accessorKey: "number_spk",
                cell: ({ row }: any) => {
                    const data = row;
                    return (
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                                router.push(`/crud/${data.id}`);
                            }}
                        >
                            {data.number_spk}
                        </button>
                    );
                }
            },
            {
                id: "owner_name",
                header: "Owner Name",
                accessorKey: "owner_name",
                cell: ({ row }: any) => <span>{row.customer.owner_name}</span>,
            },
            {
                id: "number_plate",
                header: "Number Plate",
                accessorKey: "number_plate",
                cell: ({ row }: any) => <span>{row.number_plate}</span>,
            },
            {
                id: "mechanic",
                header: "Mechanic",
                accessorKey: "mechanic",
                cell: ({ row }: any) => <span>{row.mechanic.name}</span>,
            },
            {
                id: "is_done",
                header: "Done",
                accessorKey: "is_done",
                cell: ({ row }: any) => <>{statusText(row.is_done)}</>,
            },
            {
                id: "created_at",
                header: "Created At",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
            {
                id: "updated_at",
                header: "Updated At",
                accessorKey: "updated_at",
                cell: ({ row }: any) => <span>{moment(row.updated_at).format("DD MMM YYYY, HH:mm")}</span>,
            },
        ];
        return [...defaultColumns, ...columns.filter((col) => col.field !== "id" && col.field !== "hide_this_column_field")];
    }, [columns]);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();;
        const page = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");
        const currentStartDate = searchParams.get("start_date");
        const currentEndDate = searchParams.get("end_date");

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
        };
        if (currentStartDate) params.start_date = currentStartDate;
        if (currentEndDate) params.end_date = currentEndDate;

        try {
            const response = await httpGet(
                endpointUrl("transaction"), true, params
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

    const handleDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        if (dates.startDate) {
            currentParams.set("start_date", dates.startDate);
        } else {
            currentParams.delete("start_date");
        }
        if (dates.endDate) {
            currentParams.set("end_date", dates.endDate);
        } else {
            currentParams.delete("end_date");
        }
        router.push(`?${currentParams.toString()}`);
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    return (
        <div className="space-y-4">

            {/* Action Buttons */}
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <DateRangePicker
                        onDatesChange={handleDatesChange}
                        initialStartDate={searchParams.get("start_date") || moment().subtract(7, 'days').format('YYYY-MM-DD')}
                        initialEndDate={searchParams.get("end_date") || moment().format('YYYY-MM-DD')}
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />

                    <button
                        onClick={() => router.push("/crud/create")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Create
                    </button>
                    {/* {selectedRows.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            Delete Selected ({selectedRows.length})
                        </button>
                    )} */}
                </div>
            </div>

            {selectedRows.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Selected {selectedRows.length} row(s): {selectedRows.map(row => row.number_spk).join(', ')}
                    </p>
                    <button
                        onClick={() => setSelectedRows([])}
                        className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Clear Selection
                    </button>
                </div>
            )}

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

            />

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedData(null);
                }}
                url={`crud/${selectedData?.id}/deactive`}
                itemName={selectedData?.number_spk || ""}
                selectedData={selectedData}
                onSuccess={getData}
                message="crud deleted successfully!"
            />

            <EditModal
                isOpen={isEditOpen}
                selectedId={selectedData?.id}
                onClose={() => setIsEditOpen(false)}
                onSuccess={getData}
            />
        </div>
    );
}
