"use client";

import React, { useEffect, useState, useCallback, Fragment, useMemo } from "react"; // <-- TAMBAHKAN useMemo
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut, alertToast, endpointUrlv2, httpPost } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, User, Building, Calendar, Info, Check, X,
    FileText, DollarSign, Scale, UserCheck, Truck, PackagePlus, Package, Edit, Trash2, Download
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusWorkOrderModal from "@/components/modal/ChangeStatusWorkOrderModal";
import AddItemWorkOrderModal from "@/components/modal/AddItemWorkOrderModal";
import EditItemWorkOrderModal from "@/components/modal/edit/EditItemWorkOrderModal";
import DeleteConfirmationModal from "@/components/modal/deactive/DeleteItemWorkOrderConfirmationModal";
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
    cokim: string;
}

interface IWorkOrderData {
    id: number;
    no_order: string;
    order_id: number;
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
    orders: IPurchaseOrderSimple[];
    items: IWorkOrderItem[];
}

interface IWorkOrderItem {
    id: number;
    no_order: string;
    order_id: number;
    item_id: number;
    pcs: string;
    kadar: string;
    bruto: string;
    disc: string;
    sg: string;
    scope: string;
    xray: string;
    netto: string;
    item_type: string;
    item: {
        name: string;
    };
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
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IWorkOrderItem | null>(null);
    const [isDownloadLoading, setIsDownloadLoading] = useState(false);
    const formatRupiah = (value: string | number | null): string => {
        const num = Number(value || 0);
        return "Rp " + num.toLocaleString('id-ID');
    };

    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gram";
    };

    const formatPersen = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + "%";
    };

    const formatNumber = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID');
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
            const response = await httpGet(endpointUrl(`work-order/${id}`), true);
            if (!response.data.data.purchase_orders) {
                response.data.data.purchase_orders = [];
            }
            if (!response.data.data.items) {
                response.data.data.items = [];
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
            await httpPost(endpointUrl(`work-order/${data.id}/receipt`), payload, true);
            toast.success("Surat Jalan berhasil ditandai 'Diterima'!");
            setIsReceiptModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const calculateModalNetto = useCallback((item: IWorkOrderItem): number => {
        const bruto = Number(item.bruto) || 0;
        const kadar = Number(item.kadar) || 0;
        return bruto * (kadar / 100);
    }, []);

    const calculateBayar = useCallback((item: IWorkOrderItem): number => {
        const nominal = Number(data?.nominal) || 0;
        const pcs = Number(item.pcs) || 0;
        const bruto = Number(item.bruto) || 0;
        const disc = Number(item.disc) || 0;

        const netto = calculateModalNetto(item);

        let finalBayar = 0;
        if (bruto > 0) {
            finalBayar = (nominal * (netto / bruto)) * pcs / bruto;
            if (disc > 0) {
                finalBayar = finalBayar - (finalBayar * disc / 100);
            }
        }
        return finalBayar;
    }, [data?.nominal, calculateModalNetto]);


    const { totalWeightDiterima, totalBayar } = useMemo(() => {
        let weight = 0;
        let bayar = 0;

        if (data?.items) {
            data.items.forEach(item => {
                weight += Number(item.pcs);
                bayar += calculateBayar(item);
            });
        }

        return { totalWeightDiterima: weight, totalBayar: bayar };
    }, [data?.items, calculateBayar, calculateModalNetto]);

    const handleOpenEditModal = (item: IWorkOrderItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleOpenDeleteModal = (item: IWorkOrderItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem || !data) return;

        setIsSubmitting(true);
        const payload = {
            work_order_item_id: selectedItem.id
        };
        try {
            await httpPost(endpointUrl(`work-order/${data.id}/delete-item`), payload, true);
            toast.success("Barang berhasil dihapus.");
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            getDetail(); // Refresh data
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`work-order/${data.id}/export`), {
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

            let filename = `surat_jalan-${moment().format("YYYY-MM-DD")}.pdf`;

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

    const handleExportReceiptItem = async () => {
        if (!data) return;
        setIsDownloadLoading(true);

        try {
            const response = await axios.get(endpointUrl(`work-order/${data.id}/export-item`), {
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

            let filename = `surat_jalan.pdf`;

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
                    <div className="flex items-center justify-end gap-3">
                        {getStatusBadge(data.status)}
                        <>
                            {data.status === "1" && (
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
                                    <Download className="w-4 h-4" />
                                    <span>Export Surat Jalan</span>
                                </button>
                            )}
                            {data.status === "2" && (
                                <button
                                    type="button"
                                    disabled={isDownloadLoading}
                                    onClick={handleExportReceiptItem}
                                    className="flex items-center gap-2  px-5 py-2.5 rounded-lg 
                                bg-gradient-to-r from-purple-500 to-violet-600 
                                text-white font-medium shadow-md hover:shadow-lg 
                                hover:from-purple-600 hover:to-violet-700 
                                transition-all duration-200"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export Barang Diterima</span>
                                </button>
                            )}

                        </>
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
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cokim</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.orders.length === 0 && (
                                            <tr><td colSpan={5} className="text-center p-3 italic text-gray-500">Tidak ada PO terlampir.</td></tr>
                                        )}
                                        {data.orders.map((po) => (
                                            <tr key={po.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{po.no_order}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(po.date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(po.weight)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(po.cokim)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatRupiah(po.nominal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        <Section title="Data Barang Diterima" icon={<Package />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pesanan</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar (%)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disc (%)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bayar</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.items.length === 0 && (
                                            <tr><td colSpan={11} className="text-center p-3 italic text-gray-500">Belum ada barang yang ditambahkan.</td></tr>
                                        )}
                                        {data.items.map((item) => {
                                            const nettoValue = calculateModalNetto(item);
                                            const bayarValue = calculateBayar(item);

                                            return (
                                                <tr key={item.id}>
                                                    {/* Kolom Aksi Baru */}
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleOpenEditModal(item)}
                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenDeleteModal(item)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded" title="Hapus">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.no_order}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.item_type}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.bruto)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.pcs)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatPersen(item.kadar)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatPersen(item.disc)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatGram(nettoValue)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{formatRupiah(bayarValue)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.sg)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.scope)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.xray)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-left text-sm font-bold uppercase">Total</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatGram(totalWeightDiterima)}</td>
                                            <td colSpan={3}></td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatRupiah(totalBayar)}</td>
                                            <td colSpan={4}></td>
                                        </tr>
                                    </tfoot>
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
                                <InfoRow label="Tanggal Surat Jalan" value={formatDate(data.date)} />
                                <InfoRow label="Tanggal Diterima" value={formatDate(data.receipt_date)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {data.status === "1" && (
                        <>
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
                                onClick={() => setIsAddItemModalOpen(true)}
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
            {data && data.status === "2" && (
                <AddItemWorkOrderModal
                    isOpen={isAddItemModalOpen}
                    onClose={() => setIsAddItemModalOpen(false)}
                    workOrderId={data.id}
                    onSuccess={getDetail}
                    baseNominal={Number(data.nominal) || 0}
                    baseTotalWeight={Number(data.total_weight) || 0}
                    existingItems={data.items || []}
                />
            )}
            {data && selectedItem && (
                <EditItemWorkOrderModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedItem(null);
                    }}
                    workOrderId={data.id}
                    itemToEdit={selectedItem}
                    baseNominal={Number(data.nominal) || 0}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedItem(null);
                        getDetail();
                    }}
                />
            )}

            {data && selectedItem && (
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedItem(null);
                    }}
                    onConfirm={handleConfirmDelete}
                    isSubmitting={isSubmitting}
                    itemName={selectedItem.item_type || 'barang ini'}
                />
            )}
        </>
    );
}


// --- Helper Components (Tidak berubah) ---

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