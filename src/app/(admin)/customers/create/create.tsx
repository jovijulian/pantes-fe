"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import { endpointUrl, httpPost } from "@/../helpers";
import SingleDatePicker from "@/components/common/SingleDatePicker";
import moment from "moment";

export default function CreateCustomerForm() {
    const router = useRouter();

    const [numberMember, setNumberMember] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [dateAnniv, setDateAnniv] = useState("");
    const [detailInformation, setDetailInformation] = useState("");
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!numberMember || !name || !phone) {
            toast.error("Please fill in the customer's name and phone number.");
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
        };

        try {
            setLoading(true);
            await httpPost(endpointUrl("/customer"), payload, true);
            toast.success("Customer added successfully!");
            router.push("/customers");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add customer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Add New Customer">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Member Number */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Member Number <span className="text-red-400 ml-1">*</span>
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
                            Customer Name <span className="text-red-400 ml-1">*</span>
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
                            Phone Number <span className="text-red-400 ml-1">*</span>
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
                            Date of Birth
                        </label>
                        <SingleDatePicker placeholderText="Select date of birth" selectedDate={dateOfBirth ? new Date(dateOfBirth) : null} onChange={(date: any) => setDateOfBirth(date)} onClearFilter={() => setDateOfBirth("")} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>

                    {/* Anniversary Date */}
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Anniversary Date
                        </label>
                        <SingleDatePicker placeholderText="Select anniversary date" selectedDate={dateAnniv ? new Date(dateAnniv) : null} onChange={(date: any) => setDateAnniv(date)} onClearFilter={() => setDateAnniv("")} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Address <span className="text-red-400 ml-1">*</span>
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
                        Customer Details
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
                        {loading ? "Saving..." : "Save Customer"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}