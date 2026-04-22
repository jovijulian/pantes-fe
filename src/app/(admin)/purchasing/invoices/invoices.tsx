"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrl, endpointUrlv2, httpGet, httpPost, httpPut } from "@/../helpers";
import { useSearchParams, useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import {
    FaEdit, FaEye, FaCheck, FaCheckCircle, FaDollarSign
} from "react-icons/fa";
import Select from '@/components/form/Select-custom';
import _ from "lodash";
import ChangeStatusDepositModal from "@/components/modal/ChangeStatusDepositModal";
import { CheckCircle2, FileClock, Loader2, Plus } from "lucide-react";
import { useTableFilters } from "@/hooks/useTableFilters";
interface IDeposit {
    id: number;
    no_payment: string;
    employee_id: string;
    employee: { name: string };
    supplier_id: string;
    supplier: { name: string };
    date: string;
    notes: string | null;
    status: "1" | "2" | "3" | "4" | null;
    created_at: string;
    updated_at: string;
}
type ModalAction = 'Validasi' | 'Setor' | 'Lunas' | null;
const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "1", label: "Baru" },
    { value: "2", label: "Valid" },
    { value: "3", label: "Setor" },
    { value: "4", label: "Lunas" },
];

export default function DepositsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [data, setData] = useState<IDeposit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [metaCount, setMetaCount] = useState({
        total_invoice: 0,
        total_uninvoice: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState<IDeposit | null>(null);
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
    const { filters, setFilter } = useTableFilters({
        page: 1,
        per_page: 20,
        search: '',
        is_invoice: '1'
    });

    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };
    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gr";
    };

    const getStatusBadge = (status: string | null) => {
        if (status === null) {
            status = "1";
        }

        let color: "success" | "warning" | "info";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'Baru'; break;
            case '2': color = 'info'; label = 'Valid'; break;
            case '3': color = 'info'; label = 'Setor'; break;
            case '4': color = 'success'; label = 'Lunas'; break;
            default: color = 'warning'; label = 'Baru'; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };
    const getData = async () => {
        setIsLoading(true);
        const params: any = {
            ...(filters.search ? { search: filters.search.trim() } : {}),
            per_page: filters.per_page,
            page: filters.page,
            is_invoice: filters.is_invoice,
        };
        try {
            const response = await httpGet(endpointUrl("invoice-order"), true, params);
            const responseData = response.data.data.data;
            setData(responseData);

            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);

            if (response.data.data.meta) {
                setMetaCount(response.data.data.meta);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to fetch data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, [filters]);

    const handlePageChange = (page: number) => {
        setFilter("page", page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setFilter("per_page", newPerPage);
        setFilter("page", 1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter("search", e.target.value);
        setFilter("page", 1);
    };

    const handleRowClick = (rowData: IDeposit) => {
        const detailUrl = `/purchasing/invoices/${rowData.id}`;
        router.push(detailUrl);
    };
    const handleOpenModal = (deposit: IDeposit, action: ModalAction) => {
        setSelectedDeposit(deposit);
        setModalAction(action);
        setPaymentDate(moment().format('YYYY-MM-DD'));
        setIsModalOpen(true);
    };

    const handleConfirmStatusChange = async (date?: string) => {
        if (!selectedDeposit || !modalAction) return;

        setIsSubmitting(true);
        const payload: any = { status: "" };
        let successMessage = "";

        switch (modalAction) {
            case 'Validasi':
                payload.status = "2";
                payload.validated_date = moment(date).format('YYYY-MM-DD');
                successMessage = "Setor berhasil divalidasi!";
                break;
            case 'Setor':
                payload.status = "3";
                payload.deposit_date = moment(date).format('YYYY-MM-DD');
                successMessage = "Setor berhasil di-setor!";
                break;
            case 'Lunas':
                payload.status = "4";
                payload.paid_off_date = moment(date).format('YYYY-MM-DD');
                successMessage = "Setor berhasil dilunasi!";
                break;
            default:
                setIsSubmitting(false);
                return;
        }

        try {
            await httpPost(endpointUrl(`deposit/${selectedDeposit.id}/change-status`), payload, true);
            toast.success(successMessage);
            setIsModalOpen(false);
            getData();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    const columnsNew = useMemo(() => {
        return [
            {
                id: "action",
                header: "Aksi",
                cell: ({ row }: { row: any }) => {
                    const data = row;

                    const handleClick = (e: any) => {
                        e.stopPropagation();
                        console.log(filters.is_invoice, data);
                        if (filters.is_invoice === "1") {
                            router.push(`/purchasing/invoices/${data.id}`);
                        } else {
                            if (data.type === "1") {
                                router.push(`/purchasing/orders/${data.id}`);
                            } else if (data.type === "2") {
                                router.push(`/purchasing/orders-lm/${data.id}`);
                            }
                        }
                    };

                    return (
                        <div className="flex gap-2">
                            <button
                                onClick={handleClick}
                                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                <FaEye className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
            },
            {
                id: "no_order",
                header: "No. Order",
                accessorKey: "no_order",
                cell: ({ row }: any) => (
                    <span className="font-medium">{row.no_order}</span>
                ),
            },
            {
                id: "name_supplier",
                header: "Nama Supplier",
                accessorKey: "name_supplier",
                cell: ({ row }: any) => {
                    const data = row;
                    const isInvoice = filters.is_invoice === "1";
                    return (
                        <span>
                            {isInvoice ? data?.name_supplier : data?.supplier?.name}
                        </span>
                    );
                }
            },
            {
                id: "date",
                header: "Tanggal",
                cell: ({ row }: any) => (
                    <span>
                        {moment(row.date).format("DD MMM YYYY")}
                    </span>
                ),
            },
            // 💰 DPP
            {
                id: "dpp",
                header: "DPP",
                cell: ({ row }: any) => (
                    <span>
                        {formatRupiah(row.dpp_nominal)}
                    </span>
                ),
            },
            {
                id: "pph",
                header: "PPH",
                cell: ({ row }: any) => (
                    <span>
                        {formatRupiah(row.pph)}
                    </span>
                ),
            },
            {
                id: "nominal",
                header: "Nominal",
                cell: ({ row }: any) => (
                    <span>
                        {formatRupiah(row.nominal)}
                    </span>
                ),
            },
            // {
            //     id: "created_at",
            //     header: "Dibuat",
            //     cell: ({ row }: any) => (
            //         <span>
            //             {moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}
            //         </span>
            //     ),
            // },
        ];
    }, [router, filters.is_invoice]);
    const tabsList = [
        { id: "1", label: "Sudah Faktur", icon: CheckCircle2, count: metaCount.total_invoice },
        { id: "0", label: "Belum Faktur", icon: FileClock, count: metaCount.total_uninvoice },
    ];
    return (
        <div className="space-y-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">

                {/* PILIHAN TABS */}
                <div className="bg-white p-1.5 rounded-xl border border-gray-200 inline-flex w-full md:w-auto shadow-sm overflow-x-auto">
                    {tabsList.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = filters.is_invoice === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setFilter("is_invoice", tab.id);
                                    setFilter("page", 1);
                                }}
                                disabled={isLoading}
                                className={`
                                    relative flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }
                                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {tab.label}

                                {/* Badge Count */}
                                <span className={`
                                    ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                                `}>
                                    {isLoading && isActive ? '...' : tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* SEARCH & ADD BUTTON */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <input
                        type="text"
                        value={filters.search}
                        onChange={handleSearch}
                        placeholder="Cari No. Order..."
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => router.push("/purchasing/invoices/create")}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Tambah Faktur
                    </button>
                </div>
            </div>


            <Table
                data={data}
                columns={columnsNew}
                pagination={true}
                lastPage={lastPage}
                total={count}
                loading={isLoading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                // onRowClick={handleRowClick}
                currentPage={filters.page}
                perPage={filters.per_page}
            />

            <ChangeStatusDepositModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                deposit={selectedDeposit}
                actionType={modalAction}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmStatusChange}
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
            />
        </div>
    );
}