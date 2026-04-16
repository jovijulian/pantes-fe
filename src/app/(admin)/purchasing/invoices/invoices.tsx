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
import { Loader2 } from "lucide-react";
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState<IDeposit | null>(null);
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
    const { filters, setFilter } = useTableFilters({
        page: 1,
        per_page: 20,
        search: '',
        status: ''
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
            ...(filters.status ? { status: filters.status } : {}),
            page: filters.page,
        };
        try {
            const response = await httpGet(endpointUrl("invoice-order"), true, params);
            const responseData = response.data.data.data;
            setData(responseData);
            setCount(response.data.data.page_info.total_record);
            setLastPage(response.data.data.page_info.total_pages);
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
        const detailUrl = `/purchasing/deposits/${rowData.id}`;
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
                    return (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/purchasing/invoices/${row.id}`)
                                }}
                                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                <FaEye className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
            },
            {
                id: "invoice_number",
                header: "No. Faktur",
                accessorKey: "invoice_number",
                cell: ({ row }: any) => (
                    <span className="font-medium">{row.invoice_number}</span>
                ),
            },
            {
                id: "no_order",
                header: "No. Order",
                accessorKey: "no_order",
            },
            {
                id: "order_date",
                header: "Tanggal Order",
                cell: ({ row }: any) => (
                    <span>
                        {moment(row.order?.date).format("DD MMM YYYY")}
                    </span>
                ),
            },

            {
                id: "invoice_date",
                header: "Tanggal Faktur",
                cell: ({ row }: any) => (
                    <span>
                        {moment(row.invoice_date).format("DD MMM YYYY")}
                    </span>
                ),
            },
            {
                id: "withholding_tax_slip_number",
                header: "No. Bukti Potong",
                accessorKey: "withholding_tax_slip_number",
            },
            {
                id: "withholding_tax_slip_date",
                header: "Tanggal Bukti Potong",
                cell: ({ row }: any) => (
                    <span>
                        {moment(row.withholding_tax_slip_date).format("DD MMM YYYY")}
                    </span>
                ),
            },

            // 💰 DPP
            {
                id: "dpp",
                header: "DPP",
                cell: ({ row }: any) => (
                    <span>
                        {formatRupiah(row.order?.dpp_nominal)}
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
                id: "created_at",
                header: "Dibuat",
                cell: ({ row }: any) => (
                    <span>
                        {moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}
                    </span>
                ),
            },
        ];
    }, [router]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="Cari Faktur..."
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

            <Table
                data={data}
                columns={columnsNew}
                pagination={true}
                lastPage={lastPage}
                total={count}
                loading={isLoading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onRowClick={handleRowClick}
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