"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import { endpointUrl, endpointUrlv2, httpPost, httpGet } from "@/../helpers";
import { useSearchParams, useRouter } from "next/navigation";
import moment from "moment";
import { toast } from "react-toastify";
import { FaPlus, FaUserTie, FaEye, FaUsers } from "react-icons/fa";
import { Filter, Trash, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Select from "@/components/form/Select-custom";
import _ from "lodash";
interface SalesData {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface CustomerCategory {
    id: number;
    name: string;
}

interface CustomerData {
    id: number;
    name: string;
    member_no: string;
    phone: string;
    date_of_birth: string;
    address: string;
    status: string;
    created_at: string;
    categories: CustomerCategory[];
}

export default function MySalesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [data, setData] = useState<SalesData[]>([]);
    const [selectedRows, setSelectedRows] = useState<SalesData[]>([]);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [salesOptions, setSalesOptions] = useState<SelectOption[]>([]);
    const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedSales, setSelectedSales] = useState<SalesData | null>(null);
    const [customerData, setCustomerData] = useState<CustomerData[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerPage, setCustomerPage] = useState(1);
    const [customerLastPage, setCustomerLastPage] = useState(1);
    const [customerTotal, setCustomerTotal] = useState(0);
    const [customerPerPage, setCustomerPerPage] = useState(10);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    useEffect(() => {

        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const response = await httpGet(endpointUrl('master/sales/dropdown'), true);
            const options = response.data.data.map((item: any) => ({
                value: item.id.toString(),
                label: item.name
            }));
            setSalesOptions(options);
        } catch (error) {
            console.error("Failed to load sales options", error);
        }
    };

    useEffect(() => {
        getData();
    }, [currentPage, perPage, searchTerm]);

    const getData = async () => {
        setIsLoading(true);
        const search = searchTerm.trim();
        const pageParam = searchParams.get("page");
        const perPageParam = searchParams.get("per_page");

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam ? Number(perPageParam) : perPage,
            page: pageParam ? Number(pageParam) : currentPage,
        };

        try {
            const response = await httpGet(
                endpointUrl("/manager/my-sales"),
                true,
                params
            );
            const responseData = response.data.data.sales_list;
            setData(responseData);
            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);
        } catch (error) {
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getCustomers = async (salesId: number, page: number = 1) => {
        setCustomerLoading(true);
        try {
            const params = {
                page: page,
                per_page: customerPerPage
            };

            const response = await httpGet(
                endpointUrl(`/manager/my-sales/${salesId}/customer`),
                true,
                params
            );

            const { customer_list, page_info } = response.data.data;
            setCustomerData(customer_list);
            setCustomerTotal(page_info.total_record);
            setCustomerLastPage(page_info.total_pages);
            setCustomerPage(page_info.current_page);

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memuat data customer");
            setCustomerData([]);
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleOpenCustomerModal = (sales: SalesData) => {
        setSelectedSales(sales);
        setIsCustomerModalOpen(true);
        setCustomerPage(1);
        getCustomers(sales.id, 1);
    };

    const handleCustomerPageChange = (newPage: number) => {
        if (selectedSales) {
            setCustomerPage(newPage);
            getCustomers(selectedSales.id, newPage);
        }
    };

    const handleClaimSales = async () => {
        if (selectedSalesIds.length === 0) {
            toast.error("Silakan pilih minimal satu sales.");
            return;
        }

        setIsClaiming(true);
        try {
            const payload = {
                sales_ids: selectedSalesIds.map(id => Number(id))
            };

            await httpPost(endpointUrl("/manager/my-sales"), payload, true);
            toast.success("Berhasil meng-claim sales!");
            setIsClaimModalOpen(false);
            setSelectedSalesIds([]);
            getData();
            fetchOptions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal meng-claim sales.");
        } finally {
            setIsClaiming(false);
        }
    };

    const handlePageChange = (page: number) => setCurrentPage(page);

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const columns = useMemo(() => [
        {
            id: "action",
            header: "Aksi",
            accessorKey: "id",
            cell: ({ row }: any) => (
                <button
                    onClick={() => handleOpenCustomerModal(row)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors border border-indigo-200"
                >
                    <FaUsers className="w-3 h-3" />
                    <span>Lihat Customer</span>
                </button>
            )
        },
        {
            id: "name",
            header: "Nama Sales",
            accessorKey: "name",
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                        <FaUserTie className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {row.name}
                    </span>
                </div>
            )
        },
        {
            id: "email",
            header: "Email",
            accessorKey: "email",
        },
        {
            id: "phone",
            header: "No. Telp",
            accessorKey: "phone",
            cell: ({ row }: any) => row.phone || "-"
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: any) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === '1' || row.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {row.status === '1' || row.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            )
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
    ], []);

    const customerColumns = useMemo(() => [
        {
            id: "name",
            header: "Nama Customer",
            accessorKey: "name",
            cell: ({ row }: any) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {row.name}
                    <div className="text-xs text-gray-500 font-normal">{row.member_no}</div>
                </div>
            )
        },
        {
            id: "contact",
            header: "Kontak",
            accessorKey: "phone",
            cell: ({ row }: any) => (
                <div className="flex flex-col text-sm">
                    <span>{row.phone}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{row.address}</span>
                </div>
            )
        },
        {
            id: "categories",
            header: "Kategori",
            accessorKey: "categories",
            cell: ({ row }: any) => (
                <div className="flex flex-wrap gap-1">
                    {row.categories && row.categories.length > 0 ? (
                        row.categories.map((cat: CustomerCategory) => (
                            <span key={cat.id} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                {cat.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </div>
            )
        },
        {
            id: "created_at",
            header: "Join Date",
            accessorKey: "created_at",
            cell: ({ row }: any) => <span className="text-xs">{moment(row.created_at).format("DD MMM YYYY")}</span>,
        },
    ], []);

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) {
            toast.error("Tidak ada sales yang dipilih.");
            return;
        }

        setIsDeleting(true);
        try {
            const payload = {
                sales_ids: selectedRows.map((row) => row.id),
            };

            await httpPost(endpointUrl("/manager/my-sales/delete"), payload, true);

            toast.success("Berhasil menghapus sales!");

            setIsDeleteModalOpen(false);
            setSelectedRows([]);
            getData();
            fetchOptions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menghapus sales.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">
                {selectedRows.length > 0 && (
                    <>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                            <Trash className="w-4 h-4" />
                            <span>Hapus sales ({selectedRows.length})</span>
                        </motion.button>
                    </>

                )}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Cari sales..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-10"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsClaimModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm transition-all"
                    >
                        <FaPlus className="w-3 h-3" />
                        <span>Klaim Sales</span>
                    </button>
                </div>
            </div>

            <Table
                data={data}
                columns={columns}
                pagination={true}
                lastPage={lastPage}
                total={count}
                checkedData={selectedRows}
                setCheckedData={setSelectedRows}
                selection={true}
                loading={isLoading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Hapus sales
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Anda akan menghapus <strong>{selectedRows.length}</strong> sales yang dipilih di area anda.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                disabled={isDeleting}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    "Hapus sales"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isClaimModalOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Klaim Sales Baru
                            </h3>
                            <button
                                onClick={() => setIsClaimModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Pilih sales dari daftar master untuk ditambahkan ke tim Anda. Bisa memilih lebih dari satu.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Pilih Sales
                            </label>
                            <Select
                                isMulti={true}
                                placeholder="Cari dan pilih sales..."
                                options={salesOptions}
                                value={salesOptions.filter(opt => selectedSalesIds.includes(opt.value))}
                                onValueChange={(selectedOptions: any) => {
                                    const ids = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
                                    setSelectedSalesIds(ids);
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsClaimModalOpen(false);
                                    setSelectedSalesIds([]);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm font-medium"
                                disabled={isClaiming}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleClaimSales}
                                disabled={isClaiming || selectedSalesIds.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-sm"
                            >
                                {isClaiming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    "Klaim Sales"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-0 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Daftar Customer
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Sales: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedSales?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900/50">
                            <Table
                                data={customerData}
                                columns={customerColumns}
                                pagination={true}
                                lastPage={customerLastPage}
                                total={customerTotal}
                                loading={customerLoading}
                                onPageChange={handleCustomerPageChange}
                            />
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}