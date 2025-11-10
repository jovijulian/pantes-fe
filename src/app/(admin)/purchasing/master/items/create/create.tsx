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
    code: string;
    name_item: string;
}

export default function CreateForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateData>({
        code: "",
        name_item: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name_item || !formData.code) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const data: CreateData = {
                code: formData.code,
                name_item: formData.name_item,
            }

            await httpPost(
                endpointUrl("/master/item"),
                data,
                true,
            );
            toast.success("Barang berhasil ditambahkan!");
            router.push("/purchasing/master/items");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan barang.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Barang">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Kode Barang<span className="text-red-400 ml-1">*</span>
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
                        Nama Barang<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={formData.name_item}
                        onChange={(e) => setFormData({ ...formData, name_item: e.target.value })}
                        required
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/purchasing/master/items")}
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

