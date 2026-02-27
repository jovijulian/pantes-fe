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
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState<IDeposit | null>(null);
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
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
        const search = searchTerm.trim();
        const page = searchParams.get("page") || currentPage;
        const perPageParam = searchParams.get("per_page") || perPage;

        const params: any = {
            ...(search ? { search } : {}),
            per_page: perPageParam,
            ...(statusFilter ? { status: statusFilter } : {}),
            page: page,
        };

        try {
            const response = await httpGet(endpointUrl("deposit"), true, params);
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
    }, [searchParams, currentPage, perPage, searchTerm, statusFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };
    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
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
                    const status = row.status || "1";
                    return (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/purchasing/deposits/${row.id}`, "_blank");
                                    // router.push(`/purchasing/deposits/${row.id}`)
                                }}
                                title="Lihat Detail"
                                className="p-3 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <FaEye className="w-4 h-4" />
                            </button>

                            {/* {status === '1' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(row, 'Validasi'); }}
                                    title="Validasi"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                                >
                                    <FaCheck className="w-3.5 h-3.5" />
                                    <span>Validasi</span>
                                </button>
                            )}
                            {status === '2' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(row, 'Setor'); }}
                                    title="Setor"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium"
                                >
                                    <FaCheckCircle className="w-3.5 h-3.5" />
                                    <span>Setor</span>
                                </button>
                            )}
                            {status === '3' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(row, 'Lunas'); }}
                                    title="Lunas"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-medium"
                                >
                                    <FaDollarSign className="w-3.5 h-3.5" />
                                    <span>Lunas</span>
                                </button>
                            )} */}
                        </div>
                    );
                },
            },
            {
                id: "no_payment",
                header: "No. Pembayaran",
                accessorKey: "no_payment",
                cell: ({ row }: any) => <span className="font-medium">{row.no_payment}</span>,
            },
            {
                id: "date",
                header: "Tanggal",
                accessorKey: "date",
                cell: ({ row }: any) => <span>{moment(row.date).format("DD MMM YYYY")}</span>,
            },
            {
                id: "supplier",
                header: "Supplier",
                accessorKey: "supplier.name",
                cell: ({ row }: any) => <span>{row.supplier?.name || 'N/A'}</span>,
            },
            {
                id: "employee",
                header: "Yang Menyerahkan",
                accessorKey: "employee.name",
                cell: ({ row }: any) => <span>{row.employee?.name || 'N/A'}</span>,
            },
            {
                id: "status",
                header: "Status",
                accessorKey: "status",
                cell: ({ row }: { row: any }) => getStatusBadge(row.status),
            },
            {
                id: "created_at",
                header: "Dibuat pada",
                accessorKey: "created_at",
                cell: ({ row }: any) => <span>{moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}</span>,
            },
            {
                id: "updated_at",
                header: "Diubah pada",
                accessorKey: "updated_at",
                cell: ({ row }: any) => <span>{moment(row.updated_at).format("DD-MMM-YYYY, HH:mm")}</span>,
            },
        ];
    }, [router]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <div className="w-48 w-full sm:w-auto">
                    <Select
                        options={statusOptions}
                        value={_.find(statusOptions, { value: statusFilter })}
                        onValueChange={(opt) =>
                            setStatusFilter(opt ? opt.value : "")
                        }
                        placeholder="Filter Status..."
                    />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Cari No. Pembayaran..."
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => router.push("/purchasing/deposits/create")}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span>
                    Tambah Setor
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