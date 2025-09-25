"use client";

import React, { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, httpGet } from "../../../../../helpers"; // Sesuaikan path helper
import { 
    FaUserCircle, 
    FaPhoneAlt, 
    FaMapMarkerAlt, 
    FaInfoCircle, 
    FaBirthdayCake, 
    FaGift,
    FaCheckCircle,
    FaTimesCircle
} from "react-icons/fa";

// Interface untuk tipe data customer
interface CustomerData {
    id: number;
    name: string;
    phone: string;
    date_of_birth: string | null;
    address: string | null;
    date_anniv: string | null;
    detail_information: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

// Helper untuk memformat tanggal agar lebih mudah dibaca
const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export default function CustomerDetailPage() {
    const [data, setData] = useState<CustomerData | null>(null);
    const params = useParams();
    const id = Number(params.id);

    const getDetail = async (customerId: number) => {
        try {
            const response = await httpGet(endpointUrl(`/customer/${customerId}`), true);
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching customer details:", error);
        }
    };

    useEffect(() => {
        if (id) {
            getDetail(id);
        }
    }, [id]);

    if (!data) {
        return <div className="text-center p-10">Loading customer data...</div>;
    }

    return (
        <ComponentCard title={`Customer Detail: ${data.name}`}>
            <div className="space-y-6">

                {/* --- Kartu Informasi Utama --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                        <FaUserCircle className="w-8 h-8 text-blue-500"/>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{data.name}</h2>
                            <div className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${
                                data.status === '1' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {data.status === '1' ? <FaCheckCircle/> : <FaTimesCircle/>}
                                {data.status === '1' ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-3">
                            <FaPhoneAlt className="w-4 h-4 mt-1 text-gray-400"/>
                            <div>
                                <span className="block text-xs text-gray-500">Phone</span>
                                <a href={`tel:${data.phone}`} className="font-semibold hover:underline">{data.phone || 'N/A'}</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="w-4 h-4 mt-1 text-gray-400"/>
                            <div>
                                <span className="block text-xs text-gray-500">Address</span>
                                <p className="font-semibold">{data.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Kartu Tanggal Penting --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-3">
                            <FaBirthdayCake className="w-5 h-5 text-pink-500"/>
                            <div>
                                <span className="block text-xs text-gray-500">Date of Birth</span>
                                <span className="font-semibold">{formatDate(data.date_of_birth)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaGift className="w-5 h-5 text-red-500"/>
                            <div>
                                <span className="block text-xs text-gray-500">Anniversary</span>
                                <span className="font-semibold">{formatDate(data.date_anniv)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Kartu Informasi Tambahan & Metadata --- */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                         <FaInfoCircle className="w-4 h-4 mt-1 text-gray-400"/>
                         <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Additional Information</h3>
                            <p className="text-gray-600 dark:text-gray-400 italic">
                                {data.detail_information || 'No additional information provided.'}
                            </p>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p>Data Created: {formatDate(data.created_at)}</p>
                                <p>Last Updated: {formatDate(data.updated_at)}</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </ComponentCard>
    );
}