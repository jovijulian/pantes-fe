"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal'; 
import { 
    FaCheck, FaCheckCircle, FaDollarSign
} from 'react-icons/fa';
import { Check, Info, Loader2 } from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker"; 
import moment from "moment";
import { toast } from 'react-toastify';

interface IDepositSimple {
    id: number;
    no_payment: string; 
    status: string | null;
}

type ModalAction = 'Validasi' | 'Setor' | 'Lunas' | null;

interface ChangeStatusModalProps {
    isOpen: boolean;
    deposit: IDepositSimple | null;
    actionType: ModalAction; 
    onClose: () => void;
    isSubmitting: boolean; 
    onConfirm: (paymentDate?: string) => void; 
    paymentDate: string;
    setPaymentDate: (date: string) => void;
}

const ChangeStatusDepositModal: React.FC<ChangeStatusModalProps> = ({ 
    isOpen, 
    deposit, 
    actionType, 
    onClose, 
    isSubmitting, 
    onConfirm,
    paymentDate,
    setPaymentDate
}) => {
    
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setPaymentDate(moment().format('YYYY-MM-DD'));
        }
    }, [isOpen]);

    const modalContent = useMemo(() => {
        let needsDate = false;
        let dateLabel = "";

        switch(actionType) {
            case 'Validasi':
                needsDate = false; 
                dateLabel = "Tanggal Validasi";
                return {
                    icon: <Info className="text-blue-500 text-4xl" />,
                    title: 'Validasi Data Setor?',
                    message: `Anda akan memvalidasi data setor: ${deposit?.no_payment || ''}`,
                    confirmText: 'Ya, Validasi',
                    confirmColor: 'bg-blue-600 hover:bg-blue-700',
                    needsDate,
                    dateLabel
                };
            case 'Setor':
                needsDate = false;
                dateLabel = "Tanggal Setor";
                return {
                    icon: <FaCheckCircle className="text-green-500 text-4xl" />,
                    title: 'Konfirmasi Setor?',
                    message: `Status akan diubah menjadi 'Setor'. Harap masukkan tanggal setor.`,
                    confirmText: 'Ya, Setor',
                    confirmColor: 'bg-green-600 hover:bg-green-700',
                    needsDate,
                    dateLabel
                };
            case 'Lunas':
                needsDate = false;
                dateLabel = "Tanggal Lunas";
                return {
                    icon: <FaDollarSign className="text-purple-500 text-4xl" />,
                    title: 'Konfirmasi Lunas?',
                    message: `Status akan diubah menjadi 'Lunas'. Harap masukkan tanggal pelunasan.`,
                    confirmText: 'Ya, Lunas',
                    confirmColor: 'bg-purple-600 hover:bg-purple-700',
                    needsDate,
                    dateLabel
                };
            default:
                return {
                    icon: <Info className="text-yellow-500 text-4xl" />,
                    title: 'Aksi Tidak Valid',
                    message: 'Silakan tutup dan coba lagi.',
                    confirmText: 'Konfirmasi',
                    confirmColor: 'bg-gray-600',
                    needsDate: false,
                    dateLabel: ""
                };
        }
    }, [actionType, deposit]);

    const handleConfirm = () => {
        if (modalContent.needsDate && !paymentDate) {
            toast.error(`${modalContent.dateLabel} wajib diisi.`);
            return;
        }
        onConfirm(paymentDate); 
    };

    if (!deposit) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {modalContent.message}
                    </p>
                </div>

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
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {isSubmitting ? 'Memproses...' : modalContent.confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChangeStatusDepositModal;