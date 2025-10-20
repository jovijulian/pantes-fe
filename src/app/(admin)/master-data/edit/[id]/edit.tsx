"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { endpointUrl, httpGet, httpPost, httpPut } from "@/../helpers"; // Assuming httpPut exists
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface DetailItem {
    id?: number; // Options from the DB will have an ID
    value: string;
}

export default function UpdateMasterFieldForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [step, setStep] = useState<number>(0);
    const [stepName, setStepName] = useState("");
    const [label, setLabel] = useState("");
    const [valueType, setValueType] = useState<number>(1);
    const [valueLength, setValueLength] = useState<number>(0);
    const [details, setDetails] = useState<DetailItem[]>([]);

    const [newOptionValue, setNewOptionValue] = useState("");
    const [isAddingOption, setIsAddingOption] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
    const [editingOptionValue, setEditingOptionValue] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        if (!id) return;

        const getFieldData = async () => {
            try {
                const response = await httpGet(endpointUrl(`/master/field/${id}`), true);
                const data = response.data.data;

                setStep(Number(data.step));
                setStepName(data.step_name);
                setLabel(data.details[0].label);
                setValueType(Number(data.details[0].value_type));
                setValueLength(Number(data.details[0].value_length));
                if (data.details[0].field_value && Array.isArray(data.details[0].field_value)) {
                    setDetails(data.details[0].field_value);
                }

            } catch (error) {
                toast.error("Gagal mengambil data master field utama.");
                router.push("/master-data");
            } finally {
                setInitialLoading(false);
            }
        };

        getFieldData();
    }, [id, router]);

    const handleAddOption = async () => {
        if (newOptionValue.trim() === "") {
            toast.warn("Nilai opsi tidak boleh kosong.");
            return;
        }

        setIsAddingOption(true);
        const payload = { value: newOptionValue };

        try {
            const response = await httpPost(
                endpointUrl(`/master/field/${id}/add-value`),
                payload,
                true
            );

            const newOption = response.data.data.field_value;

            setDetails(prevDetails => [...prevDetails, newOption]);

            setNewOptionValue("");
            toast.success("Opsi berhasil ditambahkan!");

        } catch (error) {
            toast.error("Gagal menambahkan opsi.");
        } finally {
            setIsAddingOption(false);
        }
    };

    const handleStartEdit = (option: DetailItem) => {
        setEditingOptionId(option.id!);
        setEditingOptionValue(option.value);
    };

    const handleCancelEdit = () => {
        setEditingOptionId(null);
        setEditingOptionValue("");
    };

    const handleSaveEdit = async () => {
        if (!editingOptionId || editingOptionValue.trim() === "") {
            toast.warn("Nilai opsi tidak boleh kosong.");
            return;
        }

        setIsSavingEdit(true);
        const payload = { value: editingOptionValue };
        const optionId = editingOptionId;

        try {
            await httpPost(
                endpointUrl(`/master/field/value/${optionId}/update`),
                payload,
                true
            );

            setDetails(prevDetails =>
                prevDetails.map(item =>
                    item.id === optionId ? { ...item, value: editingOptionValue } : item
                )
            );

            handleCancelEdit();
            toast.success("Opsi berhasil diperbarui!");

        } catch (error) {
            toast.error("Gagal memperbarui opsi.");
        } finally {
            setIsSavingEdit(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stepName || !label || !step) {
            toast.error("Harap isi semua kolom yang diperlukan");
            return;
        }

        const payload = {
            step: String(step),
            step_name: stepName,
            label,
            value_type: String(valueType),
            value_length: String(valueLength),
        };

        try {
            setLoading(true);
            await httpPost(
                endpointUrl(`/master/field/${id}/update`),
                payload,
                true
            );
            toast.success("Master field berhasil diubah!");
            router.push("/master-data");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengubah master field");
        } finally {
            setLoading(false);
        }
    };

    const valueTypeOptions = [
        { value: 1, label: "Text Input (String)" },
        { value: 2, label: "Number Input (Number)" },
        { value: 3, label: "Options (Select)" },
        { value: 4, label: "Date" },
    ];

    if (initialLoading) {
        return <div className="text-center p-10">Loading form...</div>;
    }

    return (
        <ComponentCard title={`Update Master Field: ${label}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Urutan Step <span className="text-red-400">*</span></label>
                        <Input
                            type="number"
                            value={step}
                            onChange={(e) => setStep(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Nama Step <span className="text-red-400">*</span></label>
                        <Input
                            type="text"
                            value={stepName}
                            onChange={(e) => setStepName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1">Label Field <span className="text-red-400">*</span></label>
                    <Input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Tipe Value <span className="text-red-400">*</span></label>
                    <Select
                        options={valueTypeOptions}
                        value={valueTypeOptions.find(opt => opt.value === valueType)}
                        onValueChange={(option) => setValueType(option ? option.value : 1)}
                    />
                </div>

                {valueType === 3 && (
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold">Kelola Opsi</h3>

                        <div className="flex items-center gap-2 w-full">
                            <Input
                                type="text"
                                placeholder="Opsi baru"
                                value={newOptionValue}
                                onChange={(e) => setNewOptionValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddOption();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddOption}
                                disabled={isAddingOption}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shrink-0 disabled:opacity-50"
                            >
                                {isAddingOption ? "Menambahkan..." : "Tambah"}
                            </button>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <p className="text-sm font-medium text-gray-600">Opsi yang Tersedia:</p>
                            {details.length > 0 ? (
                                details.map((item) => (
                                    <div key={item.id} className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between items-center gap-2">
                                        {editingOptionId === item.id ? (
                                            <>
                                                <div className="flex items-center gap-2 w-full">
                                                    <Input
                                                        type="text"
                                                        value={editingOptionValue}
                                                        onChange={(e) => setEditingOptionValue(e.target.value)}
                                                        className="flex-grow"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit();
                                                            if (e.key === 'Escape') handleCancelEdit();
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveEdit}
                                                        disabled={isSavingEdit}
                                                        className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 shrink-0" 
                                                        title="Simpan Perubahan"
                                                    >
                                                        {isSavingEdit ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div> : <FaSave />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEdit}
                                                        className="p-1 text-red-600 hover:text-red-800 shrink-0"
                                                        title="Batal"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-grow">{item.value}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-1 text-blue-600 hover:text-blue-800"
                                                    title="Edit Opsi"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-2">Belum ada opsi.</p>
                            )}
                        </div>
                    </div>
                )}


                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={() => router.push("/master-data")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Perbarui Master Field"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}