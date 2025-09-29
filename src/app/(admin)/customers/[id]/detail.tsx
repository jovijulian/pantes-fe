"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, httpGet } from "../../../../../helpers"; // Sesuaikan path helper
import {
    FaUserCircle,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaInfoCircle,
    FaBirthdayCake,
    FaGift,
    FaCheckCircle,
    FaTimesCircle,
    FaHistory
} from "react-icons/fa";
import Table from "@/components/tables/Table";
import moment from "moment";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

// Interface untuk tipe data customer
interface CustomerData {
    id: number;
    name: string;
    phone: string;
    date_of_birth: string | null;
    address: string | null;
    date_anniv: string | null;
    detail_information: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

// Helper untuk memformat tanggal agar lebih mudah dibaca
const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export default function CustomerDetailPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<CustomerData | null>(null);
    const params = useParams();
    const id = Number(params.id);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const router = useRouter()
    const page = searchParams.get("page") || "1";
    const [dataHistory, setDataHistory] = useState<[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedData, setSelectedData] = useState<any>(null);
    const [role, setRole] = useState<number | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const getDetail = async (customerId: number) => {
        try {
            const response = await httpGet(endpointUrl(`/customer/${customerId}`), true);
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching customer details:", error);
        }
    };

    useEffect(() => {
        if (id) {
            getDetail(id);
            
        }
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(parseInt(storedRole));
        }
    }, [id]);

    useEffect(() => {
        getDataHistory();
    }, [searchParams, currentPage, perPage, page, searchTerm]);

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
                id: "date",
                header: "Transaction Date",
                accessorKey: "date",
                cell: ({ row }: any) => {
                    const data = row;
                    return (
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                                router.push(`/transactions/${data.id}`);
                            }}
                        >
                            {moment(data.date).format("DD/MM/YYYY")}
                        </button>
                    );
                }
            },
            {
                id: "name",
                header: "Customer Name",
                accessorKey: "name",
                cell: ({ row }: any) => <span>{row.customer.name}</span>,
            },
            {
                id: "phone",
                header: "Customer Phone Number",
                accessorKey: "phone",
                cell: ({ row }: any) => <span>{row.customer.phone}</span>,
            },
            {
                id: "name_purchase",
                header: "Purchase Name",
                accessorKey: "name_purchase",
                cell: ({ row }: any) => <span>{row.name_purchase}</span>,
            },
            ...(role === 1
                ? [
                    {
                        id: "sales",
                        header: "Sales Name",
                        accessorKey: "sales",
                        cell: ({ row }: any) => <span>{row.sales.name}</span>,
                    },
                ]
                : []),
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

    const getDataHistory = async () => {
        setIsLoadingHistory(true);
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
                endpointUrl(`/customer/${id}/history`),
                true,
                params
            );

            const responseData = response.data.data.data;
            setDataHistory(responseData);
            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);
        } catch (error) {
            toast.error("Failed to fetch data");
            setDataHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    if (!data) {
        return <div className="text-center p-10">Loading customer data...</div>;
    }

    return (
        <ComponentCard title={`Customer Detail: ${data.name}`}>
            <div className="space-y-6">

                {/* --- Kartu Informasi Utama --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                        <FaUserCircle className="w-8 h-8 text-blue-500" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{data.name}</h2>
                            <div className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${data.status === '1'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                {data.status === '1' ? <FaCheckCircle /> : <FaTimesCircle />}
                                {data.status === '1' ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-3">
                            <FaPhoneAlt className="w-4 h-4 mt-1 text-gray-400" />
                            <div>
                                <span className="block text-xs text-gray-500">Phone</span>
                                <a href={`tel:${data.phone}`} className="font-semibold hover:underline">{data.phone || 'N/A'}</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="w-4 h-4 mt-1 text-gray-400" />
                            <div>
                                <span className="block text-xs text-gray-500">Address</span>
                                <p className="font-semibold">{data.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Kartu Tanggal Penting --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-3">
                            <FaBirthdayCake className="w-5 h-5 text-pink-500" />
                            <div>
                                <span className="block text-xs text-gray-500">Date of Birth</span>
                                <span className="font-semibold">{formatDate(data.date_of_birth)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaGift className="w-5 h-5 text-red-500" />
                            <div>
                                <span className="block text-xs text-gray-500">Anniversary</span>
                                <span className="font-semibold">{formatDate(data.date_anniv)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Kartu Informasi Tambahan & Metadata --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="w-4 h-4 mt-1 text-gray-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Additional Information</h3>
                            <p className="text-gray-600 dark:text-gray-400 italic">
                                {data.detail_information || 'No additional information provided.'}
                            </p>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p>Data Created: {formatDate(data.created_at)}</p>
                                <p>Last Updated: {formatDate(data.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-3 p-6">
                        <FaHistory className="w-6 h-6 text-gray-500" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h3>
                    </div>
                    <Table
                        data={dataHistory}
                        columns={columnsNew}
                        pagination={true}
                        // selection={true}
                        lastPage={lastPage}
                        total={count}
                        loading={isLoadingHistory}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onRowClick={(rowData) => router.push(`/transactions/${rowData.id}`)}
                    />
                </div>
            </div>
        </ComponentCard>
    );
}