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
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import EditUserModal from "@/components/modal/edit/EditUserModal";


interface TableDataItem {
    id: number;
    email: string;
    name: string;
    phone: string;
    status: string;
    created_at: string;
    updated_at: string;
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
            className = "text-sky-500 bg-sky-50";
            text = "Active";
        } else {
            className = "text-red-500 bg-red-50";
            text = "Inactive";
        }

        return <span className={`px-3 py-1 rounded-md text-sm font-medium ${className}`}>{text}</span>;
    };

    const columnsNew = useMemo(() => {
        const defaultColumns = [
            {
                id: "action",
                header: "Action",
                accessorKey: "action",
                cell: ({ row }: any) => {
                    return (
                        <div className="flex items-center gap-3 w-[100px]">
                            {/* Edit */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedData(row);
                                    setIsEditOpen(true);
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
                id: "name",
                header: "Name",
                accessorKey: "name",
                cell: ({ row }: any) => <span>{row.name}</span>,
            },
            {
                id: "phone",
                header: "Phone Number",
                accessorKey: "phone",
                cell: ({ row }: any) => <span>{row.phone}</span>,
            },
            {
                id: "email",
                header: "Email",
                accessorKey: "email",
                cell: ({ row }: any) => <span>{row.email}</span>,
            },
            {
                id: "role_id",
                header: "Role",
                accessorKey: "role_id",
                cell: ({ row }: any) => {
                    const roleId = row.role_id;

                    let roleText = '';
                    let className = '';

                    if (roleId == 2) {
                        roleText = 'Sales';
                        className = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                    } else if (roleId == 1) {
                        roleText = 'Admin';
                        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                    } else {
                        roleText = `Unknown Role (${roleId})`;
                        className = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
                    }
                    return (
                        <span
                            className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${className}`}
                        >
                            {roleText}
                        </span>
                    );
                },
            },
            {
                id: "status",
                header: "Status",
                accessorKey: "status",
                accessorFn: (row: any) => {
                    const status = row.status;
                    if (status == 1) return "Active";
                    if (status == 2) return "Inactive";
                    return "Unknown";
                },
                cell: ({ row }: any) => <span>{statusText(row.status)}</span>,
            },
            {
                id: "total_customer",
                header: "Total Customer",
                accessorKey: "total_customer",
                cell: ({ row }: any) => <span className="text-bold text-md">{row.customers_count || 0}</span>,
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

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: page ? Number(page) : currentPage,
        };

        try {
            const response = await httpGet(
                endpointUrl("/sales"),
                true,
                params
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
    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        onClick={() => router.push("/sales-accounts/create")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="text-lg font-bold">+</span>
                        Add Sales Account
                    </button>
                </div>
            </div>

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
                url={`sales/${selectedData?.id}/deactive`}
                itemName={selectedData?.name || ""}
                selectedData={selectedData}
                onSuccess={getData}
                message="Sales deleted successfully!"
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


