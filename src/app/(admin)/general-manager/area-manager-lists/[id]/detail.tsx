"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, endpointUrlv2, httpGet } from "@/../helpers";
import { 
    FaUserTie, 
    FaPhoneAlt, 
    FaEnvelope, 
    FaMapMarkerAlt, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaUsers,
    FaIdCard
} from "react-icons/fa";
import Table from "@/components/tables/Table";
import moment from "moment";
import { toast } from "react-toastify";

interface ManagerData {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string; 
    status: string | number;
    address?: string;
    created_at: string;
}

interface CustomerData {
    id: number;
    name: string;
    member_no: string;
    phone: string;
    status: string;
    created_at: string;
}

export default function AreaManagerDetailPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [loadingManager, setLoadingManager] = useState(true);
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (id) {
            const getManagerDetail = async () => {
                try {
                    setLoadingManager(true);
                    const response = await httpGet(endpointUrlv2(`/manager/${id}`), true);
                    setManager(response.data.data);
                } catch (error) {
                    console.error("Error fetching manager details:", error);
                    toast.error("Failed to load manager data.");
                } finally {
                    setLoadingManager(false);
                }
            };
            getManagerDetail();
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const getAssignedCustomers = async () => {
            setLoadingCustomers(true);
            const search = searchTerm.trim();
            const pageParam = searchParams.get("page");
            const perPageParam = searchParams.get("per_page");

            const queryParams: any = {
                ...(search ? { search } : {}),
                per_page: perPageParam ? Number(perPageParam) : perPage,
                page: pageParam ? Number(pageParam) : currentPage,
            };

            try {
                const response = await httpGet(
                    endpointUrlv2(`/manager/${id}/customer`), 
                    true,
                    queryParams
                );
                
                const responseData = response.data.data.data; 
                const pageInfo = response.data.data.page_info;

                setCustomers(responseData || []);
                setLastPage(pageInfo?.total_pages || 1);
                setCount(pageInfo?.total_record || 0);

            } catch (error) {
                console.error("Error fetching customers:", error);
                toast.error("Failed to fetch assigned customers.");
            } finally {
                setLoadingCustomers(false);
            }
        };

        getAssignedCustomers();
    }, [currentPage, perPage, searchTerm, id, searchParams]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    const handleRowClick = (rowData: any) => {
        router.push(`/general-manager/customer-lists/${rowData.id}`); 
    };

    const columns = useMemo(() => [
        {
            id: "member_no",
            header: "No. Anggota",
            accessorKey: "member_no",
            cell: ({ row }: any) => (
                <span className="hover:underline text-blue-600">
                    {row.member_no}
                </span>
            )
        },
        {
            id: "name",
            header: "Nama Customer",
            accessorKey: "name",
        },
        {
            id: "phone",
            header: "No. Telepon",
            accessorKey: "phone",
            cell: ({ row }: any) => row.phone || "-"
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: any) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    row.status === '1' || row.status === 1 || row.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                    {row.status === '1' || row.status === 1 || row.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            id: "created_at",
            header: "Terdaftar",
            accessorKey: "created_at",
            cell: ({ row }: any) => moment(row.created_at).format("DD MMM YYYY")
        }
    ], []);

    if (loadingManager && !manager) {
        return <div className="text-center p-10">Loading manager data...</div>;
    }

    if (!manager) {
        return <div className="text-center p-10 text-red-500">Manager not found.</div>;
    }

    return (
        <ComponentCard title={`Area Manager: ${manager.name}`}>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUserTie className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {manager.name}
                            </h2>
                            <div className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${
                                manager.status === '1' || manager.status === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                                {manager.status === '1' || manager.status === 1 ? <FaCheckCircle /> : <FaTimesCircle />}
                                {manager.status === '1' || manager.status === 1 ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-3">
                            <FaEnvelope className="w-4 h-4 mt-1 text-gray-400" />
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide">Email</span>
                                <span className="font-semibold">{manager.email || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FaPhoneAlt className="w-4 h-4 mt-1 text-gray-400" />
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide">No. Telp</span>
                                <a href={`tel:${manager.phone}`} className="font-semibold hover:underline text-blue-600">
                                    {manager.phone || '-'}
                                </a>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <FaIdCard className="w-4 h-4 mt-1 text-gray-400" />
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide">Role</span>
                                <span className="font-semibold capitalize">{manager.role || 'Manager'}</span>
                            </div>
                        </div>

                        {manager.address && (
                            <div className="flex items-start gap-3">
                                <FaMapMarkerAlt className="w-4 h-4 mt-1 text-gray-400" />
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase tracking-wide">Alamat</span>
                                    <p className="font-semibold">{manager.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                    <div className="flex flex-col md:flex-row justify-between items-center p-3 gap-4">
                        <div className="flex items-center gap-3">
                            <FaUsers className="text-gray-500 w-5 h-5" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Assigned Customers
                            </h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                {count} Total
                            </span>
                        </div>

                        <div className="w-full md:w-auto">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Cari nama atau member no..."
                                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <Table
                        data={customers}
                        columns={columns}
                        pagination={true}
                        lastPage={lastPage}
                        total={count}
                        loading={loadingCustomers}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onRowClick={handleRowClick}
                    />
                </div>

            </div>
        </ComponentCard>
    );
}