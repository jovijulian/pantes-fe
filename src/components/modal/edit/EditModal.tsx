"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import { alertToast, endpointUrl, httpGet, httpPatch, httpPost, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { useModal } from "@/hooks/useModal";
interface EditData {
    id: number;
    type: string;
    name: string;
    status: number;
}

interface EditFeatureModalProps {
    isOpen: boolean;
    selectedId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const handleChangePassword = async () => {
        setError("");
        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required.");
            return;
        }

        const payload = {
            old_password: oldPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        };


        try {
            await httpPost(endpointUrl("auth/update-password"), payload, true);
            toast.success("Berhasil ganti password!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message);
            setError(error?.response?.data?.message || "Failed to change password.");
        }


    };
    const handleCancel = () => {
        onClose();
        setError("");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                        Change Password
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Enter your old password and set a new strong password.
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleChangePassword();
                    }}
                    className="flex flex-col"
                >
                    <div className="space-y-5 px-2 pb-3">
                        <div>
                            <Label htmlFor="old_password">Old Password</Label>
                            <Input
                                type="password"
                                id="old_password"
                                name="old_password"
                                defaultValue={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter your current password"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                type="password"
                                id="new_password"
                                name="new_password"
                                defaultValue={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter your new password"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <Input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                defaultValue={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <button
                            type="button"
                            title="Cancel"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            title="Save Password"
                            className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all"
                        >
                            Save Password
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default EditFeatureModal;
