"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { 
    FaCheckCircle, FaExclamationTriangle, 
    FaFileInvoiceDollar, 
    FaShieldAlt 
} from 'react-icons/fa';
import { Info, Loader2 } from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker"; 
import moment from "moment"; 
import { toast } from 'react-toastify';

interface ChangeStatusModalProps {
    isOpen: boolean;
    order: {
        id: number;
        status: string;
    } | null;
    actionType: 'Validasi' | 'Disetujui' | 'Bayar' | null; 
    onClose: () => void;
    isSubmitting: boolean; 
    onConfirm: (paymentDate?: string) => void; 
    paymentDate: string;
    setPaymentDate: (date: string) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ 
    isOpen, 
    order, 
    actionType, 
    onClose, 
    isSubmitting, 
    onConfirm,
    paymentDate,
    setPaymentDate
}) => {
    
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const modalContent = useMemo(() => {
        switch(actionType) {
            case 'Validasi':
                return {
                    icon: <Info className="text-blue-500 text-4xl" />,
                    title: 'Validasi Order Ini?',
                    message: `Apakah Anda yakin ingin memvalidasi order ini? (Status akan berubah menjadi 'Valid')`,
                    confirmText: 'Ya, Validasi',
                    confirmColor: 'bg-blue-600 hover:bg-blue-700',
                };
            case 'Disetujui':
                return {
                    icon: <Info className="text-green-500 text-4xl" />, 
                    title: 'Setujui Order Ini?',
                    message: `Apakah Anda yakin ingin menyetujui order ini? (Status akan berubah menjadi 'Approved')`,
                    confirmText: 'Ya, Setujui',
                    confirmColor: 'bg-green-600 hover:bg-green-700',
                };
            case 'Bayar':
                return {
                    icon: <FaFileInvoiceDollar className="text-purple-500 text-4xl" />,
                    title: 'Konfirmasi Pembayaran?',
                    message: `Status akan diubah menjadi 'Bayar'. Harap masukkan tanggal pembayaran.`,
                    confirmText: 'Ya, Konfirmasi Bayar',
                    confirmColor: 'bg-purple-600 hover:bg-purple-700',
                };
            default:
                return {
                    icon: <Info className="text-yellow-500 text-4xl" />,
                    title: 'Aksi Tidak Valid',
                    message: 'Silakan tutup dan coba lagi.',
                    confirmText: 'Konfirmasi',
                    confirmColor: 'bg-gray-600',
                };
        }
    }, [actionType]);

    const handleConfirm = () => {
        if (actionType === 'Bayar' && !paymentDate) {
            toast.error("Tanggal Bayar wajib diisi.");
            return;
        }
        onConfirm(paymentDate); 
    };

    if (!order || !actionType) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    {/* {modalContent.icon} */}
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {modalContent.message}
                    </p>
                </div>

                {actionType === 'Bayar' && (
                    <div className="mb-4">
                        <label className="block font-medium mb-1">
                            Tanggal Bayar <span className="text-red-400">*</span>
                        </label>
                        <SingleDatePicker
                            placeholderText="Pilih tanggal"
                            selectedDate={paymentDate ? new Date(paymentDate) : null}
                            onChange={(date: any) => setPaymentDate(moment(date).format('YYYY-MM-DD'))}
                            onClearFilter={() => setPaymentDate('')}
                            viewingMonthDate={viewingMonthDate}
                            onMonthChange={setViewingMonthDate}
                        />
                    </div>
                )}

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md border text-sm font-medium transition-all dark:border-gray-600"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 transition-all flex items-center gap-2 ${modalContent.confirmColor}`}
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        {isSubmitting ? 'Memproses...' : modalContent.confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChangeStatusModal;