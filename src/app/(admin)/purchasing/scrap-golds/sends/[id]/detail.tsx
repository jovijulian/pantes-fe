"use client";

import React, { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import _ from "lodash";
import axios from "axios";
import {
    Loader2, User, Calendar, Info, CheckCircle,
    FileText, Scale, Download, UserCheck, X, Box,
    Truck, Warehouse, Store, Factory, ArrowRight,
    MapPin, PackageCheck, Plus, Edit
} from "lucide-react";
import { 
    FaTruck, FaClipboardCheck, FaDolly 
} from "react-icons/fa";

// Components & Helpers
import { endpointUrl, httpGet, httpPost, alertToast } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Modal } from '@/components/ui/modal';

// Import Modal Baru
import AddFinishedGoodModal from "@/components/modal/scrap-gold/AddFinishedGoodModal";

// --- Interfaces ---

interface IExpedition {
    id: number;
    code: string;
    name: string;
}

interface IPartner {
    id: number;
    name: string;
    email?: string;
    code?: string;
    phone?: string;
}

interface ISendDetail {
    id: number;
    scrap_gold_send_id: string;
    item_id: string;
    no_scrap_gold_send: string;
    name_item: string;
    bruto: string | number;
    kadar: string | number;
    netto: string | number;
    status: string;
}

// Tambahkan interface untuk Finished Goods jika BE nanti mereturn datanya
interface IFinishedGood {
    id: number;
    item_id: number;
    item_type: string;
    netto: string | number;
    sg: string | number;
    scope: string | number;
    xray: string | number;
}

interface ISendTransactionData {
    id: number;
    expedition_id: string;
    type_purpose: "1" | "2" | "3";
    supplier_id: string | null;
    vendor_id: string | null;
    no_scrap_gold_send: string;
    date: string;
    notes: string;
    receipt_date: string | null;
    status: "1" | "2" | "3" | "4";
    created_at: string;
    updated_at: string;
    
    // Relations
    created_by?: IPartner;
    expedition?: IExpedition;
    supplier?: IPartner;
    vendor?: IPartner;
    details: ISendDetail[];
    items_finished_good?: IFinishedGood[]; // Asumsi field name dari BE
}

export default function ScrapGoldSendDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    
    // Data State
    const [data, setData] = useState<ISendTransactionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    
    // Modal Process State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processDate, setProcessDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [nextStatus, setNextStatus] = useState<number | null>(null);

    // Modal Finished Good State
    const [isFGModalOpen, setIsFGModalOpen] = useState(false);
    const [isFGSubmitting, setIsFGSubmitting] = useState(false);

    // --- Formatters ---
    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + " Gr";
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMMM YYYY');
    };

    const formatDateTime = (dateStr: string | null): string => {
        if (!dateStr) return "-";
        return moment(dateStr).format('DD MMM YYYY HH:mm');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '1': return <Badge color="warning">New</Badge>;
            case '2': return <Badge color="info">Dikirim</Badge>;
            case '3': return <Badge color="success">Diterima</Badge>;
            case '4': return <Badge color="primary">Stock</Badge>;
            default: return <Badge color="info">Unknown</Badge>;
        }
    };

    // --- Fetch Data ---
    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/scrap-gold/send/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("Data Pengiriman tidak ditemukan.");
                router.push('/purchasing/scrap-golds/sends');
            } else {
                toast.error("Gagal mengambil detail.");
                alertToast(error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    // --- Actions Process ---
    
    const handleOpenProcessModal = (targetStatus: number) => {
        setNextStatus(targetStatus);
        setProcessDate(moment().format('YYYY-MM-DD'));
        setViewingMonthDate(new Date());
        setIsModalOpen(true);
    };

    const handleProcessSubmit = async () => {
        if (!data || !nextStatus) return;
        setIsProcessing(true);
        try {
            const payload: any = { status: nextStatus };
            if (nextStatus === 3) {
                payload.receipt_date = processDate;
            }

            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/change-status`), payload, true);

            toast.success("Status berhasil diupdate!");
            setIsModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Action Add Finished Goods ---

    const handleAddFinishedGood = async (payload: any) => {
        if (!data) return;
        setIsFGSubmitting(true);
        try {
            await httpPost(endpointUrl(`purchase/scrap-gold/send/${data.id}/add-items-finished-good`), payload, true);
            toast.success("Barang Jadi berhasil ditambahkan!");
            setIsFGModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsFGSubmitting(false);
        }
    };

    // --- Action Edit Scrap Gold (Placeholder) ---
    const handleEditScrapItem = (item: ISendDetail) => {
        // Logika untuk membuka modal edit scrap gold (mirip dengan page Create/Edit)
        // Anda bisa reuse modal edit item di sini.
        toast.info(`Edit Item: ${item.name_item} (Implementasi Modal Edit)`);
    };

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);
        try {
            const response = await axios.get(endpointUrl(`purchase/scrap-gold/send/${data.id}/export`), {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `Kirim_Rongsok_${data.no_scrap_gold_send}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Berhasil download laporan.");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Gagal export PDF.");
        } finally {
            setIsDownloadLoading(false);
        }
    };

    // --- Helpers ---
    const getPurposeInfo = (row: ISendTransactionData) => {
        if (row.type_purpose === "1") return { icon: <Warehouse />, label: "Gudang Internal", name: "Gudang CT" };
        if (row.type_purpose === "2") return { icon: <Store />, label: "Supplier", name: row.supplier?.name || "-" };
        if (row.type_purpose === "3") return { icon: <Factory />, label: "Vendor / Pabrik", name: row.vendor?.name || "-" };
        return { icon: <Info />, label: "Unknown", name: "-" };
    };

    const totalBruto = data ? _.sumBy(data.details, (d) => Number(d.bruto)) : 0;
    const totalNetto = data ? _.sumBy(data.details, (d) => Number(d.netto)) : 0;

    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail...</p>
        </div>
    );
    if (!data) return null;

    const purposeInfo = getPurposeInfo(data);
    const isReceived = ["3", "4"].includes(data.status); // Status Terima atau Stock

    return (
        <>
            <ComponentCard title="Detail Pengiriman Rongsok">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">No. Dokumen</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_scrap_gold_send}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                        {getStatusBadge(data.status)}
                        {data.status !== '1' && (
                            <button
                                type="button"
                                disabled={isDownloadLoading}
                                onClick={handleExport}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg 
                                bg-gradient-to-r from-blue-500 to-indigo-600 
                                text-white font-medium shadow-md hover:shadow-lg 
                                hover:from-blue-600 hover:to-indigo-700 
                                transition-all duration-200"
                            >
                                {isDownloadLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                                <span>Export</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<Calendar />} label="Tanggal Kirim" value={formatDate(data.date)} />
                    <DetailItem icon={<Truck />} label="Ekspedisi" value={data.expedition?.name} />
                    <DetailItem icon={purposeInfo.icon} label={`Tujuan (${purposeInfo.label})`} value={purposeInfo.name} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by?.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                            <Section title="Daftar Barang Dikirim (Rongsok)" icon={<FileText />}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                {/* Kolom Aksi Edit jika status allow */}
                                                {(data.status === '1' || data.status === '2') && (
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">#</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.details.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        <div className="font-medium text-gray-800">{item.name_item}</div>
                                                        <div className="text-xs text-gray-400">{item.item_id ? item.name_item.split(' ')[0] : '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.bruto)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.kadar}%</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600">{formatGram(item.netto)}</td>
                                                    {(data.status === '1' || data.status === '2') && (
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleEditScrapItem(item)}
                                                                className="text-gray-400 hover:text-blue-600"
                                                                title="Edit Item Rongsok"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3 text-right">Total</td>
                                                <td className="px-4 py-3 text-right">{formatGram(totalBruto)}</td>
                                                <td></td>
                                                <td className="px-4 py-3 text-right text-blue-700">{formatGram(totalNetto)}</td>
                                                {(data.status === '1' || data.status === '2') && <td></td>}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Section>
                        </div>

                        {/* SECTION 2: FINISHED GOODS (OUTPUT) - Muncul jika Status >= 3 */}
                        {isReceived && (
                             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <PackageCheck className="text-blue-600" /> 
                                        Hasil Produksi / Barang Jadi
                                    </h4>
                                    <button
                                        onClick={() => setIsFGModalOpen(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 shadow-sm transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Tambah Barang Jadi
                                    </button>
                                </div>

                                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-blue-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {/* Render Finished Goods jika ada data dari BE */}
                                            {data.items_finished_good && data.items_finished_good.length > 0 ? (
                                                data.items_finished_good.map((fg, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{fg.item_type}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-bold">{formatGram(fg.netto)}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.sg}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.scope}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{fg.xray}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic text-sm">
                                                        Belum ada hasil produksi yang diinput.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: History & Action */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                <Info /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status Saat Ini" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat Pada" value={formatDateTime(data.created_at)} />
                                <InfoRow label="Terakhir Update" value={formatDateTime(data.updated_at)} />
                                {data.receipt_date && (
                                    <InfoRow label="Tanggal Diterima" value={formatDate(data.receipt_date)} />
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <h5 className="text-sm font-medium text-gray-500 mb-2">Keterangan / Notes:</h5>
                                <div className="p-3 bg-gray-50 rounded-md text-gray-700 text-sm italic min-h-[80px]">
                                    {data.notes || "Tidak ada keterangan."}
                                </div>
                            </div>

                            {/* Action Button Section in Sidebar */}
                            <div className="mt-6 pt-4 border-t space-y-3">
                                {data.status === "1" && (
                                    <button
                                        onClick={() => handleOpenProcessModal(2)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-all"
                                    >
                                        Proses Kirim Barang
                                    </button>
                                )}
                                {data.status === "2" && (
                                    <button
                                        onClick={() => handleOpenProcessModal(3)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm transition-all"
                                    >
                                         Proses Terima Barang
                                    </button>
                                )}
                                {data.status === "3" && (
                                    <button
                                        onClick={() => handleOpenProcessModal(4)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-sm transition-all"
                                    >
                                       Masukkan ke Stock
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-start mt-8 pt-6 border-t">
                    <button
                        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => router.push('/purchasing/scrap-golds/sends')}
                    >
                        Kembali ke List
                    </button>
                </div>
            </ComponentCard>

            {/* Modal Process Status */}
            <ProcessModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleProcessSubmit}
                isProcessing={isProcessing}
                dateValue={processDate}
                onDateChange={setProcessDate}
                viewingMonthDate={viewingMonthDate}
                onMonthChange={setViewingMonthDate}
                nextStatus={nextStatus}
            />

            {/* Modal Add Finished Goods */}
            <AddFinishedGoodModal 
                isOpen={isFGModalOpen}
                onClose={() => setIsFGModalOpen(false)}
                onConfirm={handleAddFinishedGood}
                isSubmitting={isFGSubmitting}
            />
        </>
    );
}

// --- Sub Components ---
// (Section, DetailItem, InfoRow, ProcessModal sama seperti sebelumnya)
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            <span className="text-blue-500">{icon}</span> {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null | undefined }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full shadow-sm">
        <div className="text-blue-500 text-xl mt-1 p-2 bg-blue-50 rounded-full">{icon}</div>
        <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, isTotal = false }: { label: string, value: string | number | React.ReactNode | null, isTotal?: boolean }) => (
    <div className={`flex justify-between items-center py-2 ${!isTotal && 'border-b border-gray-50 last:border-0'} ${isTotal ? 'bg-blue-50 p-3 rounded-lg mt-2' : ''}`}>
        <span className={`${isTotal ? 'font-bold text-blue-800' : 'text-gray-500'} text-sm`}>{label}</span>
        <span className={`font-semibold text-right text-sm ${isTotal ? 'text-lg text-blue-700' : 'text-gray-800'}`}>
            {value || '-'}
        </span>
    </div>
);

const ProcessModal = ({
    isOpen, onClose, onConfirm, isProcessing,
    dateValue, onDateChange,
    viewingMonthDate, onMonthChange,
    nextStatus
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isProcessing: boolean,
    dateValue: string,
    onDateChange: (val: string) => void,
    viewingMonthDate: Date,
    onMonthChange: (date: Date) => void,
    nextStatus: number | null
}) => {
   

    const modalContent = useMemo(() => {
        switch (nextStatus) {
            case 2:
                return {
                    title: "Konfirmasi Pengiriman",
                    desc: "Anda akan mengubah status menjadi DIKIRIM. Pastikan barang sudah disiapkan.",
                    icon: <FaTruck className="text-blue-500 text-4xl" />,
                    btnColor: "bg-blue-600 hover:bg-blue-700",
                    btnText: "Kirim",
                    needsDate: false
                };
            case 3:
                return {
                    title: "Konfirmasi Penerimaan",
                    desc: "Anda akan mengubah status menjadi DITERIMA. Silakan isi tanggal terima.",
                    icon: <FaClipboardCheck className="text-emerald-500 text-4xl" />,
                    btnColor: "bg-emerald-600 hover:bg-emerald-700",
                    btnText: "Terima Barang",
                    needsDate: true
                };
            case 4:
                return {
                    title: "Konfirmasi Masuk Stock",
                    desc: "Barang akan dimasukkan kembali ke STOCK.",
                    icon: <FaDolly className="text-purple-500 text-4xl" />,
                    btnColor: "bg-purple-600 hover:bg-purple-700",
                    btnText: "Masuk Stock",
                    needsDate: false
                };
            default:
                return {
                    title: "Proses Data",
                    desc: "Lanjutkan proses?",
                    icon: <Info className="text-gray-500 text-4xl" />,
                    btnColor: "bg-gray-600 hover:bg-gray-700",
                    btnText: "Proses",
                    needsDate: false
                };
        }
    }, [nextStatus]);
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    {modalContent.icon}
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                    <p className="text-sm text-gray-600">
                        {modalContent.desc}
                    </p>
                </div>

                {modalContent.needsDate && (
                    <div className="mb-6">
                        <label className="block font-medium mb-1 text-sm text-gray-700">
                            Tanggal Terima <span className="text-red-400">*</span>
                        </label>
                        <SingleDatePicker
                            placeholderText="Pilih Tanggal"
                            selectedDate={dateValue ? new Date(dateValue) : null}
                            onChange={(date: any) => onDateChange(moment(date).format('YYYY-MM-DD'))}
                            onClearFilter={() => onDateChange('')}
                            viewingMonthDate={viewingMonthDate}
                            onMonthChange={onMonthChange}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${modalContent.btnColor}`}
                    >
                        {isProcessing && <Loader2 className="animate-spin w-4 h-4" />}
                        {isProcessing ? "Memproses..." : modalContent.btnText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};