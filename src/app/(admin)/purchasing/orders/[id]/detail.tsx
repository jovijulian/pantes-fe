"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut, alertToast, endpointUrlv2, httpPost } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, User, Building, Calendar, Hash, Info, Check, X,
    FileText, DollarSign, Scale, UserCheck, Download, Edit
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import axios from "axios";
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

interface IStaff {
    id: number;
    name: string;
    email: string;
}

interface IPaymentType {
    id: number;
    payment_type: string;
    bank_id: string | null;
    name: string | null;
    nominal: string;
    bank: { bank_name: string, account_name: string } | null;
}

interface IPurchaseOrderData {
    id: number;
    no_order: string;
    date: string;
    weight: string;
    cokim: string;
    nominal: string;
    status: "1" | "2" | "3" | "4" | string;
    validated_date: string | null;
    approved_date: string | null;
    payment_date: string | null;
    created_at: string;
    created_by: IUserSimple;
    supplier: ISupplier;
    staff: IStaff;
    payment_types: IPaymentType[];
    work_order_id: string | number | null;
    work_order: { no_surat_jalan: string } | null;
}

type ModalAction = 'Validasi' | 'Disetujui' | 'Bayar' | null;

export default function PurchaseOrderDetailPage() {
    const [data, setData] = useState<IPurchaseOrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<ModalAction | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentDate, setPaymentDate] = useState(moment().format('YYYY-MM-DD'));
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
        let color: "success" | "error" | "warning" | "info" | "info";
        let label = "Unknown";

        switch (status) {
            case '1': color = 'warning'; label = 'Baru'; break;
            case '2': color = 'info'; label = 'Valid'; break;
            case '3': color = 'success'; label = 'Disetujui'; break;
            case '4': color = 'success'; label = 'Bayar'; break;
            case '99': color = 'error'; label = 'Rejected'; break;
            default: color = 'info'; label = `Status (${status})`; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/order/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Purchase Order tidak ditemukan.");
                router.push('/purchasing/orders');
            } else {
                toast.error("Gagal mengambil detail PO.");
            }
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    const handleOpenModal = (order: IPurchaseOrderData, action: ModalAction) => {
        setData(order);
        setModalAction(action);
        setPaymentDate(moment().format('YYYY-MM-DD'));
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalAction(null);
        setIsSubmitting(false);
    };

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`purchase/order/${data.id}/export`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);
            // window.open(blobUrl, '_blank');

            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];

            let filename = `purchase_order-${moment().format("YYYY-MM-DD")}.pdf`;

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



    const handleConfirmAction = async (date?: string) => {
        if (!data || !modalAction) return;

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
            await httpPost(endpointUrl(`purchase/order/${data.id}/change-status`), payload, true);
            toast.success(successMessage);
            setIsModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail Purchase Order...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau PO tidak ditemukan.</p>
            <button onClick={() => router.push('/purchasing/orders')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );

    return (
        <>
            <ComponentCard title="Detail Purchase Order">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">Purchase Order</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_order}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                        {getStatusBadge(data.status)}
                        <>
                        <button
                            type="button"
                            onClick={() => router.push(`/purchasing/orders/edit/${data.id}`)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-all"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                            <button
                                type="button"
                                disabled={isDownloadLoading}
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-md 
                                bg-indigo-600 text-white text-sm font-medium shadow-sm 
                                hover:bg-indigo-700 disabled:opacity-50
                                transition-all duration-200"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                            </button>
                        </>
                    </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<User />} label="Pemesan" value={data.staff.name} />
                    <DetailItem icon={<Building />} label="Supplier" value={data.supplier.name} />
                    <DetailItem icon={<Calendar />} label="Tanggal PO" value={moment(data.date).format('DD MMMM YYYY')} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Detail Transaksi" icon={<DollarSign />}>
                            <InfoRow label="Berat" value={formatGram(data.weight)} />
                            <InfoRow label="Cokim" value={formatRupiah(data.cokim)} />
                            <InfoRow label="Total Nominal" value={formatRupiah(data.nominal)} isTotal />
                        </Section>

                        <Section title="Rincian Pembayaran" icon={<FileText />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atas Nama</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Info Bank</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.payment_types.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{payment.payment_type}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{payment.bank_id ? `${payment.name}` : "-"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{payment.bank_id ? `${payment.bank?.bank_name}` : "-"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatRupiah(payment.nominal)}</td>
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
                                <InfoRow label="Dibuat" value={`${formatDate(data.created_at)}`} />
                                <InfoRow label="Tanggal Validasi" value={formatDate(data.validated_date)} />
                                <InfoRow label="Tanggal Approval" value={formatDate(data.approved_date)} />
                                <InfoRow label="Tanggal Bayar" value={formatDate(data.payment_date)} />
                                <InfoRow label="No. Surat Jalan" value={data.work_order?.no_surat_jalan || data.work_order_id || "-"} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {data.status === "1" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                onClick={() => handleOpenModal(data, 'Validasi')}
                            >
                                <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Validasi
                            </button>
                        </>
                    )}
                    {data.status === "2" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleOpenModal(data, 'Disetujui')}
                            >
                                <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Approve
                            </button>
                        </>
                    )}
                    {data.status === "3" && (
                        <>
                            <button
                                className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                                onClick={() => handleOpenModal(data, 'Bayar')}
                            >
                                <DollarSign className="w-4 h-4 inline-block -mt-1 mr-1" />
                                Bayar
                            </button>
                        </>
                    )}
                </div>
            </ComponentCard>

            <ChangeStatusOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={data}
                actionType={modalAction}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmAction}
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
            />
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

