"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select-custom";
import SingleDatePicker from '@/components/common/SingleDatePicker';
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { endpointUrl, endpointUrlv2, httpGet, httpPost } from "@/../helpers";
import { useRouter } from "next/navigation";
import moment from "moment";

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

interface CustomerData {
    id: number;
    member_no: string;
    name: string;
    phone: string;
    address: string;
    date_of_birth: string;
    date_anniv: string;
    detail_information: string;
}

const generateKey = (label: string) => label.toLowerCase().replace(/\s+/g, '');

export default function SalesCreateFollowUp() {
    const router = useRouter();
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formSteps, setFormSteps] = useState<FormStep[]>([]);
    const [activeStep, setActiveStep] = useState<number>(0);
    const [dynamicValues, setDynamicValues] = useState<Record<number, any>>({});
    const [optionValueIds, setOptionValueIds] = useState<Record<number, number>>({});
    const [searchMemberNo, setSearchMemberNo] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [viewingMonthDate, setViewingMonthDate] = useState<Date>(new Date());

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await httpGet(endpointUrl("form?code=follow_up"), true);
                if (response.data && Array.isArray(response.data.data)) {
                    const steps = response.data.data;
                    setFormSteps(steps);
                    const defaultStepIndex = steps.findIndex((s: FormStep) => s.is_default == 1);
                    if (defaultStepIndex >= 0) setActiveStep(defaultStepIndex);
                }
            } catch (error) {
                toast.error("Gagal memuat konfigurasi form.");
            } finally {
                setLoadingConfig(false);
            }
        };

        fetchConfig();
    }, []);

    const handleMemberSearch = (value: string) => {
        setSearchMemberNo(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        const clearCustomerData = () => {
            setCustomerData(null);
            const keysToClear = [
                generateKey('Customer Name'),
                generateKey('Customer Phone Number'),
                generateKey('Date of Birth'),
                generateKey('Address'),
                generateKey('Anniversary Date'),
                generateKey('Customer Details')
            ];

            setDynamicValues(prev => {
                const next = { ...prev };
                formSteps.forEach(step => {
                    step.details.forEach(detail => {
                        if (keysToClear.includes(generateKey(detail.label))) {
                            next[detail.id] = "";
                        }
                    });
                });
                return next;
            });
        };

        if (!value.trim()) {
            clearCustomerData();
            setIsSearching(false);
            return;
        }

        debounceTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await httpPost(endpointUrl('customer/number-member'), { number_member: value }, true);

                if (response.data && response.data.data) {
                    const data = response.data.data;
                    setCustomerData(data);

                    const autofillMap: Record<string, string> = {
                        [generateKey('Customer Member Number')]: data.member_no,
                        [generateKey('Customer Name')]: data.name,
                        [generateKey('Customer Phone Number')]: data.phone,
                        [generateKey('Date of Birth')]: data.date_of_birth ? moment(data.date_of_birth).format('YYYY-MM-DD') : '',
                        [generateKey('Address')]: data.address,
                        [generateKey('Anniversary Date')]: data.date_anniv ? moment(data.date_anniv).format('YYYY-MM-DD') : '',
                        [generateKey('Customer Details')]: data.detail_information || '-',
                    };

                    setDynamicValues(prev => {
                        const next = { ...prev };
                        formSteps.forEach(step => {
                            step.details.forEach(detail => {
                                const key = generateKey(detail.label);
                                if (autofillMap[key] !== undefined) {
                                    next[detail.id] = autofillMap[key];
                                }
                            });
                        });
                        return next;
                    });
                } else {
                    clearCustomerData();
                }
            } catch (error: any) {
                clearCustomerData();
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 1500);
    };

    const handleDynamicChange = (detail: FormDetail, value: any, optionId: number = 0) => {
        setDynamicValues(prev => ({
            ...prev,
            [detail.id]: value
        }));

        if (detail.value_type === 3) {
            setOptionValueIds(prev => ({
                ...prev,
                [detail.id]: optionId
            }));
        }
    };

    const handleSubmit = async () => {
        if (!customerData) {
            toast.error("Harap pastikan Nomor Member valid dan terisi.");
            return;
        }

        setSubmitting(true);

        try {
            const detailPayload: any[] = [];
            let rootDate = moment().format("YYYY-MM-DD");
            let rootName = "";
            let rootDescription = "-";

            formSteps.forEach(step => {
                step.details.forEach(detail => {
                    const rawValue = dynamicValues[detail.id];
                    const finalValue = rawValue !== undefined ? rawValue : "";

                    let detailValueId = 0;
                    if (detail.value_type === 3) {
                        detailValueId = optionValueIds[detail.id] || 0;
                    }

                    detailPayload.push({
                        step: Number(step.step),
                        step_name: step.step_name,
                        form_detail_id: detail.id,
                        label: detail.label,
                        value: [
                            {
                                form_detail_value_id: detailValueId,
                                value: String(finalValue)
                            }
                        ]
                    });

                    const labelKey = generateKey(detail.label);

                    if (labelKey.includes('tanggal') || labelKey.includes('transactiondate') || labelKey.includes('date')) {
                        if (!labelKey.includes('birth') && !labelKey.includes('anniv')) {
                            rootDate = finalValue;
                        }
                    }
                    if (labelKey === 'judul' || labelKey === 'title' || labelKey === 'name') {
                        rootName = finalValue;
                    }
                    if (labelKey === 'catatan' || labelKey === 'description' || labelKey === 'notes') {
                        rootDescription = finalValue;
                    }
                });
            });

            if (!rootName) {
                toast.error("Mohon lengkapi Judul pada form.");
                setSubmitting(false);
                return;
            }
            if (!rootDate) {
                toast.error("Mohon lengkapi Tanggal pada form.");
                setSubmitting(false);
                return;
            }


            const fullPayload = {
                customer_id: customerData.id,
                date: rootDate,
                name: rootName,
                description: rootDescription,
                detail: detailPayload
            };

            await httpPost(endpointUrl("sales/follow-up"), fullPayload, true);
            toast.success("Follow Up berhasil dibuat!");
            router.push("/follow-ups");

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menyimpan data.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Form Template...</p>
                </div>
            </div>
        );
    }

    const currentStepData = formSteps[activeStep];

    return (
        <ComponentCard title="Buat Follow Up Baru">
            <div className="space-y-6">

                <div className="grid grid-cols-1 gap-6">
                    <div className="w-full relative">
                        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                            Cari Nomor Member
                        </label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Ketik No. Member (Otomatis cari...)"
                                value={searchMemberNo}
                                onChange={(e) => handleMemberSearch(e.target.value)}
                                className="pr-10"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                        {isSearching && <p className="text-xs text-blue-500 mt-1">Sedang mencari data...</p>}
                    </div>

                    {customerData && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 animate-fade-in-down">
                            <h4 className="text-blue-800 dark:text-blue-300 font-bold mb-5 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                                Informasi Pelanggan
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 text-sm">
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">Nama Lengkap</p>
                                    <p className="font-semibold text-gray-800 dark:text-white text-base">
                                        {customerData.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">Nomor Member</p>
                                    <p className="font-semibold text-gray-800 dark:text-white text-base">
                                        {customerData.member_no}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">No. Telepon</p>
                                    <p className="font-semibold text-gray-800 dark:text-white text-base">
                                        {customerData.phone}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">Tanggal Lahir</p>
                                    <p className="font-semibold text-gray-800 dark:text-white text-base">
                                        {customerData.date_of_birth
                                            ? moment(customerData.date_of_birth).format("DD MMMM YYYY")
                                            : "-"}
                                    </p>
                                </div>
                                <div className="md:col-span-2 space-y-1 pt-2">
                                    <p className="text-gray-500 dark:text-gray-400">Alamat</p>
                                    <p className="font-semibold text-gray-800 dark:text-white text-base leading-relaxed">
                                        {customerData.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
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
                        {currentStepData?.details.map((detail) => (
                            <div key={detail.id} className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {detail.label}
                                    {detail.is_default == 1 && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {(detail.value_type === 1 || detail.value_type === 2) && (
                                    <Input
                                        type={detail.value_type === 2 ? "number" : "text"}
                                        placeholder={`Masukkan ${detail.label}...`}
                                        value={dynamicValues[detail.id] || ""}
                                        onChange={(e) => handleDynamicChange(detail, e.target.value)}
                                        className="w-full"
                                    />
                                )}

                                {detail.value_type === 3 && (
                                    <Select
                                        placeholder="Pilih Opsi"
                                        value={
                                            detail.field_value.find(
                                                opt => opt.id === optionValueIds[detail.id]
                                            )
                                                ? {
                                                    value: optionValueIds[detail.id],
                                                    label: dynamicValues[detail.id]
                                                }
                                                : null
                                        }
                                        options={detail.field_value.map(opt => ({
                                            value: opt.id,
                                            label: opt.value
                                        }))}
                                        onValueChange={(selected) => {
                                            if (selected) {
                                                handleDynamicChange(detail, selected.label, Number(selected.value));
                                            } else {
                                                handleDynamicChange(detail, "", 0);
                                            }
                                        }}
                                    />
                                )}

                                {detail.value_type === 4 && (
                                    <div className="w-full">
                                        <SingleDatePicker
                                            placeholderText={`Pilih ${detail.label}`}
                                            selectedDate={dynamicValues[detail.id] ? new Date(dynamicValues[detail.id]) : null}
                                            onChange={(date: Date | null) => {
                                                const formatted = date ? moment(date).format("YYYY-MM-DD") : "";
                                                handleDynamicChange(detail, formatted);
                                            }}
                                            onClearFilter={() => handleDynamicChange(detail, "")}
                                            viewingMonthDate={viewingMonthDate}
                                            onMonthChange={setViewingMonthDate}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-10 pt-6 border-t dark:border-gray-700">
                        {activeStep > 0 ? (
                            <button
                                type="button"
                                onClick={() => setActiveStep(prev => prev - 1)}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 font-medium"
                            >
                                Sebelumnya
                            </button>
                        ) : <div></div>}

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
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium shadow-lg shadow-green-500/30 flex items-center gap-2"
                            >
                                {submitting ? "Menyimpan..." : "Simpan Follow Up"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ComponentCard>
    );
}