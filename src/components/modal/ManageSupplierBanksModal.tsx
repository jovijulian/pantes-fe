"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrlv2, httpDelete, httpGet, httpPost, httpPut } from '@/../helpers'; 
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select-custom';
import { Loader2, Plus, Save, Trash2, X, Info } from 'lucide-react';
import _ from "lodash";
import { FaEdit } from 'react-icons/fa';

interface SelectOption { value: string; label: string; }

interface IAssignedBank {
    id: number;
    bank_id: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    bank: { 
        bank_name: string;
    };
}

interface IBankFormState {
    bank_id: number | null;
    account_name: string;
    account_number: string;
}

interface ISupplierData {
    id: number;
    name: string;
}

interface ManageBanksModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierData: ISupplierData | null;
}

const ManageSupplierBanksModal: React.FC<ManageBanksModalProps> = ({ 
    isOpen, 
    onClose, 
    supplierData
}) => {
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignedBanks, setAssignedBanks] = useState<IAssignedBank[]>([]);
    const [allBankOptions, setAllBankOptions] = useState<SelectOption[]>([]);
    const [form, setForm] = useState<IBankFormState>(initialFormState());
    const [mode, setMode] = useState<'add' | 'edit'>('add');
    const [selectedSupplierBankId, setSelectedSupplierBankId] = useState<number | null>(null);
    useEffect(() => {
        if (isOpen) {
            const fetchMasterBanks = async () => {
                try {
                    const res = await httpGet(endpointUrlv2("master/bank/dropdown"), true);
                    setAllBankOptions(res.data.data.map((b: any) => ({
                        value: b.id.toString(),
                        label: b.bank_name, 
                    })));
                } catch (error) {
                    toast.error("Gagal memuat data master bank.");
                }
            };
            fetchMasterBanks();
        }
    }, [isOpen]);

    const fetchAssignedBanks = async () => {
        if (!supplierData) return;
        setLoading(true);
        const params ={ 
            per_page: 100,
        }
        try {
            const res = await httpGet(endpointUrlv2(`master/supplier/${supplierData.id}/bank`), true, params);
            setAssignedBanks(res.data.data.data);
        } catch (error) {
            toast.error("Gagal memuat bank milik supplier.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && supplierData) {
            fetchAssignedBanks();
            handleCancelEdit(); 
        }
    }, [isOpen, supplierData]);

    function initialFormState(): IBankFormState {
        return {
            bank_id: null,
            account_name: "",
            account_number: "",
        };
    }
    
    const handleFormChange = (field: keyof IBankFormState, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierData || !form.bank_id || !form.account_name || !form.account_number) {
            toast.warn("Harap isi semua field bank.");
            return;
        }

        setIsSubmitting(true);
        const payload = {
            bank_id: form.bank_id,
            account_name: form.account_name,
            account_number: form.account_number,
        };

        try {
            if (mode === 'add') {
                await httpPost(endpointUrlv2(`master/supplier/${supplierData.id}/bank`), payload, true);
                toast.success("Bank baru berhasil ditambahkan.");
            } else {
                await httpPost(endpointUrlv2(`master/supplier/${supplierData.id}/bank/${selectedSupplierBankId}/update`), payload, true);
                toast.success("Bank berhasil diupdate.");
            }
            fetchAssignedBanks(); 
            handleCancelEdit(); 
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleStartEdit = (bank: IAssignedBank) => {
        setMode('edit');
        setSelectedSupplierBankId(bank.id); 
        setForm({
            bank_id: bank.bank_id,
            account_name: bank.account_name,
            account_number: bank.account_number,
        });
    };
    
    const handleCancelEdit = () => {
        setMode('add');
        setForm(initialFormState());
        setSelectedSupplierBankId(null);
    };

    const handleDeactive = async (supplierBankId: number) => {
        if (!supplierData || !confirm("Anda yakin ingin menonaktifkan bank ini?")) {
            return;
        }

        setIsSubmitting(true);
        try {
            await httpDelete(endpointUrlv2(`master/supplier/${supplierData.id}/bank/${supplierBankId}/deactive`), true);
            toast.success("Bank berhasil dinonaktifkan.");
            fetchAssignedBanks(); 
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-99999" onClose={onClose}>
                <Transition.Child as={Fragment}>
                    <div className="fixed inset-0 h-full w-full bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment}>
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 border-b pb-3">
                                    Kelola Bank untuk: 
                                    <span className="font-bold text-blue-600"> {supplierData?.name}</span>
                                </Dialog.Title>
                                
                                <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold mb-3">{mode === 'add' ? 'Tambah Bank Baru' : 'Edit Bank'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                        <div>
                                            <label className="block font-medium mb-1 text-sm">Bank<span className="text-red-500">*</span></label>
                                            <Select
                                                options={allBankOptions}
                                                value={form.bank_id ? _.find(allBankOptions, { value: form.bank_id.toString() }) : null}
                                                onValueChange={(opt) => handleFormChange('bank_id', opt ? parseInt(opt.value) : null)}
                                                placeholder="Pilih bank..."
                                            />
                                        </div>
                                       
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                       
                                        <div>
                                            <label className="block font-medium mb-1 text-sm">No. Rekening<span className="text-red-500">*</span></label>
                                            <Input 
                                                type="text"
                                                value={form.account_number}
                                                onChange={(e) => handleFormChange('account_number', e.target.value)}
                                                placeholder="1234567890"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium mb-1 text-sm">Atas Nama<span className="text-red-500">*</span></label>
                                            <Input 
                                                type="text"
                                                value={form.account_name}
                                                onChange={(e) => handleFormChange('account_name', e.target.value)}
                                                placeholder="Nama Pemilik Rekening"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        {mode === 'edit' && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
                                            >
                                                Batal Edit
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {mode === 'add' ? 'Simpan Bank' : 'Update Bank'}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-2">Bank yang Sudah Terhubung</h4>
                                    <div className="max-h-[40vh] overflow-y-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Bank</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Rekening</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atas Nama</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {loading && (
                                                    <tr><td colSpan={4} className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin inline-block" /></td></tr>
                                                )}
                                                {!loading && assignedBanks.length === 0 && (
                                                    <tr><td colSpan={4} className="text-center p-4 text-gray-500 italic">Belum ada bank yang terhubung.</td></tr>
                                                )}
                                                {!loading && assignedBanks.map((bank) => (
                                                    <tr key={bank.id}>
                                                        <td className="px-4 py-2 font-medium">{bank.bank_name || 'N/A'}</td>
                                                        <td className="px-4 py-2">{bank.account_number}</td>
                                                        <td className="px-4 py-2">{bank.account_name}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEdit(bank)}
                                                                    disabled={isSubmitting}
                                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                                                                >
                                                                    <FaEdit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeactive(bank.id)}
                                                                    disabled={isSubmitting}
                                                                    className="p-2 text-red-500 hover:text-red-100 rounded-md"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Tutup
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

export default ManageSupplierBanksModal;