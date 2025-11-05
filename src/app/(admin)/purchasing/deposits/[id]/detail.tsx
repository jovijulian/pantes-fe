"use client";

import React, { useEffect, useState, useCallback, Fragment, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut, httpPost, httpDelete, alertToast, endpointUrlv2 } from "@/../helpers"; 
import ComponentCard from "@/components/common/ComponentCard";
import {
    Loader2, User, Building, Calendar, Info, Check, X,
    FileText, DollarSign, Scale, UserCheck, Truck, PackagePlus, Package, Edit, Trash2
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusDepositModal from "@/components/modal/ChangeStatusDepositModal";
import SelectItemSetorModal from "@/components/modal/SelectItemSetorModal"; 
import DeleteConfirmationModal from "@/components/modal/deactive/DeleteItemDepositConfirmationModal"; 
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
interface IEmployee {
    id: number;
    name: string;
}

interface IDepositDetail {
    id: number; 
    work_order_item_id: string;
    item_id: string;
    code_item: string;
    scope: string;
    sg: string;
    xray: string;
    weight: string;
    kadar: string;
    jenis_barang: string;
}

interface IDepositData {
    id: number;
    no_payment: string;
    date: string;
    validated_date: string | null;
    deposit_date: string | null;
    paid_off_date: string | null;
    notes: string;
    status: "1" | "2" | "3" | "4" | null;
    created_at: string;
    created_by: IUserSimple;
    supplier: ISupplier;
    employee: IEmployee;
    details: IDepositDetail[];
    supplier_id: number | null;
}
type ModalAction = 'Validasi' | 'Setor' | 'Lunas' | null;

export default function DepositDetailPage() {
    const [data, setData] = useState<IDepositData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id); 
    moment.locale('id');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IDepositDetail | null>(null); 
    const [modalAction, setModalAction] = useState<ModalAction>(null);
    const formatGram = (value: string | number | null): string => {
        const num = Number(value || 0);
        return num.toLocaleString('id-ID') + " gr";
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
        return moment(dateStr).format('DD MMMM YYYY, HH:mm'); 
    };

    const getStatusBadge = (status: string | null) => {
        if (status === null) status = "1"; 
        
        let color: "success" | "warning" | "info";
        let label = "Unknown";
        switch (status) {
            case '1': color = 'warning'; label = 'Baru'; break;
            case '2': color = 'info'; label = 'Valid'; break;
            case '3': color = 'info'; label = 'Setor'; break;
            case '4': color = 'success'; label = 'Lunas'; break;
            default: color = 'warning'; label = 'Baru'; break;
        }
        return <Badge color={color}>{label}</Badge>;
    };

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrlv2(`deposit/${id}`), true);
            if (!response.data.data.details) {
                response.data.data.details = [];
            }
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Data Setor tidak ditemukan.");
                router.push('/purchasing/deposits'); 
            } else {
                toast.error("Gagal mengambil detail Setor.");
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

    const totalWeightDiterima = useMemo(() => {
        if (!data?.details) return 0;
        return data.details.reduce((acc, item) => acc + Number(item.weight), 0);
    }, [data?.details]);

    const handleOpenStatusModal = (action: ModalAction) => {
        setModalAction(action);
        setIsStatusModalOpen(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!data || !modalAction) return;

        setIsSubmitting(true);
        let newStatus = "";
        switch (modalAction) {
            case 'Validasi': newStatus = "2"; break;
            case 'Setor': newStatus = "3"; break;
            case 'Lunas': newStatus = "4"; break;
            default: setIsSubmitting(false); return;
        }
        
        const payload = { status: newStatus };

        try {
            await httpPost(endpointUrlv2(`deposit/${data.id}/change-status`), payload, true);
            toast.success(`Status berhasil diubah menjadi "${modalAction}"!`);
            setIsStatusModalOpen(false);
            getDetail();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmAddItem = async (selectedItems: any[]) => { 
        if (!data) return;
        setIsSubmitting(true);
        
        const payload = {
            items: selectedItems.map(item => ({
                work_order_item_id: item.work_order_item_id,
                item_id: item.item_id,
                code_item: item.code_item
            }))
        };

        try {
            await httpPost(endpointUrlv2(`deposit/${data.id}/add-item`), payload, true);
            toast.success("Barang berhasil ditambahkan!");
            setIsAddItemModalOpen(false);
            getDetail(); 
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (item: IDepositDetail) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem || !data) return;
        
        setIsSubmitting(true);
        const payload = {
            deposit_detail_id: selectedItem.id
        };
        try {
            await httpPost(endpointUrlv2(`deposit/${data.id}/delete-item`), payload, true);
            toast.success("Barang berhasil dihapus.");
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
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
            <p className="ml-4 text-gray-700">Memuat detail Setor...</p>
        </div>
    );

    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau Setor tidak ditemukan.</p>
            <button onClick={() => router.push('/purchasing/work-orders')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );
    
    const currentStatus = data.status || "1"; 

    return (
        <>
            <ComponentCard title="Detail Setor">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div>
                        <span className="text-sm text-gray-500">No. Pembayaran</span>
                        <h1 className="text-2xl font-bold text-gray-800">{data.no_payment}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(data.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<Building />} label="Supplier" value={data.supplier.name} />
                    <DetailItem icon={<User />} label="Yang Menyerahkan" value={data.employee.name} />
                    <DetailItem icon={<Calendar />} label="Tanggal Setor" value={moment(data.date).format('DD MMMM YYYY')} />
                    <DetailItem icon={<UserCheck />} label="Dibuat Oleh" value={data.created_by.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Data Barang" icon={<Package />}>
                            {currentStatus !== "4" && (
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddItemModalOpen(true)}
                                        disabled={!data.supplier_id} 
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        <PackagePlus className="w-4 h-4" />
                                        Tambah Barang
                                    </button>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {currentStatus !== "4" && (
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            )}
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Barang</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scope</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SG</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">X-Ray</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat (gr)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kadar (%)</th>
                                        </tr>
                                    </thead>
                                    
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.details.length === 0 && (
                                            <tr><td colSpan={8} className="text-center p-3 italic text-gray-500">Belum ada barang yang ditambahkan.</td></tr>
                                        )}
                                        {data.details.map((item) => (
                                            <tr key={item.id}>
                                                {currentStatus !== "4" && (
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={() => handleOpenDeleteModal(item)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded" title="Hapus">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.jenis_barang}</td> 
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{item.code_item}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.scope)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.sg)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatNumber(item.xray)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatGram(item.weight)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatPersen(item.kadar)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    
                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan={currentStatus !== "4" ? 6 : 5} className="px-4 py-3 text-left text-sm font-bold uppercase">Total</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold">{formatGram(totalWeightDiterima)}</td>
                                            <td></td>
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
                                <InfoRow label="Catatan" value={data.notes || "-"} />
                                <InfoRow label="Dibuat" value={formatDate(data.created_at)} />
                                <InfoRow label="Tgl. Validasi" value={formatDate(data.validated_date)} />
                                <InfoRow label="Tgl. Setor" value={formatDate(data.deposit_date)} />
                                <InfoRow label="Tgl. Lunas" value={formatDate(data.paid_off_date)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    {currentStatus === "1" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleOpenStatusModal('Validasi')}
                        >
                            <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                            Validasi
                        </button>
                    )}
                    {currentStatus === "2" && (
                        <button
                            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                            onClick={() => handleOpenStatusModal('Setor')}
                        >
                            <Check className="w-4 h-4 inline-block -mt-1 mr-1" />
                            Tandai Setor
                        </button>
                    )}
                    {currentStatus === "3" && (
                         <button
                            className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                            onClick={() => handleOpenStatusModal('Lunas')}
                        >
                            <DollarSign className="w-4 h-4 inline-block -mt-1 mr-1" />
                            Tandai Lunas
                        </button>
                    )}
                </div>
            </ComponentCard>

            {data && (
                <ChangeStatusDepositModal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    deposit={{ id: data.id, no_payment: data.no_payment, status: data.status }}
                    actionType={modalAction}
                    isSubmitting={isSubmitting}
                    onConfirm={handleConfirmStatusChange}
                    paymentDate="" 
                    setPaymentDate={() => {}} 
                />
            )}
            
            {data && currentStatus !== "4" && (
                <SelectItemSetorModal
                    isOpen={isAddItemModalOpen}
                    onClose={() => setIsAddItemModalOpen(false)}
                    onConfirm={handleConfirmAddItem}
                    supplierId={data.supplier_id ? Number(data.supplier_id) : null}
                    existingItemIds={data.details.map(item => Number(item.work_order_item_id))}
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
                    itemName={selectedItem.code_item || 'barang ini'}
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