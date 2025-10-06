"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { endpointUrl, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface DetailItem {
    value: string;
}

export default function CreateMasterFieldForm() {
    const router = useRouter();

    const [step, setStep] = useState<number>(0);
    const [stepName, setStepName] = useState("");
    const [label, setLabel] = useState("");
    const [valueType, setValueType] = useState<number>(1);
    const [valueLength, setValueLength] = useState<number>(0);

    const [details, setDetails] = useState<DetailItem[]>([]);
    const [currentOption, setCurrentOption] = useState("");

    const [loading, setLoading] = useState(false);

    const handleAddOption = () => {
        if (currentOption.trim() === "") {
            toast.warn("Nilai opsi tidak boleh kosong");
            return;
        }
        setDetails([...details, { value: currentOption.trim() }]);
        setCurrentOption("");
    };

    const handleRemoveOption = (indexToRemove: number) => {
        setDetails(details.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stepName || !label || !step) {
            toast.error("Harap isi semua kolom yang diperlukan");
            return;
        }
        if (valueType === 3 && details.length === 0) {
            toast.error("Harap tambahkan setidaknya satu opsi untuk 'Jenis Nilai: Opsi'");
            return;
        }

        const payload = {
            step: Number(step),
            step_name: stepName,
            label,
            value_type: Number(valueType),
            value_length: Number(valueLength),
            detail: valueType === 3 ? details : [],
        };

        try {
            setLoading(true);
            await httpPost(
                endpointUrl("/master/field"),
                payload,
                true,
            );
            toast.success("Master field berhasil ditambahkan!");
            router.push("/master-data");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan master field");
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

    return (
        <ComponentCard title="Buat Master Field Baru">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Urutan Step <span className="text-red-400 ml-1">*</span>
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g., 5"
                            defaultValue={step}
                            onChange={(e) => setStep(Number(e.target.value))}
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">Turutan numerik untuk field ini.</p>
                    </div>
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Nama Step <span className="text-red-400 ml-1">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Offer"
                            defaultValue={stepName}
                            onChange={(e) => setStepName(e.target.value)}
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">Nama tahapan proses.</p>
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Label Field <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="e.g., Next Item"
                        defaultValue={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">Teks yang akan muncul sebagai label input pada formulir.</p>
                </div>

                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tipe Value <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Select
                        options={valueTypeOptions}
                        value={valueTypeOptions.find(opt => opt.value === valueType)}
                        onValueChange={(option) => setValueType(option ? option.value : 1)}
                    />
                    <p className="text-sm text-gray-500 mt-1">Jenis input yang akan digunakan untuk field ini.</p>
                </div>

                {valueType === 3 && (
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Kelola Opsi</h3>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Masukkan nilai opsi baru"
                                value={currentOption}
                                onChange={(e) => setCurrentOption(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shrink-0"
                            >
                                Tambah
                            </button>
                        </div>

                        {/* Display the list of added options */}
                        <div className="space-y-2">
                            {details.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <span className="text-gray-700 dark:text-gray-300">{item.value}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="text-red-500 hover:text-red-700 font-semibold"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                            {details.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-2">Belum ada opsi yang ditambahkan.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={() => router.push("/master/field")} // Adjust path
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Simpan Master Field"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}