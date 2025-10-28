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
    code: string;
}

export default function CreateForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateData>({
        name: "",
        email: "",
        password: "",
        phone: "",
        code: "",
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
            const data: CreateData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                code: formData.code,
            }

            await httpPost(
                endpointUrlv2("staff-purchasing"),
                data,
                true,
            );
            toast.success("Staff berhasil ditambahkan!");
            router.push("/purchasing/master/staffs");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan staff.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Staff">
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
                        Kode<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
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
                        onClick={() => router.push("/purchasing/master/staffs")}
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

