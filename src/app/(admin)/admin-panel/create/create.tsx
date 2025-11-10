"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, endpointUrlv2, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface CreateData {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    image: File | null;
}

export default function CreateForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateData>({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "",
        image: null,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("password", formData.password);
            data.append("phone", formData.phone);
            data.append("role_id", formData.role);
            if (formData.image) {
                data.append("image", formData.image);
            }

            await httpPost(
                endpointUrl("admin"),
                data,
                true,
            );
            toast.success("Admin berhasil ditambahkan!");
            router.push("/admin-panel");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan admin.");
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { label: "Admin Sales", value: "4" },
        { label: "Admin Purchasing", value: "5" },
    ];

    return (
        <ComponentCard title="Data Admin">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Nama<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Email<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="email"
                        defaultValue={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        No. Telepon<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => {
                            const onlyNums = e.target.value.replace(/\D/g, "");
                            setFormData({ ...formData, phone: onlyNums });
                        }}
                        required
                    />

                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Role<span className="text-red-400 ml-1">*</span>
                    </label>

                    <Select
                        onValueChange={(selectedOption) => {
                            setFormData({ ...formData, role: selectedOption.value });
                        }}
                        placeholder={"Select role"}
                        value={_.find(roleOptions, { value: formData.role })}
                        options={roleOptions}
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Password<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="password"
                        defaultValue={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/admin-panel")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}

