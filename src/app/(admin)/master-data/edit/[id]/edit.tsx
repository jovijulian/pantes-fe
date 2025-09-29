"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { endpointUrl, httpGet, httpPost, httpPut } from "@/../helpers"; // Assuming httpPut exists
import { toast } from "react-toastify";

interface DetailItem {
    id?: number; // Options from the DB will have an ID
    value: string;
}

export default function UpdateMasterFieldForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    // State for form fields
    const [step, setStep] = useState<number>(0);
    const [stepName, setStepName] = useState("");
    const [label, setLabel] = useState("");
    const [valueType, setValueType] = useState<number>(1);
    const [valueLength, setValueLength] = useState<number>(0);
    const [details, setDetails] = useState<DetailItem[]>([]);

    // Loading states
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Fetch existing data when the component mounts
    useEffect(() => {
        if (!id) return;

        const getFieldData = async () => {
            try {
                const response = await httpGet(endpointUrl(`/master/field/${id}`),true);
                const data = response.data.data;

                // Populate the form with existing data
                setStep(Number(data.step));
                setStepName(data.step_name);
                setLabel(data.details[0].label);
                setValueType(Number(data.details[0].value_type));
                setValueLength(Number(data.details[0].value_length));
                // Also populate the options if they exist
                if (data.details[0].field_value && Array.isArray(data.details[0].field_value)) {
                    setDetails(data.details[0].field_value);
                }

            } catch (error) {
                toast.error("Failed to fetch master field data.");
                router.push("/master-data");
            } finally {
                setInitialLoading(false);
            }
        };

        getFieldData();
    }, [id, router]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stepName || !label || !step) {
            toast.error("Please fill all required fields");
            return;
        }

        // Construct the payload as requested
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
            toast.success("Master field updated successfully!");
            router.push("/master-data");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update master field");
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
                        <label className="block font-medium mb-1">Step Order <span className="text-red-400">*</span></label>
                        <Input
                            type="number"
                            value={step}
                            onChange={(e) => setStep(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Step Name <span className="text-red-400">*</span></label>
                        <Input
                            type="text"
                            value={stepName}
                            onChange={(e) => setStepName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1">Field Label <span className="text-red-400">*</span></label>
                    <Input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Value Type <span className="text-red-400">*</span></label>
                    <Select
                        options={valueTypeOptions}
                        value={valueTypeOptions.find(opt => opt.value === valueType)}
                        onValueChange={(option) => setValueType(option ? option.value : 1)}
                    />
                </div>

                {/* This section now just displays existing options */}
                {valueType === 3 && (
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold">Existing Options</h3>
                        <p className="text-sm text-gray-500">Managing options (add/remove) should be done through a separate feature to avoid accidental data changes.</p>
                        <div className="space-y-2">
                            {details.map((item) => (
                                <div key={item.id} className="bg-gray-50 p-2 rounded">
                                    <span>{item.value}</span>
                                </div>
                            ))}
                            
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
                        {loading ? "Updating..." : "Update Master Field"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}