"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Info, Loader2, Check } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    itemCount: number;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, isSubmitting, itemCount }: ConfirmationModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999 " onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 h-full w-full bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                    <Info className="w-6 h-6 text-blue-600" />
                                    Konfirmasi Transaksi
                                </Dialog.Title>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Pastikan data rongsok yang diinput sudah benar.
                                    </p>
                                    <div className="text-sm p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <p>Jumlah Item: <span className="font-semibold text-gray-900">{itemCount}</span></p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" onClick={onClose} disabled={isSubmitting}>
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
                                        onClick={onConfirm}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}