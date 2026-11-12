"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { FaTruckLoading } from 'react-icons/fa';
import { Loader2, Check } from 'lucide-react';
import SingleDatePicker from "@/components/common/SingleDatePicker";
import moment from "moment";
import { toast } from 'react-toastify';

interface IRefiningSimple {
    id: number;
    no_scrap_gold_refining: string;
    status: number | string;
}

interface ChangeStatusRefiningDoneModalProps {
    isOpen: boolean;
    refining: IRefiningSimple | null;
    onClose: () => void;
    isSubmitting: boolean;
    onConfirm: (completedDate: string) => void;
}

const ChangeStatusRefiningDoneModal: React.FC<ChangeStatusRefiningDoneModalProps> = ({
    isOpen,
    refining,
    onClose,
    isSubmitting,
    onConfirm,
}) => {
    const [completedDate, setCompletedDate] = useState(moment().format('YYYY-MM-DD'));
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setCompletedDate(moment().format('YYYY-MM-DD'));
        }
    }, [isOpen]);

    const modalContent = useMemo(() => ({
        icon: <FaTruckLoading className="text-blue-500 text-4xl" />,
        title: 'Konfirmasi Surat Jalan Selesai?',
        message: `Surat Jalan ${refining?.no_scrap_gold_refining || ''} akan ditandai sebagai 'Selesai'.`,
        confirmText: 'Ya, Selesai',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
    }), [refining]);

    const handleConfirm = () => {
        if (!completedDate) {
            toast.error("Tanggal Selesai wajib diisi.");
            return;
        }
        onConfirm(completedDate);
    };

    if (!refining) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    {modalContent.icon}
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {modalContent.message}
                    </p>
                </div>

                <div className="mb-4">
                    <label className="block font-medium mb-1">
                        Tanggal Selesai <span className="text-red-400">*</span>
                    </label>
                    <SingleDatePicker
                        placeholderText="Pilih tanggal"
                        selectedDate={completedDate ? new Date(completedDate) : null}
                        onChange={(date: any) => setCompletedDate(moment(date).format('YYYY-MM-DD'))}
                        onClearFilter={() => setCompletedDate('')}
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

export default ChangeStatusRefiningDoneModal;

