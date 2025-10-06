"use client";
import React, { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, httpGet } from "../../../../../helpers";
import { FaWrench, FaListUl, FaCheckCircle, FaTimesCircle, FaLayerGroup, FaInfoCircle } from "react-icons/fa";

interface FieldValueItem {
    id: number;
    value: string;
}

interface FieldDetail {
    label: string;
    value_type: string; 
    is_default: string;
    status: string;
    created_at: string;
    updated_at: string;
    field_value: FieldValueItem[];
}

interface StepData {
    id: number;
    step: string;
    step_name: string;
    details: FieldDetail[];
}

const getValueTypeLabel = (type: string) => {
    switch (type) {
        case '1': return "Text Input";
        case '2': return "Number Input";
        case '3': return "Options (Select)";
        case '4': return "Date";
        default: return "Not specified";
    }
};

export default function StepDetailPage() {
    const [data, setData] = useState<StepData | null>(null);
    const params = useParams();
    const id = Number(params.id);

    const getDetail = async (id: number) => {
        try {
            const response = await httpGet(endpointUrl(`master/field/${id}`), true); 
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching step details:", error);
        }
    };

    useEffect(() => {
        if (id) getDetail(id);
    }, [id]);

    if (!data) {
        return <p className="text-center mt-10 text-gray-400">Loading...</p>;
    }

    return (
        <ComponentCard title={`Detail for Step: ${data.step_name}`}>
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <FaLayerGroup className="text-blue-500 w-6 h-6" />
                    <h2 className="text-2xl font-bold text-blue-800">Informasi Step</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    <div>
                        <span className="block text-sm text-gray-500">Nama Step</span>
                        <span className="text-lg font-semibold">{data.step_name}</span>
                    </div>
                    <div>
                        <span className="block text-sm text-gray-500">Urutan Step</span>
                        <span className="text-lg font-semibold">{data.step}</span>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Field dalam Step ini</h3>
            
            <div className="space-y-6">
                {data.details.map((field, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm transition hover:shadow-md">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">{field.label}</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm mb-4">
                            <div>
                                <span className="block text-gray-500">Tipe Value</span>
                                <span className="font-medium text-gray-800">{getValueTypeLabel(field.value_type)}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500">Status</span>
                                <span className={`inline-flex items-center gap-2 font-semibold ${field.status == '1' ? 'text-green-600' : 'text-red-600'}`}>
                                    {field.status == '1' ? <FaCheckCircle/> : <FaTimesCircle/>}
                                    {field.status == '1' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                             <div>
                                <span className="block text-gray-500">Apakah Default?</span>
                                <span className="font-medium text-gray-800">{field.is_default == '1' ? 'Yes' : 'No'}</span>
                            </div>
                        </div>

                        {field.field_value && field.field_value.length > 0 && (
                             <div>
                                <span className="block text-gray-500 text-sm mb-2">Pilihan yang Tersedia</span>
                                <div className="flex flex-wrap gap-2">
                                    {field.field_value.map(option => (
                                        <span key={option.id} className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                                            {option.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ComponentCard>
    );
}