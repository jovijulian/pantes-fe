"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut, alertToast, endpointUrlv2 } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, User, Building, Calendar, Info, Check, X,
    FileText, DollarSign, Scale, UserCheck, Truck, PackagePlus
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusWorkOrderModal from "@/components/modal/ChangeStatusWorkOrderModal";


interface IUserSimple {
    id: number;
    name: string;
    email: string;
}

interface ISupplier {
    id: number;
    name: string;
    code: string;
}

interface IExpedition {
    id: number;
    name: string;
    code: string;
}

interface IPurchaseOrderSimple {
    id: number;
    no_order: string;
    date: string;
    nominal: string;
    weight: string;
}

interface IWorkOrderData {
    id: number;
    no_work_order: string;
    date: string;
    receipt_date: string | null;
    total_weight: string;
    nominal: string;
    status: "1" | "2" | string;
    created_at: string;
    created_by: IUserSimple;
    supplier: ISupplier;
    expedition: IExpedition;
    purchase_orders: IPurchaseOrderSimple[];
}


export default function WorkOrderDetailPage() {
    const [data, setData] = useState<IWorkOrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gram";
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMMM YYYY');
    };

    const getStatusBadge = (status: string) => {
        let color: "success" | "warning";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'WO Aktif'; break;
            case '2': color = 'success'; label = 'Diterima'; break;
            default: color = 'warning'; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrlv2(`work-order/${id}`), true);
            if (!response.data.data.purchase_orders) {
                response.data.data.purchase_orders = [];
            }
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Surat Jalan tidak ditemukan.");
                router.push('/purchasing/work-orders');
            } else {
                toast.error("Gagal mengambil detail Surat Jalan.");
                alertToast(error);
            }
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    const handleOpenReceiptModal = () => {
        setIsReceiptModalOpen(true);
    };

    const handleConfirmReceipt = async (receiptDate: string) => {
        if (!data) return;

        setIsSubmitting(true);
        const payload = {
            receipt_date: receiptDate,
        };

        try {
            await httpPut(endpointUrlv2(`work-order/${data.id}/receipt`), payload, true);
            toast.success("Surat Jalan berhasil ditandai 'Diterima'!");
            setIsReceiptModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail Surat Jalan...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau Surat Jalan tidak ditemukan.</p>
            <button onClick={() => router.push('/purchasing/work-orders')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );

    return (
        <>
            <ComponentCard title="Detail Surat Jalan">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">Surat Jalan</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_work_order}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(data.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<Building />} label="Supplier" value={data.supplier.name} />
                    <DetailItem icon={<Truck />} label="Ekspedisi" value={data.expedition.name} />
                    <DetailItem icon={<Calendar />} label="Tanggal Surat Jalan" value={formatDate(data.date)} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Detail Total" icon={<DollarSign />}>
                            <InfoRow label="Total Berat" value={formatGram(data.total_weight)} />
                            <InfoRow label="Total Nominal" value={formatRupiah(data.nominal)} isTotal />
                        </Section>

                        <Section title="Daftar Purchase Order" icon={<FileText />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pesanan (PO)</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.purchase_orders.length === 0 && (
                                            <tr><td colSpan={4} className="text-center p-3 italic text-gray-500">Tidak ada PO terlampir.</td></tr>
                                        )}
                                        {data.purchase_orders.map((po) => (
                                            <tr key={po.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{po.no_order}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(po.date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(po.weight)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatRupiah(po.nominal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                <Info /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat" value={formatDate(data.created_at)} />
                                <InfoRow label="Tanggal Srt. Jalan" value={formatDate(data.date)} />
                                <InfoRow label="Tanggal Diterima" value={formatDate(data.receipt_date)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {data.status === "1" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                onClick={() => router.push(`/purchasing/work-orders/edit/${data.id}`)}
                            >
                                <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Edit
                            </button>
                            <button
                                className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                onClick={handleOpenReceiptModal}
                            >
                                <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Tandai Diterima
                            </button>
                        </>
                    )}
                    {data.status === "2" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                                // onClick={() => ... } 
                                title="Tambah Barang"
                            >
                                <PackagePlus className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Tambahkan Barang
                            </button>
                        </>
                    )}
                </div>
            </ComponentCard>

            {data && (
                <ChangeStatusWorkOrderModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    workOrder={{ id: data.id, no_work_order: data.no_work_order, status: data.status }}
                    isSubmitting={isSubmitting}
                    onConfirm={handleConfirmReceipt}
                />
            )}
        </>
    );
}


const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            {icon} {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2 last:border-b-0 ${isTotal ? 'bg-gray-50 -mx-3 px-3' : ''}`}>
        <span className="text-gray-500 text-sm sm:text-base">{label}</span>
        <span className={`font-semibold text-gray-800 text-left sm:text-right text-sm sm:text-base ${isTotal ? 'text-lg text-blue-600' : ''}`}>
            {value || '-'}
        </span>
    </div>
);