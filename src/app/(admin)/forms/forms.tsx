"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select-custom";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpointUrlv2, httpGet, httpPost, httpDelete, endpointUrl } from "@/../helpers";
import { Modal } from "@/components/ui/modal";
import {
    FaTrash,
    FaTimes,
    FaEdit,
    FaLock,
    FaArrowUp,
    FaArrowDown,
    FaSpinner
} from "react-icons/fa";

interface FormValue {
    id: number;
    form_id: string;
    form_detail_id: string;
    value: string;
}

interface FormDetail {
    id: number;
    form_id: string;
    step: number;
    step_name: string;
    label: string;
    value_type: number;
    value_length: number;
    is_default: number;
    status: number;
    sort: number;
    form_value: FormValue[];
}

interface FormData {
    id: number;
    name: string;
    description: string | null;
    details: FormDetail[];
}

export default function EditMasterForm() {
    const formId = 1;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FormData | null>(null);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [modalType, setModalType] = useState<"EDIT_INFO" | "ADD_FIELD" | "EDIT_FIELD" | "ADD_OPTION" | "EDIT_OPTION" | "DELETE_CONFIRM" | "RENAME_STEP" | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<FormDetail | null>(null);
    const [selectedOption, setSelectedOption] = useState<FormValue | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: "STEP" | "FIELD" | "OPTION", id: number | string, name?: string } | null>(null);
    const [sortingId, setSortingId] = useState<number | null>(null);
    const [inputName, setInputName] = useState("");
    const [inputDesc, setInputDesc] = useState("");
    const [inputLabel, setInputLabel] = useState("");
    const [inputType, setInputType] = useState(1);
    const [inputStepName, setInputStepName] = useState("");
    const [inputStep, setInputStep] = useState(1);
    const [inputLength, setInputLength] = useState<string>("0");
    const [inputOptionValue, setInputOptionValue] = useState("");

    const valueTypeOptions = [
        { value: 1, label: "Teks Biasa" },
        { value: 2, label: "Nomor" },
        { value: 3, label: "Pilihan" },
        { value: 4, label: "Tanggal" },
    ];

    const fetchData = async () => {
        try {
            if (!data) setLoading(true);

            const response = await httpGet(endpointUrl(`/master/form/${formId}`), true);
            setData(response.data.data);

            const details = response.data.data.details;
            if (details.length > 0) {
                const availableSteps = details.map((d: any) => d.step);
                const minStep = Math.min(...availableSteps);
                if (!availableSteps.includes(activeStep)) {
                    setActiveStep(minStep);
                }
            }
        } catch (error: any) {
            console.log(error);
            toast.error("Gagal mengambil data form");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formId) fetchData();
    }, [formId]);

    useEffect(() => {
        if (inputType === 3 || inputType === 4) {
            setInputLength("0");
        }
    }, [inputType]);

    const groupedSteps = data?.details.reduce((acc, detail) => {
        if (!acc[detail.step]) {
            acc[detail.step] = {
                step: detail.step,
                name: detail.step_name,
                details: [],
            };
        }
        acc[detail.step].details.push(detail);
        return acc;
    }, {} as Record<number, { step: number; name: string; details: FormDetail[] }>) ?? {};

    Object.keys(groupedSteps).forEach(key => {
        const stepKey = Number(key);
        groupedSteps[stepKey].details.sort((a, b) => a.sort - b.sort);
    });

    const sortedSteps = groupedSteps ? Object.values(groupedSteps).sort((a, b) => a.step - b.step) : [];

    const openEditInfo = () => {
        if (!data) return;
        setInputName(data.name);
        setInputDesc(data.description || "");
        setModalType("EDIT_INFO");
    };

    const openAddField = (step: number, stepName: string) => {
        setInputLabel("");
        setInputType(1);
        setInputLength("0");
        setInputStep(step);
        setInputStepName(stepName);
        setModalType("ADD_FIELD");
    };

    const openEditField = (detail: FormDetail) => {
        setSelectedDetail(detail);
        setInputLabel(detail.label);
        setInputType(detail.value_type);
        setInputLength(String(detail.value_length));
        setInputStep(detail.step);
        setInputStepName(detail.step_name);
        setModalType("EDIT_FIELD");
    };

    const openAddOption = (detail: FormDetail) => {
        setSelectedDetail(detail);
        setInputOptionValue("");
        setModalType("ADD_OPTION");
    };

    const openEditOption = (option: FormValue) => {
        setSelectedOption(option);
        setInputOptionValue(option.value);
        setModalType("EDIT_OPTION");
    };

    const openRenameStep = (step: number, currentName: string) => {
        setInputStep(step);
        setInputStepName(currentName);
        setModalType("RENAME_STEP");
    };

    const confirmDelete = (type: "STEP" | "FIELD" | "OPTION", id: number | string, name?: string) => {
        setItemToDelete({ type, id, name });
        setModalType("DELETE_CONFIRM");
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedDetail(null);
        setSelectedOption(null);
        setItemToDelete(null);
    };

    const handleSort = async (currentDetail: FormDetail, direction: 'up' | 'down', currentStepList: FormDetail[]) => {
        if (sortingId !== null) return;

        const currentIndex = currentStepList.findIndex(d => d.id === currentDetail.id);
        if (currentIndex === -1) return;
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= currentStepList.length) return;

        const targetDetail = currentStepList[targetIndex];
        setSortingId(currentDetail.id);
        console.log('a',targetDetail)
        try {
           
            const payload = {
                sort: targetDetail.sort
            }
            await httpPost(endpointUrl(`/master/form/detail/${currentDetail.id}/sort`), payload, true);
            await fetchData();
            toast.success("Urutan berhasil diubah");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal mengubah urutan");
        } finally {
            setSortingId(null);
        }
    };

    const validateFieldInput = () => {
        if (!inputLabel || !inputStepName) {
            toast.warn("Label dan Nama Step harus diisi");
            return false;
        }
        if ((inputType === 1 || inputType === 2) && Number(inputLength) <= 0) {
            toast.warn("Untuk tipe String dan Number, Maksimal Panjang Teks wajib diisi (lebih dari 0).");
            return false;
        }
        return true;
    };

    const handleUpdateInfo = async () => {
        try {
            await httpPost(endpointUrl(`/master/form/${formId}/update`), { name: inputName, description: inputDesc }, true);
            toast.success("Info form berhasil diupdate");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal update info"); }
    };

    const handleAddField = async () => {
        if (!validateFieldInput()) return;
        try {
            const payload = { step: inputStep, step_name: inputStepName, label: inputLabel, value_type: inputType, value_length: Number(inputLength) };
            await httpPost(endpointUrl(`/master/form/${formId}/add`), payload, true);
            toast.success("Field berhasil ditambahkan");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal tambah field"); }
    };

    const handleUpdateField = async () => {
        if (!selectedDetail) return;
        if (!validateFieldInput()) return;
        try {
            const payload = { step: inputStep, step_name: inputStepName, label: inputLabel, value_type: inputType, value_length: Number(inputLength) };
            await httpPost(endpointUrl(`/master/form/detail/${selectedDetail.id}/update`), payload, true);
            toast.success("Field berhasil diupdate");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal update field"); }
    };

    const handleRenameStep = async () => {
        if (!inputStepName) {
            toast.warn("Nama Step tidak boleh kosong");
            return;
        }
        try {
            await httpPost(endpointUrl(`/master/form/rename-step/${inputStep}`), { step_name: inputStepName }, true);
            toast.success("Nama Step berhasil diubah");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal mengubah nama step"); }
    };

    const handleAddOptionValue = async () => {
        if (!selectedDetail) return;
        try {
            await httpPost(endpointUrl(`/master/form/detail/${selectedDetail.id}/value/add`), { value: inputOptionValue }, true);
            toast.success("Opsi berhasil ditambahkan");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal tambah opsi"); }
    };

    const handleUpdateOptionValue = async () => {
        if (!selectedOption) return;
        try {
            await httpPost(endpointUrl(`/master/form/detail/value/${selectedOption.id}/update`), { value: inputOptionValue }, true);
            toast.success("Opsi berhasil diupdate");
            fetchData();
            closeModal();
        } catch (e) { toast.error("Gagal update opsi"); }
    };

    const handleExecuteDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === "STEP") {
                await httpDelete(endpointUrl(`/master/form/deactive-step/${itemToDelete.id}`), true);
                toast.success(`Step ${itemToDelete.id} berhasil dinonaktifkan`);
            }
            else if (itemToDelete.type === "FIELD") {
                await httpDelete(endpointUrl(`/master/form/detail/${itemToDelete.id}`), true);
                toast.success("Pertanyaan berhasil dihapus");
            }
            else if (itemToDelete.type === "OPTION") {
                await httpDelete(endpointUrl(`/master/form/detail/value/${itemToDelete.id}`), true);
                toast.success("Opsi berhasil dihapus");
            }
            fetchData();
            closeModal();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Gagal menghapus item");
        }
    };

    if (loading && !data) return <div>Loading Form Follow Up...</div>;
    if (!data) return <div>Data not found</div>;

    const isLengthDisabled = inputType === 3 || inputType === 4;
    const currentStepDetails = groupedSteps[activeStep]?.details || [];
    const hasDefaultField = currentStepDetails.some(d => d.is_default === 1);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        {data.name}
                    </h1>
                    <p className="text-gray-500 mt-1">{data.description || "Tidak ada deskripsi"}</p>
                </div>
                <button
                    onClick={openEditInfo}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                >
                    Edit Info
                </button>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="flex space-x-2" aria-label="Tabs">
                    {sortedSteps.map((group) => (
                        <button
                            key={group.step}
                            onClick={() => setActiveStep(group.step)}
                            className={`
                                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all
                                ${activeStep === group.step
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            Step {group.step}: {group.name}
                        </button>
                    ))}
                    <button
                        onClick={() => openAddField(sortedSteps.length + 1, "New Step")}
                        className="whitespace-nowrap py-4 px-4 text-sm font-medium text-gray-400 hover:text-blue-500 flex items-center"
                    >
                        + Tambah Step
                    </button>
                </nav>
            </div>

            <div className="space-y-4">
                <div className="flex justify-end items-center gap-3 pb-4 border-b dark:border-gray-700 mt-6">
                    <button
                        onClick={() => openRenameStep(activeStep, groupedSteps[activeStep]?.name || "")}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <FaEdit className="w-4 h-4" />
                        Ubah Nama Step
                    </button>

                    {hasDefaultField ? (
                        <button
                            disabled
                            className="flex items-center gap-2 text-gray-400 bg-gray-100 cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            <FaLock className="w-3 h-3" />
                            Hapus Step {activeStep}
                        </button>
                    ) : (
                        <button
                            onClick={() => confirmDelete("STEP", activeStep, groupedSteps[activeStep]?.name)}
                            className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <FaTrash className="w-4 h-4" />
                            Hapus Step {activeStep}
                        </button>
                    )}
                </div>

                {currentStepDetails.map((detail, index) => {
                    const isFirst = index === 0;
                    const isLast = index === currentStepDetails.length - 1;
                    const isProcessingThis = sortingId === detail.id;
                    const isProcessingAny = sortingId !== null;

                    return (
                        <div key={detail.id} className="flex items-start gap-2">
                            <div className="flex flex-col items-center justify-center gap-1 pt-4">
                                <button
                                    onClick={() => handleSort(detail, 'up', currentStepDetails)}
                                    disabled={isFirst || isProcessingAny}
                                    className={`p-1 rounded transition-colors ${isFirst || isProcessingAny
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:bg-gray-200 hover:text-blue-600"
                                        }`}
                                    title="Pindah ke Atas"
                                >
                                    <FaArrowUp className="w-3 h-3" />
                                </button>

                                {isProcessingThis ? (
                                    <FaSpinner className="w-4 h-4 text-blue-600 animate-spin my-1" />
                                ) : (
                                    <span className="text-[10px] text-gray-400 font-mono my-1">{detail.sort}</span>
                                )}

                                <button
                                    onClick={() => handleSort(detail, 'down', currentStepDetails)}
                                    disabled={isLast || isProcessingAny}
                                    className={`p-1 rounded transition-colors ${isLast || isProcessingAny
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:bg-gray-200 hover:text-blue-600"
                                        }`}
                                    title="Pindah ke Bawah"
                                >
                                    <FaArrowDown className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium border px-2 py-0.5 rounded text-blue-600 border-blue-100 bg-blue-50">
                                                {valueTypeOptions.find(v => v.value === detail.value_type)?.label}
                                            </span>
                                            {(detail.value_type === 1 || detail.value_type === 2) && (
                                                <span className="text-xs text-gray-500 border px-2 py-0.5 rounded bg-gray-50">
                                                    Max: {detail.value_length} karakter
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{detail.label}</h3>
                                        {detail.value_type === 3 && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Opsi Jawaban:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {detail.form_value.map((opt) => (
                                                        <div key={opt.id} className="group relative flex items-center">
                                                            <button
                                                                onClick={() => openEditOption(opt)}
                                                                className="px-3 py-1 bg-white border border-gray-300 rounded-l-full text-sm text-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                                            >
                                                                {opt.value}
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete("OPTION", opt.id, opt.value)}
                                                                className="px-3 py-2 bg-gray-100 border-y border-r border-gray-300 rounded-r-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <FaTimes size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => openAddOption(detail)}
                                                        className="px-3 py-1 bg-green-50 border border-green-200 text-green-600 rounded-full text-sm font-bold hover:bg-green-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditField(detail)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <FaEdit className="h-5 w-5" />
                                        </button>
                                        {detail.is_default !== 1 ? (
                                            <button
                                                onClick={() => confirmDelete("FIELD", detail.id, detail.label)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <FaTrash className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={() => openAddField(activeStep, groupedSteps[activeStep]?.name || "")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all font-medium flex justify-center items-center gap-2"
                >
                    <span className="text-xl font-bold">+</span> Tambah Pertanyaan di Step Ini
                </button>
            </div>

            <Modal isOpen={modalType === "EDIT_INFO"} onClose={closeModal} className="max-w-[500px] m-4">
                <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <div className="pr-10 mb-2">
                        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Informasi Form
                        </h4>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Nama Form
                            </label>
                            <Input value={inputName} onChange={(e) => setInputName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Deskripsi
                            </label>
                            <Input value={inputDesc} onChange={(e) => setInputDesc(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">Batal</button>
                        <button onClick={handleUpdateInfo} className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalType === "ADD_FIELD" || modalType === "EDIT_FIELD"} onClose={closeModal} className="max-w-[500px] m-4">
                <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <div className="pr-10 mb-2">
                        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            {modalType === "ADD_FIELD" ? "Tambah Pertanyaan Baru" : "Edit Pertanyaan"}
                        </h4>
                    </div>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    Urutan Step
                                </label>
                                <Input
                                    type="number"
                                    value={inputStep}
                                    onChange={(e) => setInputStep(Number(e.target.value))}
                                    disabled={selectedDetail?.is_default === 1}
                                    className={modalType === "EDIT_FIELD" && selectedDetail?.is_default === 1 ? "bg-gray-100 cursor-not-allowed" : ""}
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    Nama Step
                                </label>
                                <Input
                                    value={inputStepName}
                                    onChange={(e) => setInputStepName(e.target.value)}
                                    disabled={modalType === "EDIT_FIELD"}
                                    className={modalType === "EDIT_FIELD" ? "bg-gray-100 cursor-not-allowed" : ""}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Label Pertanyaan</label>
                            <Input value={inputLabel} onChange={(e) => setInputLabel(e.target.value)} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Tipe Input</label>
                            <Select
                                options={valueTypeOptions}
                                value={valueTypeOptions.find(o => o.value === inputType)}
                                onValueChange={(o) => setInputType(o ? o.value : 1)}
                            />
                        </div>
                        <div className={isLengthDisabled ? "opacity-50" : ""}>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                {isLengthDisabled ? "Maksimal Panjang Teks (Tidak digunakan)" : "Maksimal Panjang Teks (Wajib diisi)"}
                            </label>
                            <Input
                                type="number"
                                value={inputLength}
                                onChange={(e) => setInputLength(e.target.value)}
                                disabled={isLengthDisabled}
                                placeholder={isLengthDisabled ? "0" : "Isi batas karakter..."}
                                className={isLengthDisabled ? "bg-gray-100 cursor-not-allowed" : ""}
                            />
                            {!isLengthDisabled && (
                                <p className="text-xs text-red-500 mt-1">* Harus lebih dari 0</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">Batal</button>
                        <button onClick={modalType === "ADD_FIELD" ? handleAddField : handleUpdateField} className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalType === "ADD_OPTION" || modalType === "EDIT_OPTION"} onClose={closeModal} className="max-w-[500px] m-4">
                <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <div className="pr-10 mb-2">
                        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            {modalType === "ADD_OPTION" ? "Tambah Opsi Pilihan" : "Edit Opsi Pilihan"}
                        </h4>
                    </div>
                    <div className="space-y-5">
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                            Sedang mengatur opsi untuk pertanyaan: <br /><strong>{selectedDetail?.label}</strong>
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Teks Opsi</label>
                            <Input value={inputOptionValue} onChange={(e) => setInputOptionValue(e.target.value)} placeholder="Contoh: Sangat Puas" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">Batal</button>
                        <button onClick={modalType === "ADD_OPTION" ? handleAddOptionValue : handleUpdateOptionValue} className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalType === "RENAME_STEP"} onClose={closeModal} className="max-w-[400px] m-4">
                <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                    <div className="pr-10 mb-4">
                        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            Ubah Nama Step {inputStep}
                        </h4>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Nama Step Baru</label>
                            <Input value={inputStepName} onChange={(e) => setInputStepName(e.target.value)} placeholder="Contoh: Informasi Pelanggan" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">Batal</button>
                        <button onClick={handleRenameStep} className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalType === "DELETE_CONFIRM"} onClose={closeModal} className="max-w-[400px] m-4">
                <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8 text-center">
                    <div className="mb-4 flex justify-center text-red-100">
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <FaTrash size={32} />
                        </div>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
                        Konfirmasi Hapus
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Apakah anda yakin ingin menghapus
                        <span className="font-bold text-gray-800 dark:text-gray-300"> "{itemToDelete?.name || 'Item ini'}"</span>?
                        <br />Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 w-full"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleExecuteDelete}
                            className="px-4 py-2 rounded-md border border-transparent bg-red-600 text-sm font-medium text-white hover:bg-red-700 w-full"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}