"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import { endpointUrl, httpGet, httpPost, httpPut } from "@/../helpers";
import moment from "moment";
import SingleDatePicker from "@/components/common/SingleDatePicker";

export default function EditCustomerForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    // State untuk setiap field form
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [dateAnniv, setDateAnniv] = useState("");
    const [detailInformation, setDetailInformation] = useState("");
    const [viewingMonthDateBirth, setViewingMonthDateBirth] = useState(new Date());
    const [viewingMonthDateAnniv, setViewingMonthDateAnniv] = useState(new Date());
    // State loading: satu untuk fetch data awal, satu untuk proses submit
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // --- Efek untuk mengambil data customer saat halaman dimuat ---
    useEffect(() => {
        if (!id) return;

        const getCustomerData = async () => {
            try {
                const response = await httpGet(endpointUrl(`/customer/${id}`), true);
                const customer = response.data.data;

                // Isi state dengan data yang ada
                setName(customer.name || "");
                setPhone(customer.phone || "");
                setAddress(customer.address || "");
                // Pastikan format tanggal YYYY-MM-DD untuk input type="date"
                setDateOfBirth(customer.date_of_birth ? customer.date_of_birth.split('T')[0] : "");
                setDateAnniv(customer.date_anniv ? customer.date_anniv.split('T')[0] : "");
                setDetailInformation(customer.detail_information || "");

            } catch (error) {
                toast.error("Failed to fetch customer data.");
                router.push("/customers"); // Kembali jika data tidak ditemukan
            } finally {
                setInitialLoading(false);
            }
        };

        getCustomerData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !phone) {
            toast.error("Please fill in the customer's name and phone number.");
            return;
        }

        const payload = {
            name,
            phone,
            address,
            date_of_birth: dateOfBirth ? moment(dateOfBirth).format("YYYY-MM-DD") : null,
            date_anniv: dateAnniv ? moment(dateAnniv).format("YYYY-MM-DD") : null,
            detail_information: detailInformation,
        };

        try {
            setLoading(true);
            await httpPost(endpointUrl(`/customer/${id}/update`), payload, true);
            toast.success("Customer updated successfully!");
            router.push("/customers");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update customer.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="text-center p-10">Loading form...</div>;
    }

    return (
        <ComponentCard title="Edit Customer">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ... (Isi form sama persis dengan halaman create) ... */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Customer Name <span className="text-red-400">*</span></label>
                        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Phone Number <span className="text-red-400">*</span></label>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Date of Birth</label>
                        <SingleDatePicker placeholderText="Select date of birth" selectedDate={dateOfBirth ? new Date(dateOfBirth) : null} onChange={(date: any) => setDateOfBirth(date)} onClearFilter={() => setDateOfBirth("")} viewingMonthDate={viewingMonthDateBirth} onMonthChange={setViewingMonthDateBirth} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Anniversary Date</label>
                        <SingleDatePicker placeholderText="Select anniversary date" selectedDate={dateAnniv ? new Date(dateAnniv) : null} onChange={(date: any) => setDateAnniv(date)} onClearFilter={() => setDateAnniv("")} viewingMonthDate={viewingMonthDateAnniv} onMonthChange={setViewingMonthDateAnniv} />
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-1">Address</label>
                    <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                    <label className="block font-medium mb-1">Detail Information</label>
                    <textarea rows={4} value={detailInformation} onChange={(e) => setDetailInformation(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={() => router.push("/customers")} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Updating..." : "Update Customer"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}