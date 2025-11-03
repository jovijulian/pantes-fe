"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { 
    FaTruckLoading 
} from 'react-icons/fa';
import { Info, Loader2, Check } from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import moment from "moment";
import { toast } from 'react-toastify';

interface IWorkOrderSimple {
    id: number;
    no_work_order: string;
    status: string;
}

interface ChangeStatusModalProps {
    isOpen: boolean;
    workOrder: IWorkOrderSimple | null;
    onClose: () => void;
    isSubmitting: boolean; 
    onConfirm: (receiptDate: string) => void; 
}

const ChangeStatusWorkOrderModal: React.FC<ChangeStatusModalProps> = ({ 
    isOpen, 
    workOrder, 
    onClose, 
    isSubmitting, 
    onConfirm,
}) => {
    
    const [receiptDate, setReceiptDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setReceiptDate(moment().format('YYYY-MM-DD'));
        }
    }, [isOpen]);

    const modalContent = useMemo(() => ({
        icon: <FaTruckLoading className="text-green-500 text-4xl" />,
        title: 'Konfirmasi Penerimaan Barang?',
        message: `Surat Jalan ${workOrder?.no_work_order || ''} akan ditandai sebagai 'Diterima'.`,
        confirmText: 'Ya, Diterima',
        confirmColor: 'bg-green-600 hover:bg-green-700',
    }), [workOrder]);

    const handleConfirm = () => {
        if (!receiptDate) {
            toast.error("Tanggal Terima wajib diisi.");
            return;
        }
        onConfirm(receiptDate); 
    };

    if (!workOrder) return null;

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

                <div className="mb-4">
                    <label className="block font-medium mb-1">
                        Tanggal Terima <span className="text-red-400">*</span>
                    </label>
                    <SingleDatePicker
                        placeholderText="Pilih tanggal"
                        selectedDate={receiptDate ? new Date(receiptDate) : null}
                        onChange={(date: any) => setReceiptDate(moment(date).format('YYYY-MM-DD'))}
                        onClearFilter={() => setReceiptDate('')}
                        viewingMonthDate={viewingMonthDate}
                        onMonthChange={setViewingMonthDate}
                    />
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

export default ChangeStatusWorkOrderModal;