"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrlv2, httpGet, httpPost, httpPut } from "@/../helpers";
import { useSearchParams, useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import {
    FaCheckCircle,
    FaEdit, FaEye,
} from "react-icons/fa";
import Select from '@/components/form/Select-custom';
import _ from "lodash";
import ChangeStatusWorkOrderModal from "@/components/modal/ChangeStatusWorkOrderModal";
import { Loader2 } from "lucide-react";

interface IWorkOrder {
    id: number;
    no_work_order: string;
    supplier_id: string;
    supplier: { name: string };
    expedition_id: string;
    expedition: { name: string };
    date: string;
    tanggal_terima: string | null;
    nominal: string;
    total_weight: string;
    status: "1" | "2" | "3" | string;
    created_at: string;
    updated_at: string;
}

const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "1", label: "WO Aktif" },
    { value: "2", label: "Diterima" },
];

export default function WorkOrdersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [data, setData] = useState<IWorkOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<IWorkOrder | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");

    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gr";
    };

    const getStatusBadge = (status: string) => {
        let color: "success" | "warning" | "info";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'WO Aktif'; break;
            case '2': color = 'success'; label = 'Diterima'; break;
            default: color = 'warning'; break;
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
            const response = await httpGet(endpointUrlv2("work-order"), true, params);
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

    const handleRowClick = (rowData: IWorkOrder) => {
        const detailUrl = `/purchasing/work-orders/${rowData.id}`;
        router.push(detailUrl);
    };

    const handleOpenReceiptModal = (workOrder: IWorkOrder) => {
        setSelectedWorkOrder(workOrder);
        setIsReceiptModalOpen(true);
    };

    const handleConfirmReceipt = async (receiptDate: string) => {
        if (!selectedWorkOrder) return;

        setIsSubmitting(true);
        const payload = {
            receipt_date: receiptDate,
        };

        try {
            await httpPost(endpointUrlv2(`work-order/${selectedWorkOrder.id}/receipt`), payload, true);
            toast.success("Surat Jalan berhasil ditandai 'Diterima'!");
            setIsReceiptModalOpen(false);
            getData();
        } catch (error: any) {
            alertToast(error);
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
                    const status = row.status;
                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/purchasing/work-orders/${row.id}`)
                                }}
                                title="Lihat Detail"
                                className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <FaEye className="w-4 h-4" />
                            </button>

                            {status === '1' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenReceiptModal(row);
                                    }}
                                    title="Tandai Diterima"
                                    className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                    <FaCheckCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "no_work_order",
                header: "No. Surat Jalan",
                accessorKey: "no_work_order",
                cell: ({ row }: any) => <span className="font-medium">{row.no_work_order}</span>,
            },
            {
                id: "date",
                header: "Tgl. Srt. Jalan",
                accessorKey: "date",
                cell: ({ row }: any) => <span>{moment(row.date).format("DD MMM YYYY")}</span>,
            },
            {
                id: "tanggal_terima",
                header: "Tgl. Terima",
                accessorKey: "tanggal_terima",
                cell: ({ row }: any) => <span>{row.tanggal_terima ? moment(row.tanggal_terima).format("DD MMM YYYY") : "-"}</span>,
            },
            {
                id: "supplier",
                header: "Supplier",
                accessorKey: "supplier.name",
                cell: ({ row }: any) => <span>{row.supplier.name}</span>,
            },
            {
                id: "expedition",
                header: "Ekspedisi",
                accessorKey: "expedition.name",
                cell: ({ row }: any) => <span>{row.expedition.name}</span>,
            },
            {
                id: "total_weight",
                header: "Total Berat",
                accessorKey: "total_weight",
                cell: ({ row }: any) => <span className="text-right block">{formatGram(row.total_weight)}</span>,
            },
            {
                id: "nominal",
                header: "Total Nominal",
                accessorKey: "nominal",
                cell: ({ row }: any) => <span className="text-right block">{formatRupiah(row.nominal)}</span>,
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
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    <div className="w-48">
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
                        placeholder="Cari No. Surat Jalan..."
                        className="px-3  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => router.push("/purchasing/work-orders/create")} // Ganti path
                        className="px-4  bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Tambah Surat Jalan
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
                onRowClick={handleRowClick}
            />

            <ChangeStatusWorkOrderModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                workOrder={selectedWorkOrder}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmReceipt}
            />
        </div>
    );
}