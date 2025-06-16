"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Table from "@/components/tables/Table";
import { FaEdit, FaListAlt, FaFileInvoice, FaTrash, FaCar, FaUser, FaCog, FaCalendar, FaCheckCircle, FaTimesCircle, FaClock, FaImage, FaFont, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal"; // Import modal baru
import { endpointUrl, httpGet, httpPost, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import axios from "axios";
import moment from "moment";

interface Mechanic {
    id: number;
    role_id: number;
    email: string;
    name: string;
    phone: string;
    token: string | null;
    url_image: string | null;
    first_login: string | null;
    last_login: string | null;
    status: number;
    created_at: string;
    updated_at: string;
}

interface Customer {
    id: number;
    number_plate: string;
    owner_name: string;
    merk: string;
    phone: string;
    status: number;
    created_at: string;
    updated_at: string;
}

interface Feature {
    id: number;
    type: string;
    name: string;
    status: number;
    created_at: string;
    updated_at: string;
}

interface TransactionDetailValue {
    id: number;
    transaction_id: number;
    transaction_detail_id: number;
    value: string;
    full_url: string;
    status: number;
    created_at: string;
    updated_at: string;
}

interface TransactionDetailItem {
    id: number;
    transaction_id: number;
    feature_id: number;
    feature_field_id: number;
    feature_field_value_type: number;
    user_id: number;
    customer_id: number;
    step: number;
    number_plate: string;
    label: string;
    notes: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    feature: Feature;
    step_name: string;
    condition: string;
    transaction_detail_value: TransactionDetailValue[];
}

export interface TransactionData {
    id: number;
    user_id: number;
    customer_id: number;
    number_spk: string;
    number_plate: string;
    notes: string | null;
    is_done: number;
    status: number | null;
    created_at: string;
    updated_at: string;
    mechanic?: Mechanic;
    customer?: Customer;
    transaction_detail: TransactionDetailItem[];
}

export default function TransactionDetailPage() {
    const [data, setData] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const params = useParams();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewImageTitle, setPreviewImageTitle] = useState<string>("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<number>(1);
    const id = Number(params.id);
    const [isLoading, setIsLoading] = useState(false);
    const role = localStorage.getItem("role");


    const getDetail = async (id: number) => {
        try {
            const response = await httpGet(endpointUrl(`transaction/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching transaction details:", error);
        }
    };

    useEffect(() => {
        if (id) getDetail(id);
    }, [id]);

    const handleStatusToggle = async () => {
        if (!data) return;

        try {
            setLoading(true);
            const newStatus = data.is_done == 1 ? 0 : 1;

            await httpPost(
                endpointUrl(`/transaction/${data.id}`),
                { is_done: newStatus },
                true
            );

            setData({ ...data, is_done: newStatus });
            toast.success(`Transaction marked as ${newStatus == 1 ? 'completed' : 'pending'}`);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: number | null, isDone: number) => {
        if (isDone == 1) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    <FaCheckCircle className="w-3 h-3" />
                    Completed
                </span>
            );
        } else if (status == 1) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    <FaClock className="w-3 h-3" />
                    In Progress
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                    <FaTimesCircle className="w-3 h-3" />
                    Inactive
                </span>
            );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group transaction details by step
    const groupedDetails = data?.transaction_detail.reduce((acc, detail) => {
        const step = detail.step || 1;
        if (!acc[step]) {
            acc[step] = [];
        }
        acc[step].push(detail);
        return acc;
    }, {} as Record<number, TransactionDetailItem[]>) || {};

    // Get sorted steps
    const sortedSteps = Object.keys(groupedDetails).map(Number).sort((a, b) => a - b);

    // Set initial active tab to first step
    useEffect(() => {
        if (sortedSteps.length > 0 && activeTab == 1 && !sortedSteps.includes(1)) {
            setActiveTab(sortedSteps[0]);
        }
    }, [sortedSteps]);

    // Handle image preview - Updated function
    const openImagePreview = (imageUrl: string, title: string = "Image Preview") => {
        setPreviewImage(imageUrl);
        setPreviewImageTitle(title);
        setIsPreviewOpen(true);
        console.log(imageUrl)
    };

    const closeImagePreview = () => {
        setPreviewImage(null);
        setPreviewImageTitle("");
        setIsPreviewOpen(false);
    };

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key == 'Escape' && isPreviewOpen) {
                closeImagePreview();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isPreviewOpen]);
    const videoExtensions = ['.webm', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.3gp', '.m4v'];

    const isVideo = (url: string): boolean => {
        console.log(url);
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    };
    const handlePreviewClick = async () => {
        setIsLoading(true);

        try {
            const response = await axios.get(endpointUrl(`transaction/${id}/export-pdf`), {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const pdfBlob = response.data;
            const blobUrl = URL.createObjectURL(pdfBlob);
            window.open(blobUrl, '_blank');

            const link = document.createElement('a');
            const filename = `transaction-${moment().format("YYYY-MM-DD")}.pdf`;
            link.href = blobUrl;

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error("Error saat memproses PDF:", error);
            toast.error("Failed to generate report. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };


    if (!data) return <p className="text-center mt-10 text-gray-400">Loading...</p>;

    return (
        <ComponentCard title="Transaction Detail">
            {/* Transaction Information */}
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-blue-700">
                        <FaFileInvoice className="text-blue-500 w-5 h-5" />
                        <h3 className="text-xl font-semibold">Transaction Information</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(data.status, data.is_done)}
                        {data.is_done == 0 && role != "3" && (
                            <button
                                onClick={handleStatusToggle}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${data.is_done == 0
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } disabled:opacity-50`}
                            >
                                {loading ? 'Updating...' : data.is_done == 0 ? 'Mark as Complete' : 'Done'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaFileInvoice className="w-4 h-4" />
                            <span>SPK Number</span>
                        </div>
                        <span className="font-bold text-lg font-mono">{data.number_spk}</span>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaCar className="w-4 h-4" />
                            <span>Vehicle</span>
                        </div>
                        <span className="font-medium text-lg">{data.number_plate}</span>
                        {data.customer?.merk && (
                            <div className="text-sm text-gray-600">{data.customer.merk}</div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaUser className="w-4 h-4" />
                            <span>Customer</span>
                        </div>
                        <span className="font-medium text-lg">{data.customer?.owner_name || 'N/A'}</span>
                        {data.customer?.phone && (
                            <div className="text-sm text-gray-600">{data.customer.phone}</div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaCog className="w-4 h-4" />
                            <span>Service</span>
                        </div>
                        <span className="font-medium text-lg">{data?.transaction_detail[0]?.feature.name || 'N/A'}</span>
                        {data?.transaction_detail[0]?.feature?.type && (
                            <div className="text-sm text-gray-600">{data?.transaction_detail[0]?.feature?.type}</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaUser className="w-4 h-4" />
                            <span>Mechanic</span>
                        </div>
                        <span className="font-medium">{data.mechanic?.name || 'N/A'}</span>
                        {data.mechanic?.phone && (
                            <div className="text-sm text-gray-600">{data.mechanic.phone}</div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <FaCalendar className="w-4 h-4" />
                            <span>Created</span>
                        </div>
                        <span className="font-medium">{formatDate(data.created_at)}</span>
                        <div className="text-sm text-gray-600">
                            Updated: {formatDate(data.updated_at)}
                        </div>
                    </div>
                </div>

                {data.notes && (
                    <div className="bg-white p-4 rounded-lg border mt-4">
                        <div className="text-gray-500 mb-1">Notes</div>
                        <p className="text-gray-800">{data.notes}</p>
                    </div>
                )}
            </div>

            {data.is_done == 1 && role != "3" && (
                <button
                    onClick={handlePreviewClick}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg shadow-md hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Report</span>
                        </>
                    )}
                </button>
            )}

            {/* Transaction Details with Tabs */}
            <div className="bg-white border rounded-lg shadow-sm">
                {/* Tab Headers */}
                <div className="border-b bg-gray-50">
                    <div className="flex overflow-x-auto">
                        {sortedSteps.map((step) => {
                            const stepDetails = groupedDetails[step];
                            return (
                                <button
                                    key={step}
                                    onClick={() => setActiveTab(step)}
                                    className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab == step
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-md px-1 py-2`}>
                                            {groupedDetails[step]?.[0]?.step_name || `Step ${step}`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {sortedSteps.length > 0 ? (
                        <div>
                            {/* Active Step Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">

                                        {/* <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">
                                            Step {activeTab}
                                        </div> */}
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {groupedDetails[activeTab]?.length || 0} Field{(groupedDetails[activeTab]?.length || 0) > 1 ? 's' : ''}
                                        </h4>
                                    </div>

                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(groupedDetails[activeTab] || []).map((detail) => (
                                    <div key={detail.id} className="bg-gray-50 rounded-lg border overflow-hidden">
                                        {/* Field Header */}
                                        <div className="bg-white p-3 border-b">
                                            <div className="flex flex-col gap-2">
                                                <span className="font-medium text-gray-800 text-sm leading-relaxed break-words">{detail.label}</span>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
                                                    {detail.condition && (
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${detail.condition === 'Good'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                            {detail.condition == 'Good' ? <FaThumbsUp /> : <FaThumbsDown />}
                                                            <span>Condition: {detail.condition}</span>
                                                        </div>
                                                    )}
                                                    {detail.feature_field_value_type == 1 ? (
                                                        <>
                                                            <FaImage className="w-3 h-3" />
                                                            <span>Photo</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaFont className="w-3 h-3" />
                                                            <span>Text</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Field Content */}
                                        <div className="p-4">
                                            {detail.feature_field_value_type == 1 ? (
                                                detail.transaction_detail_value.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {detail.transaction_detail_value.map((valueItem, index) => (
                                                                <div key={valueItem.id} className="relative group">
                                                                    {isVideo(valueItem.full_url) ? (
                                                                        <div className="relative w-full h-20">
                                                                            <video
                                                                                src={valueItem.full_url}
                                                                                className="w-full h-full object-cover rounded border pointer-events-none "
                                                                            />
                                                                            <div
                                                                                className="absolute inset-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition "
                                                                                onClick={() =>
                                                                                    openImagePreview(
                                                                                        valueItem.full_url,
                                                                                        `${detail.label} - Video ${index + 1}`
                                                                                    )
                                                                                }
                                                                            ></div>
                                                                        </div>

                                                                    ) : (
                                                                        <img
                                                                            src={valueItem.full_url}
                                                                            alt={`${detail.label} ${index + 1}`}
                                                                            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity hover:ring-2 hover:ring-blue-500"
                                                                            onClick={() =>
                                                                                openImagePreview(
                                                                                    valueItem.full_url,
                                                                                    `${detail.label} - Photo ${index + 1}`
                                                                                )
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {detail.transaction_detail_value.length} item
                                                            {detail.transaction_detail_value.length > 1 ? 's' : ''} • Click image to preview
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                                                        <div className="text-center text-gray-400">
                                                            <FaImage className="w-8 h-8 mx-auto mb-2" />
                                                            <span>No media uploaded</span>
                                                        </div>
                                                    </div>
                                                )
                                            ) : detail.transaction_detail_value.length > 0 ? (
                                                <div className="space-y-2">
                                                    {detail.transaction_detail_value.map((valueItem) => (
                                                        <div key={valueItem.id} className="bg-white p-3 rounded border">
                                                            <div className="text-gray-800">{valueItem.value}</div>
                                                            <div className="text-xs text-gray-500 mt-2">
                                                                Added: {formatDate(valueItem.created_at)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-white p-3 rounded border min-h-[3rem] flex items-center justify-center">
                                                    <span className="text-gray-400 italic">No value entered</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Field Footer */}
                                        <div className="bg-white p-3 border-t text-xs text-gray-500">
                                            <div className="flex justify-between items-center">
                                                <span>Last updated: {detail.transaction_detail_value?.[0]?.updated_at ? formatDate(detail.transaction_detail_value?.[0]?.updated_at) : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FaListAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No transaction details available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal - Using new ComponentCard modal */}
            <ImagePreviewModal
                isOpen={isPreviewOpen}
                imageUrl={previewImage}
                imageTitle={previewImageTitle}
                onClose={closeImagePreview}
            />

            {/* Delete Modal */}
            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedData(null);
                }}
                url={`transactions/detail/${selectedData?.id}/deactive`}
                itemName={selectedData?.label || ""}
                selectedData={selectedData}
                message="Transaction detail deleted successfully!"
            />
        </ComponentCard>
    );
}