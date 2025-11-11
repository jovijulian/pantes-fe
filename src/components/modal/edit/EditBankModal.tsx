"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import { alertToast, endpointUrl, endpointUrlv2, httpGet, httpPatch, httpPost, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { useModal } from "@/hooks/useModal";

interface BankData {
    id: number;
    bank_name: string;
    alias: string;
}
interface EditProps {
    isOpen: boolean;
    selectedId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditBankModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<BankData>({
        id: 0,
        bank_name: "",
        alias: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedId) return;

            setIsLoading(true);
            setError("");
            try {
                const response = await httpGet(endpointUrl(`master/bank/${selectedId}`), true);
                const data = response.data.data;

                setFormData({
                    id: data.id,
                    bank_name: data.bank_name,
                    alias: data.alias,
                });

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Failed to fetch bank data.");
                setError("Could not load bank data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        } else {
            handleCancel();
        }
    }, [isOpen, selectedId]);
    const handleSubmit = async () => {
        setError("");

        const payload = {
            bank_name: formData.bank_name,
            alias: formData.alias,
        };


        try {
            await httpPost(endpointUrl(`master/bank/${selectedId}/update`), payload, true);
            toast.success("Berhasil mengubah bank!");
            setFormData({
                id: 0,
                bank_name: "",
                alias: "",
            });
            onClose();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message);
            setError(error?.response?.data?.message || "Gagal mengubah bank");
        }


    };
    const handleCancel = () => {
        onClose();
        setError("");
        setFormData({
            id: 0,
            bank_name: "",
            alias: "",
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                        Edit Bank
                    </h4>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="space-y-5 px-2 pb-3">
                        <div>
                            <Label htmlFor="name">Nama Bank</Label>
                            <Input
                                type="text"
                                id="bank_name"
                                name="bank_name"
                                defaultValue={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                    <div className="space-y-5 px-2 pb-3">
                        <div>
                            <Label htmlFor="name">Singkatan</Label>
                            <Input
                                type="text"
                                id="alias"
                                name="alias"
                                defaultValue={formData.alias}
                                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-3 px-2 mt-6 lg:justify-end">
                        <button
                            type="button"
                            title="Cancel"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            title="Save"
                            className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default EditBankModal;
