"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrlv2, httpGet } from "@/../helpers";
import moment from "moment";
import {
    FaClipboardList,
    FaUserCircle,
    FaUserTie,
    FaCalendarAlt,
    FaHashtag,
    FaCheckCircle,
    FaTimesCircle,
    FaPhone,
    FaEnvelope,
    FaBirthdayCake,
    FaMapMarkerAlt,
    FaStickyNote,
    FaArrowLeft,
    FaSmile,
    FaQuestionCircle,
    FaCommentDots,
    FaHeadset
} from "react-icons/fa";
import { Goal } from "lucide-react";


interface FieldValue {
    id: number;
    form_detail_id: string;
    value: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface DetailItem {
    id: string;
    label: string;
    value_type: number;
    value_length: number;
    is_default: number;
    status: number;
    // field_value: FieldValue[] | [];
    form_detail_value: FieldValue[] | [];
}

interface DetailGroup {
    step: number;
    step_name: string;
    details: DetailItem[];
}

interface CustomerInfo {
    id: number;
    name: string;
    member_no: string;
    phone: string;
    date_of_birth: string | null;
    address: string;
    status: string;
}

interface SalesInfo {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface FollowUpData {
    id: number;
    user_id: string;
    customer_id: string;
    date: string;
    name: string;
    description: string;
    status: number;
    created_at: string;
    updated_at: string;
    sales: SalesInfo;
    customer: CustomerInfo;
    details_grouped: DetailGroup[];
}


const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return moment(dateString).format('DD MMMM YYYY');
};

const getFieldIcon = (label: string) => {
    const labelLower = label.toLowerCase();
    const iconClass = "w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5";

    if (labelLower.includes('phone') || labelLower.includes('telepon') || labelLower.includes('via')) return <FaPhone className={iconClass} />;
    if (labelLower.includes('name') || labelLower.includes('nama')) return <FaUserCircle className={iconClass} />;
    if (labelLower.includes('date') || labelLower.includes('tanggal')) return <FaCalendarAlt className={iconClass} />;
    if (labelLower.includes('address') || labelLower.includes('alamat')) return <FaMapMarkerAlt className={iconClass} />;
    if (labelLower.includes('birth') || labelLower.includes('lahir')) return <FaBirthdayCake className={iconClass} />;
    if (labelLower.includes('catatan') || labelLower.includes('note') || labelLower.includes('description')) return <FaStickyNote className={iconClass} />;
    if (labelLower.includes('judul')) return <FaClipboardList className={iconClass} />;

    return <Goal className={iconClass} />;
};


const DisplayValue = ({ detail }: { detail: DetailItem}) => {
    const rawValueObj = detail.form_detail_value[0];

    if (!rawValueObj || !rawValueObj.value) return <span className="text-gray-400 italic">-</span>;

    const rawString = rawValueObj.value;

    if (detail.value_type === 4) {
        return (
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatDate(rawString)}</span>
            </div>
        );
    }

    if (detail.value_type === 3) {
        try {
            const parsed = JSON.parse(rawString);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return (
                    <div className="flex flex-wrap gap-2">
                        {parsed.map((item: any, idx: number) => (
                            <span key={idx} className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                                {item.value}
                            </span>
                        ))}
                    </div>
                );
            }
        } catch (e) {
            return <span className="font-medium text-gray-800 dark:text-gray-200">{rawString}</span>;
        }
    }

    if (rawString.length > 50) {
        return <span className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed block bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">{rawString}</span>;
    }

    return <span className="font-semibold text-gray-800 dark:text-gray-200">{rawString}</span>;
};

export default function SalesFollowUpDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
    const [role, setRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FollowUpData | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(parseInt(storedRole));
        }
    }, []);
    
    useEffect(() => {
        if (role && id) {
            fetchData();
        }
    }, [role, id]);
    

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        let url;
        if (role === 2) {
            url = endpointUrlv2(`sales/follow-up/${id}`);
        } else {
            url = endpointUrlv2(`follow-up/${id}`);
        }
        try {
            const response = await httpGet(url, true);
            if (response.data && response.data.data) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching follow up details:", error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm font-medium">Memuat data follow up...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-gray-500">Data tidak ditemukan.</div>;
    const currentStepData = data.details_grouped[activeTab];

    return (
        <ComponentCard title="">
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <FaClipboardList className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
                                    {data.name}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm mt-3">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <FaCalendarAlt className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Dibuat:
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-white">
                                        {moment(data.created_at).format("DD MMM YYYY, HH:mm")}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <FaCalendarAlt className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Diperbarui:
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-white">
                                        {moment(data.updated_at).format("DD MMM YYYY, HH:mm")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full group-hover:scale-110 transition-transform duration-300">
                                <FaUserCircle className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Customer Information</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Target Follow Up</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">Nama</span>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{data.customer.name}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">No. Member</span>
                                <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">{data.customer.member_no}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">Telepon</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{data.customer.phone}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                                <span className="text-sm text-gray-500 w-24 pt-1">Alamat</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{data.customer.address}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full group-hover:scale-110 transition-transform duration-300">
                                <FaUserTie className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sales Representative</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">PIC Follow Up</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">Nama</span>
                                <span className="font-bold text-lg text-gray-800 dark:text-white">{data.sales.name}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">Email</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{data.sales.email}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                                <span className="text-sm text-gray-500 w-24">Telepon</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{data.sales.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700 my-4" />

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto  ">
                        <nav className="flex space-x-2" aria-label="Tabs">
                            {data.details_grouped.map((group, index) => {
                                const isActive = activeTab === index;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setActiveTab(index)}
                                        className={`
                                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all
                                ${isActive
                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                                    >
                                        Step {group.step}: {group.step_name}
                                    </button>

                                );
                            })}

                        </nav>
                    </div>

                    <div className="p-8 flex-1">
                        {currentStepData && (
                            <div className="animate-fade-in text-left">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <Goal className="w-5 h-5 text-blue-500" />
                                    {currentStepData.step_name}
                                </h3>

                                <div className="grid grid-cols-1 gap-y-8">
                                    {currentStepData.details.map((detail) => (
                                        <div key={detail.id} className="group relative pl-4 hover:border-blue-400 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getFieldIcon(detail.label)}
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                                    {detail.label}
                                                </span>
                                            </div>

                                            <div className="ml-7 relative">
                                                <div className="absolute -left-3.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-300 transition-colors"></div>
                                                <div className="py-1">
                                                    <DisplayValue detail={detail} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow"
                    >
                        <FaArrowLeft className="text-sm" />
                        Kembali
                    </button>
                </div>

            </div>
        </ComponentCard>
    );
}