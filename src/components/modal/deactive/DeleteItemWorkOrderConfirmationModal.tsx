"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Loader2, X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean; 
    itemName: string;
}

const DeleteItemWorkOrderConfirmationModal: React.FC<DeleteModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isSubmitting, 
    itemName 
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            {/* z-index 99999 (sama seperti modal lain) */}
            <Dialog as="div" className="relative z-99999" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                    Konfirmasi Hapus
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        Anda yakin ingin menghapus barang ini?
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded mt-2">
                                        {itemName}
                                    </p>
                                    <p className="text-xs text-red-600 mt-1">
                                        Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2 disabled:bg-gray-400"
                                        onClick={onConfirm}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                        {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DeleteItemWorkOrderConfirmationModal;