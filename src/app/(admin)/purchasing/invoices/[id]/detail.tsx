"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { httpGet, endpointUrl } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, Calendar, Info, FileText, DollarSign, Receipt, Hash,
    Calculator, Percent, ArrowDownToLine, Package
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";

interface IOrder {
    id: number;
    type: string;
    no_order: string;
    date: string;
    weight: string;
    pcs: string | null;
    cokim: string;
    dpp_nominal: string;
    nominal: string;
    pph: string;
    cashback: string;
    payment_date: string | null;
    validated_date: string | null;
    approved_date: string | null;
    status: string;
}

interface IInvoiceData {
    id: number;
    order_id: number;
    type: string;
    no_order: string;
    invoice_date: string;
    invoice_number: string;
    withholding_tax_slip_date: string;
    withholding_tax_slip_number: string;
    pph: string;
    created_at: string;
    updated_at: string;
    order: IOrder;
}

export default function InvoiceDetailPage() {
    const [data, setData] = useState<IInvoiceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " gr";
    };

    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const formatDate = (dateStr: string | null, withTime = true): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format(withTime ? 'DD MMMM YYYY, HH:mm' : 'DD MMMM YYYY');
    };

    const getOrderStatusBadge = (status: string | null) => {
        if (status === null) status = "1";
        let color: "success" | "warning" | "info" | "error";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'Menunggu'; break;
            case '2': color = 'info'; label = 'Divalidasi'; break;
            case '3': color = 'info'; label = 'Disetujui'; break;
            case '4': color = 'success'; label = 'Selesai'; break;
            default: color = 'warning'; label = 'Draft'; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`invoice-order/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Data Faktur tidak ditemukan.");
                router.push('/purchasing/invoices');
            } else {
                toast.error("Gagal mengambil detail Faktur.");
            }
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail Faktur...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau Faktur tidak ditemukan.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali
            </button>
        </div>
    );

    return (
        <ComponentCard title="Detail Faktur Pajak & Pembelian">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                <div>
                    <span className="text-sm text-gray-500 uppercase font-semibold">No. Faktur</span>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        {data.invoice_number}
                    </h1>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DetailItem icon={<FileText />} label="No. Order Terkait" value={data.no_order} />
                <DetailItem icon={<Calendar />} label="Tanggal Faktur" value={formatDate(data.invoice_date, false)} />
                <DetailItem icon={<Hash />} label="No. Bukti Potong" value={data.withholding_tax_slip_number} />
                <DetailItem icon={<Calendar />} label="Tgl. Bukti Potong" value={formatDate(data.withholding_tax_slip_date, false)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Section title="Rincian Pesanan & Pembayaran" icon={null}>
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Tanggal Order</span>
                                    <span className="font-semibold text-gray-800">{formatDate(data.order?.date, false)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Berat Dipesan / PCS</span>
                                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                                        <Package className="w-4 h-4 text-blue-500" />
                                        {formatGram(data.order?.weight)} / {data.order?.pcs || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <InfoRow label="Harga Cokim" value={formatRupiah(data.order?.cokim)} />
                            <InfoRow label="DPP Nominal" value={formatRupiah(data.order?.dpp_nominal)} />
                            <InfoRow label="Cashback" value={formatRupiah(data.order?.cashback)} />
                            <InfoRow label="PPH" value={formatRupiah(data.order?.pph)} />
                        </div>
                        <div className="mt-6">
                            <InfoRow
                                label="TOTAL NOMINAL ORDER"
                                value={formatRupiah(data.order?.nominal)}
                                isTotal={true}
                            />
                        </div>
                    </Section>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white border rounded-xl p-5 sticky top-24 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                            <Info className="w-5 h-5 text-gray-700" /> Informasi Sistem
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Dibuat Pada</span>
                                <span className="font-medium text-sm text-gray-800">{formatDate(data.created_at)}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Terakhir Diperbarui</span>
                                <span className="font-medium text-sm text-gray-800">{formatDate(data.updated_at)}</span>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Tracking Order</span>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Validasi</span>
                                        <span className="font-medium">{formatDate(data.order?.validated_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Approve</span>
                                        <span className="font-medium">{formatDate(data.order?.approved_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Pembayaran</span>
                                        <span className="font-medium">{formatDate(data.order?.payment_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ComponentCard>
    );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
            {icon} {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 h-full transition-all hover:border-blue-100 hover:shadow-md">
        <div className="text-blue-600 text-xl bg-blue-50 p-2 rounded-lg">{icon}</div>
        <div>
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">{label}</span>
            <span className="font-bold text-base text-gray-800 break-words">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2 last:border-b-0 ${isTotal ? 'bg-gray-50 -mx-3 px-3' : ''}`}>
        <span className={`${isTotal ? 'font-bold' : ''} text-gray-500 text-sm sm:text-base`}>{label}</span>
        <span className={`${isTotal ? 'font-bold' : 'font-medium'} text-gray-800 text-left sm:text-right text-sm sm:text-base ${isTotal ? 'text-lg text-blue-600' : ''}`}>
            {value || '-'}
        </span>
    </div>
);