"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import { endpointUrl, endpointUrlv2, httpGet, httpPost } from "@/../helpers";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import moment from "moment";
import Select from "@/components/form/Select-custom";
import { set } from "lodash";
import _ from "lodash";
interface SelectOption { value: string; label: string; }
export default function CreateCustomerForm() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [numberMember, setNumberMember] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [dateAnniv, setDateAnniv] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
    const [detailInformation, setDetailInformation] = useState("");
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInitialData = async () => {
        try {
            const [categoryRes] = await Promise.all([
                httpGet(endpointUrlv2("master/customer-category/dropdown"), true),
            ]);
            setCategoryOptions(categoryRes.data.data.map((s: any) => ({ value: s.id.toString(), label: s.name })));

        } catch (error) {
            toast.error("Gagal memuat data master untuk form.");
        } finally {
            setLoadingOptions(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!numberMember || !name || !phone) {
            toast.error("Silakan isi nama dan nomor telepon pelanggan.");
            return;
        }

        const payload = {
            member_no: numberMember,
            name,
            phone,
            address,
            date_of_birth: dateOfBirth ? moment(dateOfBirth).format("YYYY-MM-DD") : null,
            date_anniv: dateAnniv ? moment(dateAnniv).format("YYYY-MM-DD") : null,
            detail_information: detailInformation,
            category_id: selectedCategory ? selectedCategory.value : null,
        };

        try {
            setLoading(true);
            await httpPost(endpointUrlv2("/customer"), payload, true);
            toast.success("Pelanggan berhasil ditambahkan!");
            router.push("/customers");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan pelanggan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Tambahkan Pelanggan Baru">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Member Number */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Nomor Anggota <span className="text-red-400 ml-1">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., 0001"
                            value={numberMember}
                            onChange={(e) => setNumberMember(e.target.value)}
                            required
                        />
                    </div>
                    {/* Customer Name */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Nama Pelanggan <span className="text-red-400 ml-1">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Rina"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Nomor telepon <span className="text-red-400 ml-1">*</span>
                        </label>
                        <Input
                            type="tel" // 'tel' lebih baik untuk input nomor telepon
                            placeholder="e.g., 081238902234"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Tanggal lahir
                        </label>
                        <SingleDatePicker placeholderText="Select date of birth" selectedDate={dateOfBirth ? new Date(dateOfBirth) : null} onChange={(date: any) => setDateOfBirth(date)} onClearFilter={() => setDateOfBirth("")} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>

                    {/* Anniversary Date */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Tanggal Anniversary
                        </label>
                        <SingleDatePicker placeholderText="Select anniversary date" selectedDate={dateAnniv ? new Date(dateAnniv) : null} onChange={(date: any) => setDateAnniv(date)} onClearFilter={() => setDateAnniv("")} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Kategori Pelanggan
                        </label>
                        <Select
                            options={categoryOptions}
                            value={_.find(categoryOptions, { value: selectedCategory?.value }) || null}
                            onValueChange={(opt) => setSelectedCategory(opt)}
                            placeholder="Pilih kategori..."
                            disabled={loadingOptions}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Alamat <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Customer's full address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Detail Information */}
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Detail Pelanggan
                    </label>
                    <textarea
                        rows={4}
                        placeholder="Additional notes or details about the customer"
                        value={detailInformation}
                        onChange={(e) => setDetailInformation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.push("/customers")}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Simpan Pelanggan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}