"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpPost } from "@/../helpers";
import { toast } from "react-toastify";
import FileInput from "@/components/form/input/FileInput";
import DatePicker from "@/components/form/date-picker";

interface CreateData {
    email: string;
    password: string;
    name: string;
    phone: string;
    image: File | null;
}

export default function CreateForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !phone || !role) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const data = new FormData();
            data.append("name", name);
            data.append("email", email);
            data.append("password", password);
            data.append("phone", phone);
            data.append("role", role);
            if (image) {
                data.append("image", image);
            }
            await httpPost(
                endpointUrl("/mechanic"),
                data,
                true,
            );
            toast.success("Mechanic added successfully!");
            router.push("/mechanic");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Failed to add mechanic");
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { label: "Admin", value: "3" },
        { label: "Mechanic", value: "2" },
    ];

    return (
        <ComponentCard title="Title Data">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Name<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Phone<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="number"
                        defaultValue={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Email<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="email"
                        defaultValue={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Password<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="password"
                        defaultValue={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Date<span className="text-red-400 ml-1">*</span>
                    </label>
                    <DatePicker
                        id="publish-date"
                        // label="Publish Date"
                        placeholder="Select a date"

                    />
                </div>
                <div>
                    <label htmlFor="image" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Image
                    </label>
                    <FileInput
                        onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                        className="custom-class" />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Role<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Select
                        onValueChange={(selectedOption) => {
                            setRole(selectedOption.value);
                        }}
                        placeholder={"Select role"}
                        value={_.find(roleOptions, { value: role })}
                        options={roleOptions}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/mechanic")}
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
                        {loading ? "Creating..." : "Add Admin / Mechanic"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}

