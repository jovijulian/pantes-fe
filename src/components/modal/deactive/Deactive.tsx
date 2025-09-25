"use client";

import React, { useState } from "react";
import { alertToast, endpointUrl, httpDelete, httpPatch } from "../../../../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
interface DeactiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading?: boolean;
    url?: string;
    itemName?: string;
    selectedData: any;
    onSuccess?: () => void;
    message: string;
}

const DeactiveModal: React.FC<DeactiveModalProps> = ({
    isOpen,
    onClose,
    loading = false,
    url,
    itemName = "",
    selectedData,
    onSuccess = () => { },
    message,
}) => {
    const [deleteLoading, setDeleteLoading] = useState(false);
    if (!isOpen) return null;
    const handleDeactive = async () => {
        if (!selectedData) return;
       
        try {
            setDeleteLoading(true);
            const response = await httpDelete(
                endpointUrl(url),
                true,
            );
            toast.success(response?.data?.message || "Deleted successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete");
        } finally {
            setDeleteLoading(false);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">

                {/* Header dengan Icon */}
                <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Confirm Delete
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This action is permanent
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                            {itemName || "this item"}
                        </span>
                        ? This action cannot be undone and all associated data will be permanently removed.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-all duration-200 font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeactive}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 flex items-center justify-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        {deleteLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </>
                        )}
                    </button>
                </div>
                </div>
        </Modal>
    );
};

export default DeactiveModal;
