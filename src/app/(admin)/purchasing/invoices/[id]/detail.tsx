"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { httpGet, endpointUrl } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, Calendar, Info, FileText, Receipt, Hash,
    Calculator, Percent, ArrowDownToLine, Package, CreditCard
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
interface IOrder {
    id: number;
    no_order: string;
    date: string;
    weight: string;
    dpp_nominal: string;
    pph: string;
    nominal: string;
    cashback: string;
    pcs?: string | null;
    cokim?: string;
    payment_date?: string | null;
    validated_date?: string | null;
    approved_date?: string | null;
    status?: string;
}

interface IInvoiceDetail {
    invoice_id: number;
    invoice_number: string;
    invoice_date: string;
    invoice_nominal: string;
    withholding_tax_slip_date: string;
    withholding_tax_slip_number: string;
    withholding_tax_slip_nominal: string;
}

interface IPaymentTypeInvoice {
    payment_type_id: number;
    payment_type: string;
    invoices: IInvoiceDetail[];
}

interface IInvoiceData {
    order: IOrder;
    payment_types: IPaymentTypeInvoice[];
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

    const formatDate = (dateStr: string | null, withTime = false): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format(withTime ? 'DD MMMM YYYY, HH:mm' : 'DD MMMM YYYY');
    };

    const getOrderStatusBadge = (status: string | undefined | null) => {
        if (!status) return <Badge color="info">Detail Faktur</Badge>;
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

    const { order, payment_types } = data;

    const totalInvoices = payment_types.reduce((acc, curr) => acc + (curr.invoices?.length || 0), 0);

    return (
        <ComponentCard title="Detail Faktur Pajak & Pembelian">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                <div>
                    <span className="text-sm text-gray-500 uppercase font-semibold flex items-center gap-1 mb-1">
                        No. Order Terkait
                    </span>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        {order.no_order}
                    </h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-gray-500">Total Faktur Tersimpan</span>
                    <Badge color="success">{totalInvoices} Faktur</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 space-y-6">
                    <Section title="Rincian Pesanan (Order)" icon={null}>
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Tanggal Order</span>
                                    <span className="font-semibold text-gray-800">{formatDate(order.date, false)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Berat Dipesan / PCS</span>
                                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                                        <Package className="w-4 h-4 text-blue-500" />
                                        {formatGram(order.weight)} {order.pcs ? `/ ${order.pcs} PCS` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <InfoRow label="Nilai DPP Nominal" value={formatRupiah(order.dpp_nominal)} />
                            <InfoRow
                                label={<span className="flex items-center gap-1 "> PPh Order</span>}
                                value={<span className=""> {formatRupiah(order.pph)}</span>}
                            />
                            <InfoRow
                                label={<span className="flex items-center gap-1 "> Cashback</span>}
                                value={<span className=""> {formatRupiah(order.cashback)}</span>}
                            />
                        </div>
                        <div className="mt-6">
                            <InfoRow
                                label="TOTAL NOMINAL ORDER"
                                value={formatRupiah(order.nominal)}
                                isTotal={true}
                            />
                        </div>
                    </Section>
                </div>
            </div>

            <div className="mb-4 mt-8 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-bold text-gray-800">Daftar Faktur Pembayaran</h3>
            </div>

            {payment_types.length === 0 || totalInvoices === 0 ? (
                <div className="bg-gray-50 p-8 rounded-xl text-center border border-dashed border-gray-300">
                    <p className="text-gray-500">Belum ada faktur yang tersimpan untuk order ini.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {payment_types.map((payment, index) => {
                        if (!payment.invoices || payment.invoices.length === 0) return null;
                        return payment.invoices.map((invoice, invIndex) => (
                            <div key={invoice.invoice_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-blue-50/50 border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                                Jenis Pembayaran: {payment.payment_type}
                                            </p>
                                            <p className="text-sm font-medium text-gray-600 mt-0.5 flex items-center gap-1">
                                                Faktur Tgl: {formatDate(invoice.invoice_date, true)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal Faktur</p>
                                        <p className="text-lg font-black text-blue-700">{formatRupiah(invoice.invoice_nominal)}</p>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                                            Detail Faktur
                                        </h5>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 block uppercase">No. Faktur</span>
                                                <span className="font-semibold text-gray-800">{invoice.invoice_number || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                                            Bukti Potong PPh
                                        </h5>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 block uppercase">No. Bukti Potong</span>
                                                <span className="font-semibold text-gray-800">{invoice.withholding_tax_slip_number || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-gray-500 block uppercase">Tgl. Bukti Potong</span>
                                                    <span className="font-medium text-gray-800">{formatDate(invoice.withholding_tax_slip_date, false)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 block uppercase">Nominal Potongan</span>
                                                    <span className="font-semibold">{formatRupiah(invoice.withholding_tax_slip_nominal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ));
                    })}
                </div>
            )}

            <div className="mt-8 flex justify-end">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Kembali
                </button>
            </div>
        </ComponentCard>
    );
}

// --- Helper Components ---
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

const InfoRow = ({ label, value, isTotal = false }: { label: string | React.ReactNode, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex flex-col sm:flex-row justify-between border-b border-gray-100 py-3 last:border-b-0 ${isTotal ? 'bg-emerald-50 rounded-lg p-4 border-none shadow-inner' : ''}`}>
        <span className={`${isTotal ? 'font-bold text-emerald-800' : 'text-gray-600 text-sm'}`}>{label}</span>
        <span className={`${isTotal ? 'text-2xl font-black text-emerald-600' : 'text-gray-800 font-semibold'} text-left sm:text-right`}>
            {value || '-'}
        </span>
    </div>
);