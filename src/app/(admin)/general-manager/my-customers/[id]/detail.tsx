"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, endpointUrlv2, httpGet } from "@/../helpers";
import { FaUserCircle, FaPhoneAlt, FaMapMarkerAlt, FaInfoCircle, FaBirthdayCake, FaGift, FaCheckCircle, FaTimesCircle, FaHistory, FaTags } from "react-icons/fa";
import Table from "@/components/tables/Table";
import moment from "moment";
import {toast} from "react-toastify";

interface Category {
    id: number;
    name: string;
    note: string | null;
    status: string;
}

interface CustomerData {
    id: number;
    name: string;
    member_no: string;
    phone: string;
    date_of_birth: string | null;
    address: string | null;
    date_anniv: string | null;
    detail_information: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    categories: Category[];
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const parseAndFormatValue = (value: string): string => {
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map(item => item.value).join(', ');
        }
    } catch (e) {
        return value;
    }
    return value;
};

export default function CustomerDetailPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<CustomerData | null>(null);
    const params = useParams();
    const id = Number(params.id);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const page = searchParams.get("page") || "1";
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyColumns, setHistoryColumns] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (id) {
            const getDetail = async (customerId: number) => {
                try {
                    const response = await httpGet(endpointUrlv2(`/customer/${customerId}`), true);
                    setData(response.data.data);
                } catch (error) {
                    console.error("Error fetching customer details:", error);
                    toast.error("Failed to load customer data.");
                }
            };
            getDetail(id);
        }
    }, [searchParams, currentPage, perPage, page, searchTerm, id]);

    const handleRowClick = (id: number) => {
        const detailUrl = `/transactions/${id}`;
        window.open(detailUrl, '_blank');
    };

    useEffect(() => {
        if (!id) return;

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
                const pageInfo = response.data.data.page_info;

                const staticColumns = [
                    {
                        id: "date",
                        header: "Tanggal Transaksi",
                        cell: ({ row }: any) => (
                            <button
                                className="text-blue-600 hover:underline"
                            >
                                {moment(row.date).format("DD/MM/YYYY")}
                            </button>
                        )
                    },
                    {
                        id: "name_purchase",
                        header: "Nama Pembelian",
                        accessorKey: "name_purchase",
                    },
                    {
                        id: "total_price",
                        header: "Total Harga",
                        accessorKey: "total_price",
                        cell: ({ row }: any) => (
                            <span className="font-semibold">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.total_price)}
                            </span>
                        )
                    }
                ];

                const dynamicLabels = new Set<string>();
                responseData.forEach((transaction: any) => {
                    transaction.transaction_detail.forEach((detail: any) => {
                        if (parseInt(detail.step, 10) >= 2) {
                            dynamicLabels.add(detail.label);
                        }
                    });
                });

                const dynamicColumns = Array.from(dynamicLabels).map(label => ({
                    id: label,
                    header: label,
                    cell: ({ row }: any) => {
                        const relevantDetail = row.transaction_detail.find(
                            (d: any) => d.label === label
                        );
                        if (!relevantDetail) return "-";
                        if (label === "Price (IDR)") {
                            const prices = relevantDetail.value
                                .split(", ")
                                .map((v: string) => v.trim())
                                .filter(Boolean);

                            return (
                                <div className="flex flex-col">
                                    {prices.map((price: string, idx: number) => (
                                        <span key={idx} className="font-semibold">
                                            {new Intl.NumberFormat("id-ID", {
                                                style: "currency",
                                                currency: "IDR",
                                                minimumFractionDigits: 0,
                                            }).format(Number(price))}
                                        </span>
                                    ))}
                                </div>
                            );
                        }

                        return parseAndFormatValue(relevantDetail.value);
                    }
                }));

                setHistoryColumns([...staticColumns, ...dynamicColumns]);
                setHistoryData(responseData);
                setLastPage(pageInfo.total_pages);
                setCount(pageInfo.total_record);

            } catch (error) {
                toast.error("Failed to fetch transaction history");
            } finally {
                setIsLoadingHistory(false);
            }
        };

        getDataHistory();
    }, [searchParams, currentPage, perPage, page, searchTerm, id]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    if (!data) {
        return <div className="text-center p-10">Loading customer data...</div>;
    }

    return (
        <ComponentCard title={`Customer Detail: ${data.name}`}>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                        <FaUserCircle className="w-8 h-8 text-blue-500" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{data.name} ({data.member_no})</h2>
                            <div className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${data.status === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {data.status === '1' ? <FaCheckCircle /> : <FaTimesCircle />}
                                {data.status === '1' ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-3"><FaPhoneAlt className="w-4 h-4 mt-1 text-gray-400" /><div><span className="block text-xs text-gray-500">No. Telp</span><a href={`tel:${data.phone}`} className="font-semibold hover:underline">{data.phone || 'N/A'}</a></div></div>
                        <div className="flex items-start gap-3"><FaMapMarkerAlt className="w-4 h-4 mt-1 text-gray-400" /><div><span className="block text-xs text-gray-500">Alamat</span><p className="font-semibold">{data.address || 'N/A'}</p></div></div>
                        <div className="flex items-center gap-3"><FaBirthdayCake className="w-5 h-5 text-pink-500" /><div><span className="block text-xs text-gray-500">Tanggal Lahir</span><span className="font-semibold">{formatDate(data.date_of_birth)}</span></div></div>
                        <div className="flex items-center gap-3"><FaGift className="w-5 h-5 text-red-500" /><div><span className="block text-xs text-gray-500">Anniversary</span><span className="font-semibold">{formatDate(data.date_anniv)}</span></div></div>
                        <div className="flex items-start gap-3 md:col-span-2">
                            <FaTags className="w-4 h-4 mt-1 text-gray-400" />
                            <div className="w-full">
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Kategori</span>
                                <div className="flex flex-wrap gap-2">
                                    {data.categories && data.categories.length > 0 ? (
                                        data.categories.map((cat) => (
                                            <span
                                                key={cat.id}
                                                className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                            >
                                                {cat.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic text-sm">Tidak ada kategori</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 md:col-span-2"><FaInfoCircle className="w-4 h-4 mt-1 text-gray-400" /><div><span className="block text-xs text-gray-500">Informasi Tambahan</span><p className="text-gray-600 dark:text-gray-400 italic">{data.detail_information || 'N/A'}</p></div></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Histori Transaksi
                            </h3>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search..."
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 
                 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <Table
                        data={historyData}
                        columns={historyColumns}
                        pagination={true}
                        lastPage={lastPage}
                        total={count}
                        loading={isLoadingHistory}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onRowClick={(rowData: any) => handleRowClick(rowData.id)}
                    />
                </div>
            </div>
        </ComponentCard >
    );
}