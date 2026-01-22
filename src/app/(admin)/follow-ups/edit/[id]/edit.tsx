"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select-custom";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { endpointUrlv2, httpGet, httpPost } from "@/../helpers";
import { useRouter, useParams } from "next/navigation";
import moment from "moment";
import { FaArrowLeft, FaCheckCircle, FaSyncAlt, FaUserCircle } from "react-icons/fa";

interface OptionValue {
    id: number;
    value: string;
}

interface FormDetail {
    id: number;
    label: string;
    value_type: number;
    value_length: number;
    is_default: number;
    field_value: OptionValue[];
}

interface FormStep {
    step: string | number;
    step_name: string;
    is_default: string | number;
    details: FormDetail[];
}

interface ExistingFieldValue {
    id: number; 
    form_detail_id: string;
    value: string;
}

interface ExistingDetailItem {
    id: string; 
    form_detail_value: ExistingFieldValue[];
}

interface ExistingGroup {
    details: ExistingDetailItem[];
}

interface ExistingData {
    id: number;
    name: string;
    date: string;
    customer: {
        id: number;
        name: string;
        member_no: string;
        phone: string;
        address: string;
    };
    details_grouped: ExistingGroup[];
}

export default function SalesUpdateFollowUp() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(true);
    const [formSteps, setFormSteps] = useState<FormStep[]>([]);
    const [activeStep, setActiveStep] = useState<number>(0);
    const [values, setValues] = useState<Record<number, any>>({});
    const [meta, setMeta] = useState<Record<number, { transactionDetailId: number, optionId: number }>>({});
    const [customerName, setCustomerName] = useState<string>(""); 
    const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [viewingMonthDate, setViewingMonthDate] = useState<Date>(new Date());
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (id) initData();
    }, [id]);

    const initData = async () => {
        try {
            const [configRes, dataRes] = await Promise.all([
                httpGet(endpointUrlv2("form?code=follow_up"), true),
                httpGet(endpointUrlv2(`sales/follow-up/${id}`), true)
            ]);

            if (configRes.data && Array.isArray(configRes.data.data)) {
                setFormSteps(configRes.data.data);
            }

            if (dataRes.data && dataRes.data.data) {
                const existingData: ExistingData = dataRes.data.data;
                setCustomerName(existingData.customer.name);

                const newValues: Record<number, any> = {};
                const newMeta: Record<number, { transactionDetailId: number, optionId: number }> = {};

                existingData.details_grouped.forEach(group => {
                    group.details.forEach(detail => {
                        const detailId = Number(detail.id);

                        if (detail.form_detail_value && detail.form_detail_value.length > 0) {
                            const fieldVal = detail.form_detail_value[0];
                            const rawVal = fieldVal.value;

                            const transId = fieldVal.id;

                            let displayVal = rawVal;
                            let optId = 0;

                            try {
                                if (rawVal && rawVal.startsWith("[") && rawVal.endsWith("]")) {
                                    const parsed = JSON.parse(rawVal);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        displayVal = parsed[0].value;
                                        optId = parsed[0].form_detail_value_id || 0;
                                    }
                                }
                            } catch (e) {
                            }

                            newValues[detailId] = displayVal;
                            newMeta[detailId] = {
                                transactionDetailId: transId,
                                optionId: optId
                            };
                        }
                    });
                });

                setValues(newValues);
                setMeta(newMeta);
            }

        } catch (error) {
            toast.error("Gagal memuat data form.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateFieldApi = async (
        formDetailId: number,
        transactionDetailId: number,
        value: string,
        optionId: number = 0
    ) => {
        setSavingStatus("saving");
        try {
            const payload = {
                form_transaction_detail_id: transactionDetailId,
                form_detail_id: formDetailId,
                value: [
                    {
                        form_detail_value_id: optionId, 
                        value: value
                    }
                ]
            };

            await httpPost(endpointUrlv2(`sales/follow-up/${id}/update`), payload, true);
            setSavingStatus("saved");
            setTimeout(() => setSavingStatus("idle"), 2000);

        } catch (error) {
            console.error("Update failed", error);
            setSavingStatus("idle");
            toast.error("Gagal menyimpan perubahan.");
        }
    };

    const handleTextChange = (detailId: number, val: string) => {
        setValues(prev => ({ ...prev, [detailId]: val }));

        const transId = meta[detailId]?.transactionDetailId;
        if (!transId) return;

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            updateFieldApi(detailId, transId, val, 0);
        }, 1000);
    };

    const handleDirectChange = (detailId: number, val: string, optId: number = 0) => {
        setValues(prev => ({ ...prev, [detailId]: val }));

        if (optId !== 0) {
            setMeta(prev => ({
                ...prev,
                [detailId]: { ...prev[detailId], optionId: optId }
            }));
        }

        const transId = meta[detailId]?.transactionDetailId;
        if (!transId) return;

        updateFieldApi(detailId, transId, val, optId);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentStepData = formSteps[activeStep];

    return (
        <ComponentCard title="Update Follow Up">
            <div className="space-y-6 relative">
                <div className="absolute top-0 right-0">
                    {savingStatus === "saving" && (
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1 animate-pulse bg-blue-50 px-2 py-1 rounded-full">
                            <FaSyncAlt className="animate-spin" /> Menyimpan...
                        </span>
                    )}
                    {savingStatus === "saved" && (
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full transition-opacity duration-500">
                            <FaCheckCircle /> Tersimpan
                        </span>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 opacity-80">
                    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <FaUserCircle className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pelanggan:</p>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            {customerName || "Customer"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Perubahan akan disimpan otomatis.</p>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                   
                    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto mb-6 ">
                        <nav className="flex space-x-2" aria-label="Tabs">
                            {formSteps.map((step, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveStep(index)}
                                    className={`
                                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all
                                ${activeStep === index
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                                >
                                    Step {step.step}: {step.step_name}
                                </button>
                            ))}

                        </nav>
                    </div>

                    <div className="grid grid-cols-1 gap-6 ">
                        {currentStepData?.details.map((detail) => {
                            const transId = meta[detail.id]?.transactionDetailId;

                            return (
                                <div key={detail.id} className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {detail.label}
                                        {detail.is_default == 1 && <span className="text-red-500 ml-1">*</span>}
                                        {!transId && <span className="text-xs text-red-400 ml-2">(Field baru - Tidak dapat diedit)</span>}
                                    </label>

                                    {(detail.value_type === 1 || detail.value_type === 2) && (
                                        <Input
                                            type={detail.value_type === 2 ? "number" : "text"}
                                            placeholder={`Masukkan ${detail.label}...`}
                                            value={values[detail.id] || ""}
                                            onChange={(e) => handleTextChange(detail.id, e.target.value)}
                                            className="w-full"
                                            disabled={!transId}
                                        />
                                    )}

                                    {detail.value_type === 3 && (
                                        <Select
                                            placeholder="Pilih Opsi"
                                            value={
                                                detail.field_value.find(
                                                    opt => opt.value === values[detail.id]
                                                )
                                                    ? {
                                                        value: detail.field_value.find(opt => opt.value === values[detail.id])?.id,
                                                        label: values[detail.id]
                                                    }
                                                    : null
                                            }
                                            options={detail.field_value.map(opt => ({
                                                value: opt.id,
                                                label: opt.value
                                            }))}
                                            onValueChange={(selected) => {
                                                if (selected) {
                                                    handleDirectChange(detail.id, selected.label, Number(selected.value));
                                                } else {
                                                    handleDirectChange(detail.id, "", 0);
                                                }
                                            }}
                                        />
                                    )}

                                    {detail.value_type === 4 && (
                                        <div className="w-full">
                                            <SingleDatePicker
                                                placeholderText={`Pilih ${detail.label}`}
                                                selectedDate={values[detail.id] ? new Date(values[detail.id]) : null}
                                                onChange={(date: Date | null) => {
                                                    const formatted = date ? moment(date).format("YYYY-MM-DD") : "";
                                                    handleDirectChange(detail.id, formatted, 0);
                                                }}
                                                onClearFilter={() => handleDirectChange(detail.id, "", 0)}
                                                viewingMonthDate={viewingMonthDate}
                                                onMonthChange={setViewingMonthDate}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center mt-10 pt-6 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 font-medium"
                        >
                            <FaArrowLeft /> Kembali
                        </button>

                        <div className="flex gap-2">
                            {activeStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(prev => prev - 1)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Sebelumnya
                                </button>
                            )}

                            {activeStep < formSteps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/30"
                                >
                                    Selanjutnya
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => router.push('/sales/follow-up')}
                                    className="px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-lg shadow-green-500/30"
                                >
                                    Selesai
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ComponentCard>
    );
}