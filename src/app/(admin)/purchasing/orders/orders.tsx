"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { alertToast, endpointUrlv2, httpGet, httpPost, httpPut } from "@/../helpers";
import { useSearchParams, useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import {
    FaEdit, FaEye, FaCheck,
    FaCheckCircle, FaFileInvoiceDollar
} from "react-icons/fa";
import Select from '@/components/form/Select-custom';
import _ from "lodash";
import { DollarSign, Download, Loader2 } from "lucide-react";
import axios from "axios";

interface IPurchaseOrder {
    id: number;
    no_order: string;
    staff_id: string;
    supplier_id: string;
    date: string;
    nominal: string;
    status: "1" | "2" | "3" | "4" | string; // 1:New, 2:Valid, 3:Approved, 4:PO
    created_at: string;
}

type ModalAction = 'Validasi' | 'Disetujui' | 'Bayar' | null;

const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "1", label: "Baru" },
    { value: "2", label: "Valid" },
    { value: "3", label: "Disetujui" },
    { value: "4", label: "Bayar" },
];

export default function PurchaseOrdersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [data, setData] = useState<IPurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<IPurchaseOrder | null>(null);
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const getStatusBadge = (status: string) => {
        let color: "success" | "error" | "warning" | "info";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'Baru'; break;
            case '2': color = 'info'; label = 'Valid'; break;
            case '3': color = 'success'; label = 'Disetujui'; break;
            case '4': color = 'success'; label = 'Bayar'; break;
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
            const response = await httpGet(endpointUrlv2("purchase/order"), true, params);
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

    const handleOpenModal = (order: IPurchaseOrder, action: ModalAction) => {
        setSelectedOrder(order);
        setModalAction(action);
        setPaymentDate(moment().format('YYYY-MM-DD'));
        setIsModalOpen(true);
    };

    const handleConfirmStatusChange = async (date?: string) => {
        if (!selectedOrder || !modalAction) return;

        setIsSubmitting(true);
        const payload: any = { status: 0 };
        let successMessage = "";

        switch (modalAction) {
            case 'Validasi':
                payload.status = 2;
                successMessage = "Order berhasil divalidasi!";
                break;
            case 'Disetujui':
                payload.status = 3;
                successMessage = "Order berhasil disetujui!";
                break;
            case 'Bayar':
                payload.status = 4;
                payload.payment_date = moment(date).format('YYYY-MM-DD');
                successMessage = "Order berhasil dibayar!";
                break;
            default:
                setIsSubmitting(false);
                return;
        }

        try {
            await httpPost(endpointUrlv2(`purchase/order/${selectedOrder.id}/change-status`), payload, true);
            toast.success(successMessage);
            setIsModalOpen(false);
            getData();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleRowClick = (rowData: IPurchaseOrder) => {
        const detailUrl = `/purchasing/orders/${rowData.id}`;
        router.push(detailUrl);
    };

    const handleExport = async (id: number) => {
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrlv2(`purchase/order/${id}/export`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            console.log(response.headers['content-disposition'])
            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);
            // window.open(blobUrl, '_blank');

            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];

            let filename = `purchase_order.pdf`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            link.href = blobUrl;

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error("Error saat memproses PDF:", error);
            toast.error("Failed to generate report. Please try again later.");
        } finally {
            setIsDownloadLoading(false);
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
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/purchasing/orders/${row.id}`)
                                }}
                                title="Lihat Detail"
                                className="p-3 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <FaEye className="w-4 h-4" />
                            </button>

                            {status === '1' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/purchasing/orders/edit/${row.id}`)
                                    }}
                                    title="Edit"
                                    className="p-3 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                    <FaEdit className="w-4 h-4" />
                                </button>
                            )}


                            {status === '1' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(row, 'Validasi')
                                    }}
                                    title="Validasi"
                                    className="p-3 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                    <FaCheck className="w-4 h-4" />
                                </button>
                            )}

                            {status === '2' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(row, 'Disetujui')
                                    }}
                                    title="Disetujui"
                                    className="p-3 rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                    <FaCheckCircle className="w-4 h-4" />
                                </button>
                            )}

                            {status === '3' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(row, 'Bayar')
                                    }}
                                    title="Bayar"
                                    className="p-3 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200"
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                            )}
                            {(status === '3' || status === '4') && (
                                <>
                                    <button
                                        type="button"
                                        disabled={isDownloadLoading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExport(row.id);
                                        }}
                                        title="Export"
                                        className="flex items-center gap-2 p-3 rounded-lg 
                                            bg-gradient-to-r from-blue-500 to-indigo-600 
                                            text-white font-medium shadow-md hover:shadow-lg 
                                            hover:from-blue-600 hover:to-indigo-700 
                                            transition-all duration-200"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "no_order",
                header: "No. Order",
                accessorKey: "no_order",
                cell: ({ row }: any) => <span className="font-medium">{row.no_order}</span>,
            },
            {
                id: "date",
                header: "Tanggal PO",
                accessorKey: "date",
                cell: ({ row }: any) => <span>{moment(row.date).format("DD MMM YYYY")}</span>,
            },
            {
                id: "nominal",
                header: "Nominal",
                accessorKey: "nominal",
                cell: ({ row }: any) => <span>{formatRupiah(row.nominal)}</span>,
            },
            {
                id: "supplier_id",
                header: "Supplier",
                cell: ({ row }: any) => <span>{row.supplier?.name}</span>,
            },
            {
                id: "staff_id",
                header: "Pemesan",
                accessorKey: "staff_id",
                cell: ({ row }: any) => <span>{row.staff?.name}</span>,
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
                    placeholder="Cari No. Order..."
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => router.push("/purchasing/orders/create")}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span>
                    Tambah Order
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

            <ChangeStatusOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                actionType={modalAction}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmStatusChange}
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
            />
        </div>
    );
}