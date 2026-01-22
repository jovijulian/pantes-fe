"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { endpointUrl, endpointUrlv2, httpPost } from "@/../helpers";
import { toast } from "react-toastify";
interface OptionItem {
    value: string;
}

interface FormFieldItem {
    step: number;
    step_name: string;
    label: string;
    value_type: number;
    value_length: number;
    value?: OptionItem[];
}

export default function CreateMasterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [addedFields, setAddedFields] = useState<FormFieldItem[]>([]);
    const [tempStep, setTempStep] = useState<string>("1");
    const [tempStepName, setTempStepName] = useState("");
    const [tempLabel, setTempLabel] = useState("");
    const [tempValueType, setTempValueType] = useState<number>(1);
    const [tempValueLength, setTempValueLength] = useState<string>("0");
    const [tempOptions, setTempOptions] = useState<OptionItem[]>([]);
    const [currentOptionInput, setCurrentOptionInput] = useState("");

    const valueTypeOptions = [
        { value: 1, label: "Text Input (String)" },
        { value: 2, label: "Number Input (Number)" },
        { value: 3, label: "Options (Select)" },
        { value: 4, label: "Date" },
    ];

    const handleAddOption = () => {
        if (currentOptionInput.trim() === "") {
            toast.warn("Nilai opsi tidak boleh kosong");
            return;
        }
        setTempOptions([...tempOptions, { value: currentOptionInput.trim() }]);
        setCurrentOptionInput("");
    };

    const handleRemoveOption = (indexToRemove: number) => {
        setTempOptions(tempOptions.filter((_, index) => index !== indexToRemove));
    };

    const handleAddFieldToList = () => {
        if (!tempStepName || !tempLabel || !tempStep || tempStep === "" || tempStep === "0") {
            toast.warn("Harap lengkapi data field dengan benar (Step, Nama Step, Label)");
            return;
        }
        if (tempValueType === 3 && tempOptions.length === 0) {
            toast.warn("Harap tambahkan minimal satu opsi untuk tipe 'Options'");
            return;
        }

        const newField: FormFieldItem = {
            step: Number(tempStep),
            step_name: tempStepName,
            label: tempLabel,
            value_type: Number(tempValueType),
            value_length: tempValueLength ? Number(tempValueLength) : 0,
            value: tempValueType === 3 ? tempOptions : undefined
        };

        setAddedFields([...addedFields, newField]);

        setTempLabel("");
        setTempValueType(1);
        setTempValueLength("0");
        setTempOptions([]);
    };

    const handleRemoveFieldFromList = (indexToRemove: number) => {
        setAddedFields(addedFields.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formName) {
            toast.error("Nama Form harus diisi");
            return;
        }
        if (addedFields.length === 0) {
            toast.error("Harap tambahkan setidaknya satu field/pertanyaan ke dalam form");
            return;
        }

        const payload = {
            name: formName,
            description: formDescription,
            detail: addedFields
        };

        try {
            setLoading(true);
            await httpPost(
                endpointUrl("/master/form"),
                payload,
                true,
            );
            toast.success("Master Form berhasil dibuat!");
            router.push("/master-form");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membuat master form");
        } finally {
            setLoading(false);
        }
    };

    const groupedSteps = addedFields.reduce((acc, field, index) => {
        const stepNum = field.step;
        if (!acc[stepNum]) {
            acc[stepNum] = {
                step: stepNum,
                step_name: field.step_name,
                fields: []
            };
        }
        acc[stepNum].fields.push({ ...field, originalIndex: index });
        return acc;
    }, {} as Record<number, { step: number; step_name: string; fields: (FormFieldItem & { originalIndex: number })[] }>);

    const sortedSteps = Object.values(groupedSteps).sort((a, b) => a.step - b.step);

    return (
        <ComponentCard title="Buat Master Form Otomatis">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Informasi Form</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Nama Form <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="Contoh: Follow Up Customer"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Deskripsi
                            </label>
                            <Input
                                type="text"
                                placeholder="Deskripsi singkat form..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            Tambah Pertanyaan / Field
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            Field Builder Area
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Urutan Step <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 1"
                                value={tempStep}
                                onChange={(e) => setTempStep(e.target.value)} // Langsung string
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Nama Step / Group <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g., Basic Info"
                                value={tempStepName}
                                onChange={(e) => setTempStepName(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Label Pertanyaan <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g., Bagaimana kabar anda?"
                                value={tempLabel}
                                onChange={(e) => setTempLabel(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Tipe Input <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Select
                                options={valueTypeOptions}
                                value={valueTypeOptions.find(opt => opt.value === tempValueType)}
                                onValueChange={(option) => setTempValueType(option ? option.value : 1)}
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Max Length (Opsional)
                            </label>
                            <Input
                                type="number"
                                placeholder="0 = Unlimited"
                                value={tempValueLength}
                                onChange={(e) => setTempValueLength(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-1">Isi 0 jika tidak dibatasi.</p>
                        </div>
                    </div>

                    {tempValueType === 3 && (
                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Konfigurasi Pilihan Opsi
                            </h4>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="Isi teks pilihan..."
                                    value={currentOptionInput}
                                    onChange={(e) => setCurrentOptionInput(e.target.value)}
                                    className="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                >
                                    + Tambah Opsi
                                </button>
                            </div>

                            {tempOptions.length > 0 && (
                                <ul className="flex flex-wrap gap-2 mt-2">
                                    {tempOptions.map((opt, idx) => (
                                        <li key={idx} className="flex items-center bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-sm">
                                            {opt.value}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(idx)}
                                                className="ml-2 text-red-500 hover:text-red-700 font-bold"
                                            >
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleAddFieldToList}
                            className="px-6 py-2.5 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                        >
                            <span>&#43;</span> Tambahkan ke List Form
                        </button>
                    </div>
                </div>

                {sortedSteps.length > 0 && (
                    <div className="space-y-6 border-t pt-6 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Preview Form
                            </h3>
                            <span className="text-xs text-gray-500">
                                Total Step: {sortedSteps.length} | Total Item: {addedFields.length}
                            </span>
                        </div>

                        {sortedSteps.map((group) => (
                            <div
                                key={group.step}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                            >
                                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                            {group.step}
                                        </div>
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                                            {group.step_name}
                                        </h4>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    {group.fields.map((field, idx) => (
                                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        {field.label}
                                                    </label>

                                                    {field.value_type === 1 && (
                                                        <div className="h-9 w-full border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-400">
                                                            Input Teks (Max: {field.value_length || 'Unlimited'})
                                                        </div>
                                                    )}

                                                    {field.value_type === 2 && (
                                                        <div className="h-9 w-full border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-400">
                                                            Input Angka
                                                        </div>
                                                    )}

                                                    {field.value_type === 3 && (
                                                        <div className="relative">
                                                            <select disabled className="h-9 w-full border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-500 appearance-none">
                                                                <option>Pilih Opsi...</option>
                                                                {field.value?.map((opt, i) => (
                                                                    <option key={i}>{opt.value}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-3 top-3 pointer-events-none">
                                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {field.value_type === 4 && (
                                                        <div className="h-9 w-full border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-400 flex items-center justify-between">
                                                            <span>dd/mm/yyyy</span>
                                                            <span>📅</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFieldFromList(field.originalIndex)}
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-red-500 p-4 hover:bg-red-50 rounded transition-all"
                                                    title="Hapus Pertanyaan Ini"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                    <button
                        onClick={() => router.push("/master-form")}
                        type="button"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading || addedFields.length === 0}
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                        {loading ? "Menyimpan..." : "Simpan Master Form"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}