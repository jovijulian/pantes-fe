"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ComponentCard from "@/components/common/ComponentCard";
import { endpointUrl, httpGet } from "../../../../../helpers";
import {
    FaReceipt,
    FaUserCircle,
    FaUserTie,
    FaCalendarAlt,
    FaHashtag,
    FaCheckCircle,
    FaTimesCircle,
    FaBoxOpen,
    FaPhone,
    FaEnvelope,
    FaBirthdayCake,
    FaMapMarkerAlt,
    FaHeart,
    FaStickyNote,
    FaTag,
    FaMoneyBillWave,
    FaGem,
    FaLayerGroup,
    FaArrowLeft
} from "react-icons/fa";

interface FieldValue {
    id: number;
    field_id: string;
    value: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Detail {
    id: string;
    label: string;
    value_type: number;
    value_length: number;
    is_default: number;
    status: number;
    created_at: string;
    updated_at: string;
    field_value: FieldValue[];
}

interface DetailGroup {
    step: number;
    step_name: string;
    details: Detail[];
}

interface Sales {
    id: number;
    role_id: string;
    email: string;
    name: string;
    phone: string;
    token: string;
    url_image: string | null;
    first_login: string;
    last_login: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    date_of_birth: string;
    address: string;
    date_anniv: string;
    detail_information: string;
    status: string;
    created_at: string;
    created_by: string;
    updated_at: string;
}

interface TransactionData {
    id: number;
    user_id: string;
    customer_id: string;
    date: string;
    name_purchase: string;
    description: string;
    status: number;
    created_at: string;
    updated_at: string;
    sales: Sales;
    customer: Customer;
    details_grouped: DetailGroup[];
}

interface ItemSet {
    setIndex: number;
    fields: { detail: Detail; fieldValue: FieldValue }[];
}

// Helper untuk format tanggal
const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);

const parseJsonValue = (value: string): string[] => {
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map(item => item.value).filter(Boolean);
        }
    } catch (e) {
        // Not a JSON string
    }
    return [];
};

const DisplayValue = ({ value, label }: { value: string; label: string }) => {
    const parsedValues = parseJsonValue(value);

    if (parsedValues.length > 0) {
        return (
            <div className="flex flex-wrap gap-2">
                {parsedValues.map((val, index) => (
                    <span key={index} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                        {val}
                    </span>
                ))}
            </div>
        );
    }

    if (label.toLowerCase().includes('price') || label.toLowerCase().includes('harga')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            return <span className="font-semibold text-lg text-green-600 dark:text-green-400">{formatCurrency(numValue)}</span>;
        }
    }

    if (label.toLowerCase().includes('date') || label.toLowerCase().includes('tanggal')) {
        return <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(value)}</span>;
    }

    return <span className="font-semibold text-gray-800 dark:text-gray-200">{value || 'N/A'}</span>;
};

const getFieldIcon = (label: string, isDefault: boolean = true) => {
    const labelLower = label.toLowerCase();
    const iconClass = isDefault ? "w-4 h-4 text-gray-400" : "w-4 h-4 text-purple-400";

    if (labelLower.includes('phone') || labelLower.includes('telepon')) return <FaPhone className={iconClass} />;
    if (labelLower.includes('name') || labelLower.includes('nama')) return <FaUserCircle className={iconClass} />;
    if (labelLower.includes('date') || labelLower.includes('tanggal')) return <FaCalendarAlt className={iconClass} />;
    if (labelLower.includes('address') || labelLower.includes('alamat')) return <FaMapMarkerAlt className={iconClass} />;
    if (labelLower.includes('birth') || labelLower.includes('lahir')) return <FaBirthdayCake className={iconClass} />;
    if (labelLower.includes('anniv')) return <FaHeart className={iconClass} />;
    if (labelLower.includes('note') || labelLower.includes('catatan')) return <FaStickyNote className={iconClass} />;
    if (labelLower.includes('price') || labelLower.includes('harga')) return <FaMoneyBillWave className={iconClass} />;
    if (labelLower.includes('model')) return <FaGem className={iconClass} />;
    if (labelLower.includes('type') || labelLower.includes('tipe')) return <FaTag className={iconClass} />;
    return isDefault ? <FaHashtag className="w-4 h-4 text-gray-400" /> : "";
};


const separateFieldsByType = (details: Detail[]) => {
    const defaultFields: { detail: Detail; fieldValue: FieldValue }[] = [];
    const customFields: { detail: Detail; fieldValue: FieldValue }[] = [];

    details.forEach(detail => {
        detail.field_value.forEach(fieldValue => {
            if (detail.is_default === 1) {
                defaultFields.push({ detail, fieldValue });
            } else {
                customFields.push({ detail, fieldValue });
            }
        });
    });

    return { defaultFields, customFields };
};

const groupItemsByFieldValueSequence = (details: Detail[]): ItemSet[] => {
    const allFieldsWithValues: { detail: Detail; fieldValue: FieldValue; fieldValueId: number }[] = [];

    details.forEach(detail => {
        detail.field_value.forEach(fieldValue => {
            allFieldsWithValues.push({
                detail,
                fieldValue,
                fieldValueId: fieldValue.id
            });
        });
    });

    allFieldsWithValues.sort((a, b) => a.fieldValueId - b.fieldValueId);

    const itemSets: ItemSet[] = [];
    const uniqueFieldIds = [...new Set(details.map(d => d.id))];
    const fieldsPerItem = uniqueFieldIds.length > 0 ? uniqueFieldIds.length : 1;

    for (let i = 0; i < allFieldsWithValues.length; i += fieldsPerItem) {
        const setFields = allFieldsWithValues.slice(i, i + fieldsPerItem);
        if (setFields.length > 0) {
            itemSets.push({
                setIndex: Math.floor(i / fieldsPerItem) + 1,
                fields: setFields.map(({ detail, fieldValue }) => ({ detail, fieldValue }))
            });
        }
    }

    return itemSets;
};

export default function TransactionDetailPage() {
    const [data, setData] = useState<TransactionData | null>(null);
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [role, setRole] = useState<number | null>(null);
    useEffect(() => {
        const userRole = localStorage.getItem("role");
        if (userRole) {
            setRole(Number(userRole));
        }
    }, []);
    useEffect(() => {
        if (!id || role === null) {
            return;
        }

        const getDetail = async (transactionId: number) => {
            try {
                let endpoint = '';
                if (role === 1 || role === 4) {
                    endpoint = endpointUrl(`/customer/history/${transactionId}`);
                } else if (role === 2) {
                    endpoint = endpointUrl(`/sales/transaction/${transactionId}`);
                } else {
                    console.error("Unknown user role:", role);
                    return;
                }

                const response = await httpGet(endpoint, true);
                setData(response.data.data);
            } catch (error) {
                console.error("Error fetching transaction details:", error);
            }
        };

        getDetail(id);
    }, [id, role]);

    const totalPrice = useMemo(() => {
        if (!data) return 0;
        let total = 0;
        data.details_grouped.forEach(group => {
            group.details.forEach(detail => {
                if (detail.label.toLowerCase().includes('price')) {
                    detail.field_value.forEach(fv => {
                        const price = parseFloat(fv.value);
                        if (!isNaN(price)) total += price;
                    });
                }
            });
        });
        return total;
    }, [data]);


    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading transaction data...</p>
                </div>
            </div>
        );
    }

    return (
        <ComponentCard title="">
            <div className="space-y-6">

                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md border-t-4 border-blue-500">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <FaReceipt className="w-8 h-8 text-blue-500" />
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Detail Transaksi</h1>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nama Pembelian: {data.name_purchase}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                    <FaCalendarAlt className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    <span className="font-bold text-lg text-gray-700 dark:text-gray-200">{formatDate(data.date)}</span>
                                </div>
                                {totalPrice > 0 && (
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                        <FaMoneyBillWave className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        <span className="font-bold text-lg text-gray-700 dark:text-gray-200">{formatCurrency(totalPrice)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div
                            className={`px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 self-start ${data.status === 1
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                }`}
                        >
                            {data.status === 1 ? <FaCheckCircle className="w-5 h-5" /> : <FaTimesCircle className="w-5 h-5" />}
                            {data.status === 1 ? 'Completed' : 'Pending'}
                        </div>
                    </div>
                    {data.description && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 italic flex items-start gap-3">
                                <FaStickyNote className="w-4 h-4 mt-1 flex-shrink-0" />
                                <span>{data.description}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <FaUserCircle className="w-7 h-7 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Customer</h3>
                                <p className="text-sm text-gray-500">Customer Information</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Name</p>
                                <Link href={`/customers/detail/${data.customer.id}`}
                                    className="font-bold text-xl text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors">
                                    {data.customer.name}
                                </Link>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <FaPhone className="w-4 h-4" />
                                <span className="font-medium">{data.customer.phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <FaUserTie className="w-7 h-7 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sales</h3>
                                <p className="text-sm text-gray-500">Ditangani oleh</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Nama</p>
                                <p className="font-bold text-xl text-gray-800 dark:text-white">{data.sales.name}</p>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <FaEnvelope className="w-4 h-4" />
                                <span className="font-medium">{data.sales.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {data.details_grouped.map((group) => {

                    const isItemsStep = group.step_name.toLowerCase().includes('item');

                    return (
                        <div key={group.step} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">

                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{group.step_name}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {isItemsStep ? (
                                    // Render Items dengan grouping
                                    <div className="space-y-6">
                                        {groupItemsByFieldValueSequence(group.details).map((itemSet) => (
                                            <div key={itemSet.setIndex} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-800/50">
                                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300 dark:border-gray-600">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                                                Item #{itemSet.setIndex}
                                                            </h3>

                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {itemSet.fields.map(({ detail, fieldValue }) => (
                                                        <div key={`${detail.id}-${fieldValue.id}`} className="group">
                                                            <div className="flex items-start gap-2 mb-2">
                                                                {getFieldIcon(detail.label, detail.is_default === 1)}
                                                                <span className={`block text-sm font-medium text-gray-500 dark:text-gray-400`}>
                                                                    {detail.label}

                                                                </span>
                                                            </div>
                                                            <div className={`ml-6 p-3 rounded-lg group-hover:shadow-sm transition-all ${detail.is_default === 1
                                                                ? 'bg-white dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50'
                                                                : 'bg-white dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50'
                                                                }`}>
                                                                <DisplayValue value={fieldValue.value} label={detail.label} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {(() => {
                                            const { defaultFields } = separateFieldsByType(group.details);
                                            return defaultFields.length > 0 && (
                                                <div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {defaultFields.map(({ detail, fieldValue }) => (
                                                            <div key={`${detail.id}-${fieldValue.id}`} className="group">
                                                                <div className="flex items-start gap-2 mb-2">
                                                                    {getFieldIcon(detail.label, true)}
                                                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                        {detail.label}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-900 transition-colors">
                                                                    <DisplayValue value={fieldValue.value} label={detail.label} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {(() => {
                                            const { customFields } = separateFieldsByType(group.details);
                                            return customFields.length > 0 && (
                                                <div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {customFields.map(({ detail, fieldValue }) => (
                                                            <div key={`${detail.id}-${fieldValue.id}`} className="group">
                                                                <div className="flex items-start gap-2 mb-2">
                                                                    {getFieldIcon(detail.label, false)}
                                                                    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                        {detail.label}
                                                                    </span>
                                                                </div>
                                                                <div className=" p-3  bg-gray-50 dark:bg-gray-900/50 rounded-lg border transition-all">
                                                                    <DisplayValue value={fieldValue.value} label={detail.label} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
                        <FaArrowLeft />
                        Kembali
                    </button>
                </div>

            </div>
        </ComponentCard>
    );
}
