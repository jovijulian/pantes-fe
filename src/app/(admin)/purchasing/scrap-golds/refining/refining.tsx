"use client";

import Table from "@/components/tables/Table";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import { useRouter } from 'next/navigation';
import moment from "moment";
import { toast } from "react-toastify";
import { FaEye, FaTrash, FaTruckLoading } from "react-icons/fa";
import Select from '@/components/form/Select-custom';
import _ from "lodash";
import { useTableFilters } from "@/hooks/useTableFilters";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import ChangeStatusRefiningModal from "@/components/modal/scrap-gold/ChangeStatusRefiningModal";

interface IPartner {
    id: number;
    code?: string | null;
    name: string;
}

interface IRefiningDetail {
    id: number;
    bruto?: string | number;
    netto?: string | number;
}

interface IRefining {
    id: number;
    expedition_id: number;
    type_purpose: number | string;
    supplier_id: number | null;
    vendor_id: number | null;
    no_scrap_gold_refining: string;
    date: string;
    receipt_date: string | null;
    notes: string | null;
    susut_bruto: string;
    susut_netto: string;
    ongkos_bruto: string;
    ongkos_netto: string;
    tambah_bruto: string;
    tambah_netto: string;
    status: number | string;
    created_by?: IPartner | null;
    expedition?: IPartner | null;
    supplier?: IPartner | null;
    vendor?: IPartner | null;
    details?: IRefiningDetail[];
    items_finished_good?: any[];
    created_at: string;
    updated_at: string;
}

const statusOptions = [
    { value: "1", label: "New" },
    { value: "2", label: "Diterima" },
    { value: "3", label: "Selesai" },
];

export default function RefiningPage() {
    const router = useRouter();

    const [data, setData] = useState<IRefining[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastPage, setLastPage] = useState(1);
    const [count, setCount] = useState(0);
    const [role, setRole] = useState<string | null>("null");
    const [selectedData, setSelectedData] = useState<IRefining | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRefining, setSelectedRefining] = useState<IRefining | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

    const { filters, setFilter } = useTableFilters({
        page: 1,
        per_page: 20,
        search: '',
        status: '',
    });

    const formatGram = (value: number): string => {
        return value.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + " gr";
    };

    const calculateTotal = (details: IRefiningDetail[] | undefined, field: 'bruto' | 'netto'): number => {
        if (!details || details.length === 0) return 0;
        return _.sumBy(details, (item) => Number(item[field] || 0));
    };

    const getPurposeInfo = (row: IRefining) => {
        const type = String(row.type_purpose);
        if (type === "1") return { name: "Gudang CT", sub: "Gudang" };
        if (type === "2") return { name: row.supplier?.name || "-", sub: "Supplier" };
        if (type === "3") return { name: row.vendor?.name || "-", sub: "External Vendor" };
        return { name: "-", sub: "" };
    };

    const getStatusBadge = (status: number | string) => {
        switch (String(status)) {
            case '1':
                return <Badge color="warning">New</Badge>;
            case '2':
                return <Badge color="success">Diterima</Badge>;
            case '3':
                return <Badge color="primary">Selesai</Badge>;
            default:
                return <Badge color="info">Unknown</Badge>;
        }
    };

    const getData = useCallback(async () => {
        setIsLoading(true);

        const params: Record<string, any> = {
            ...(filters.search ? { search: filters.search.trim() } : {}),
            per_page: filters.per_page,
            ...(filters.status ? { status: filters.status } : {}),
            page: filters.page,
        };

        try {
            const response = await httpGet(endpointUrl("purchase/scrap-gold/refining"), true, params);
            const responseData = response.data.data.data || [];
            setData(responseData);
            setCount(response.data.data.page_info?.total_record || 0);
            setLastPage(response.data.data.page_info?.total_pages || 1);
        } catch (error) {
            console.log(error);
            toast.error("Failed to fetch data");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        getData();
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(storedRole);
        }
    }, [getData]);

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

    const handleConfirmReceipt = async (receiptDate: string) => {
        if (!selectedRefining) return;
        setIsSubmittingStatus(true);
        const payload = {
            status: 2,
            receipt_date: receiptDate,
        };

        try {
            await httpPost(
                endpointUrl(`purchase/scrap-gold/refining/${selectedRefining.id}/change-status`),
                payload,
                true
            );
            toast.success("Surat Jalan berhasil ditandai 'Diterima'!");
            setIsReceiptModalOpen(false);
            setSelectedRefining(null);
            getData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Gagal mengubah status Surat Jalan.");
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    const columnsNew = useMemo(() => {
        return [
            {
                id: "action",
                header: "Aksi",
                cell: ({ row }: { row: IRefining }) => (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/purchasing/scrap-golds/refining/${row.id}`);
                            }}
                            title="Lihat Detail"
                            className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            <FaEye className="w-4 h-4" />
                        </button>
                        {String(row.status) === "1" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRefining(row);
                                    setIsReceiptModalOpen(true);
                                }}
                                title="Tandai Diterima"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium"
                            >
                                <FaTruckLoading className="w-3.5 h-3.5" />
                                <span>Terima</span>
                            </button>
                        )}
                        {role !== "5" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedData(row);
                                    setIsDeleteModalOpen(true);
                                }}
                                title="Delete"
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ),
            },
            {
                id: "no_scrap_gold_refining",
                header: "No. Surat Jalan",
                accessorKey: "no_scrap_gold_refining",
                cell: ({ row }: { row: IRefining }) => (
                    <button
                        className="text-blue-600 hover:underline font-semibold"
                        onClick={() => router.push(`/purchasing/scrap-golds/refining/${row.id}`)}
                    >
                        {row.no_scrap_gold_refining}
                    </button>
                ),
            },
            {
                id: "date",
                header: "Tgl. Surat Jalan",
                accessorKey: "date",
                cell: ({ row }: { row: IRefining }) => (
                    <span>{row.date ? moment(row.date).format("DD MMM YYYY") : "-"}</span>
                ),
            },
            {
                id: "receipt_date",
                header: "Tgl. Terima",
                accessorKey: "receipt_date",
                cell: ({ row }: { row: IRefining }) => (
                    <span>{row.receipt_date ? moment(row.receipt_date).format("DD MMM YYYY") : "-"}</span>
                ),
            },
            {
                id: "tujuan",
                header: "Tujuan Kirim",
                cell: ({ row }: { row: IRefining }) => {
                    const { name, sub } = getPurposeInfo(row);
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{name}</span>
                            {sub && <span className="text-xs text-gray-400">{sub}</span>}
                        </div>
                    );
                },
            },
            {
                id: "expedition",
                header: "Ekspedisi",
                cell: ({ row }: { row: IRefining }) => <span>{row.expedition?.name || "-"}</span>,
            },
            // {
            //     id: "details",
            //     header: "Item",
            //     cell: ({ row }: { row: IRefining }) => (
            //         <span className="font-semibold text-gray-700">{row.details?.length || 0} Item</span>
            //     ),
            // },
            // {
            //     id: "bruto",
            //     header: "Total Bruto",
            //     cell: ({ row }: { row: IRefining }) => (
            //         <span className="text-right block">{formatGram(calculateTotal(row.details, 'bruto'))}</span>
            //     ),
            // },
            // {
            //     id: "netto",
            //     header: "Total Netto",
            //     cell: ({ row }: { row: IRefining }) => (
            //         <span className="text-right block">{formatGram(calculateTotal(row.details, 'netto'))}</span>
            //     ),
            // },
            {
                id: "status",
                header: "Status",
                accessorKey: "status",
                cell: ({ row }: { row: IRefining }) => getStatusBadge(row.status),
            },
            {
                id: "created_by",
                header: "Dibuat oleh",
                cell: ({ row }: { row: IRefining }) => <span>{row.created_by?.name || "-"}</span>,
            },
            {
                id: "created_at",
                header: "Dibuat pada",
                accessorKey: "created_at",
                cell: ({ row }: { row: IRefining }) => (
                    <span>{moment(row.created_at).format("DD-MMM-YYYY, HH:mm")}</span>
                ),
            },
            {
                id: "updated_at",
                header: "Diubah pada",
                accessorKey: "updated_at",
                cell: ({ row }: { row: IRefining }) => (
                    <span>{moment(row.updated_at).format("DD-MMM-YYYY, HH:mm")}</span>
                ),
            },
        ];
    }, [router, role]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <Select
                    options={statusOptions}
                    value={_.find(statusOptions, { value: filters.status })}
                    onValueChange={(opt) => {
                        setFilter("status", opt ? opt.value : "");
                        setFilter("page", 1);
                    }}
                    placeholder="Filter Status..."
                    isClearable
                />
                <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="Cari No. Surat Jalan..."
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(role !== "3" && role !== "9") && (
                    <button
                        onClick={() => router.push("/purchasing/scrap-golds/refining/create")}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>+</span>
                        Tambah Surat Jalan
                    </button>
                )}
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
                currentPage={filters.page}
                perPage={filters.per_page}
            />

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedData(null);
                }}
                url={`purchase/scrap-gold/refining/${selectedData?.id}/deactive`}
                itemName={selectedData?.no_scrap_gold_refining || ""}
                selectedData={selectedData}
                onSuccess={getData}
                message="Surat Jalan Refining deleted successfully!"
            />

            <ChangeStatusRefiningModal
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    setSelectedRefining(null);
                }}
                refining={
                    selectedRefining
                        ? {
                              id: selectedRefining.id,
                              no_scrap_gold_refining: selectedRefining.no_scrap_gold_refining,
                              status: selectedRefining.status,
                          }
                        : null
                }
                isSubmitting={isSubmittingStatus}
                onConfirm={handleConfirmReceipt}
            />
        </div>
    );
}
