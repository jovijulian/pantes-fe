"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import _ from "lodash";
import axios from "axios";
import {
    Loader2, User, Calendar, Info, CheckCircle,
    FileText, Scale, Download, UserCheck, X, Box
} from "lucide-react";
import { endpointUrl, httpGet, httpPost, alertToast } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import { Modal } from '@/components/ui/modal';
interface IUserSimple {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

interface IScrapItemDetail {
    id: number;
    scrap_gold_id: string;
    item_id: string;
    no_scrap_gold: string;
    code: string;
    name_item: string;
    bruto: string | number;
    kadar: string | number;
    netto: string | number;
    status: string;
}

interface IScrapGoldData {
    id: number;
    staff_id: string;
    no_scrap_gold: string;
    date: string;
    notes: string;
    processed_date: string | null;
    status: "1" | "2" | string;
    created_by: string;
    created_at: string;
    updated_at: string;
    source: IUserSimple;
    creator: IUserSimple;
    details: IScrapItemDetail[];
}

export default function ScrapGoldDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [data, setData] = useState<IScrapGoldData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processDate, setProcessDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
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
            case '2': return <Badge color="success">Diproses</Badge>;
            default: return <Badge color="info">Unknown</Badge>;
        }
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`purchase/scrap-gold/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("Data Rongsok tidak ditemukan.");
                router.push('/purchasing/scrap-golds');
            } else {
                toast.error("Gagal mengambil detail Rongsok.");
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

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`purchase/scrap-gold/${data.id}/export`), {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `Rongsok_${data.no_scrap_gold}.pdf`);
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

    const handleProcessSubmit = async () => {
        if (!data) return;
        setIsProcessing(true);
        try {
            const payload = { processed_date: processDate };
            await httpPost(endpointUrl(`purchase/scrap-gold/${data.id}/process`), payload, true);

            toast.success("Status berhasil diubah menjadi Diproses!");
            setIsModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const totalBruto = data ? _.sumBy(data.details, (d) => Number(d.bruto)) : 0;
    const totalNetto = data ? _.sumBy(data.details, (d) => Number(d.netto)) : 0;


    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail Rongsok...</p>
        </div>
    );

    if (!data) return null;

    return (
        <>
            <ComponentCard title="Detail Transaksi Rongsok">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">No. Dokumen</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_scrap_gold}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                        {getStatusBadge(data.status)}
                        {data.status === '2' && (
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
                                {isDownloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                <span>Export</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<User />} label="Sumber (Source)" value={data.source?.name} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.creator?.name} />
                    <DetailItem icon={<Calendar />} label="Tanggal Transaksi" value={formatDate(data.date)} />
                    <DetailItem icon={<Box />} label="Total Item" value={`${data.details.length} Barang`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Total Berat" icon={<Scale />}>
                            <InfoRow label="Total Bruto" value={formatGram(totalBruto)} />
                            <InfoRow label="Total Netto" value={formatGram(totalNetto)} isTotal />
                        </Section>

                        <Section title="Daftar Barang" icon={<FileText />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.details.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.code || '-'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.name_item}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.bruto)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{item.kadar}%</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600">{formatGram(item.netto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                <Info /> Histori & Status
                            </h4>
                            <div className="space-y-3">
                                <InfoRow label="Status Saat Ini" value={getStatusBadge(data.status)} />
                                <InfoRow label="Dibuat Pada" value={formatDateTime(data.created_at)} />
                                <InfoRow label="Terakhir Update" value={formatDateTime(data.updated_at)} />
                                {data.processed_date && (
                                    <InfoRow label="Tanggal Diproses" value={formatDate(data.processed_date)} />
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <h5 className="text-sm font-medium text-gray-500 mb-2">Keterangan / Notes:</h5>
                                <div className="p-3 bg-gray-50 rounded-md text-gray-700 text-sm italic min-h-[80px]">
                                    {data.notes || "Tidak ada keterangan."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <button
                        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => router.push('/purchasing/scrap-golds')}
                    >
                        Kembali
                    </button>

                    {data.status === "1" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-2"
                            onClick={() => {
                                setProcessDate(moment().format('YYYY-MM-DD'));
                                setViewingMonthDate(new Date());
                                setIsModalOpen(true);
                            }}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Proses Data
                        </button>
                    )}
                </div>
            </ComponentCard>

            <ProcessModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleProcessSubmit}
                isProcessing={isProcessing}
                dateValue={processDate}
                onDateChange={setProcessDate}
                viewingMonthDate={viewingMonthDate}
                onMonthChange={setViewingMonthDate}
            />
        </>
    );
}

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
    isOpen, onClose, onConfirm, isProcessing, dateValue, onDateChange,
    viewingMonthDate, onMonthChange
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    isProcessing: boolean,
    dateValue: string,
    onDateChange: (val: string) => void,
    viewingMonthDate: Date,
    onMonthChange: (date: Date) => void
}) => {

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    <Info className="text-emerald-500 text-4xl" />
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Proses Rongsok?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Anda akan mengubah status data ini menjadi <b>Diproses</b>.
                        Pastikan data fisik rongsok sudah diterima.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Proses <span className="text-red-500">*</span></label>
                    <SingleDatePicker
                        placeholderText="Pilih Tanggal Proses"
                        selectedDate={dateValue ? new Date(dateValue) : null}
                        onChange={(date: any) => onDateChange(moment(date).format('YYYY-MM-DD'))}
                        onClearFilter={() => onDateChange('')}
                        viewingMonthDate={viewingMonthDate}
                        onMonthChange={onMonthChange}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none disabled:opacity-70 transition-colors"
                        onClick={onConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing && <Loader2 className="animate-spin w-4 h-4" />}
                        {isProcessing ? "Memproses..." : "Ya, Proses"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};