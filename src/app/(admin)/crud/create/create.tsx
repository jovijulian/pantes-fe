"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useState, useEffect, useCallback } from "react";
import _, { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string;
}

interface Feature {
    id: number;
    name: string;
    type: string;
}

interface Customer {
    id: number;
    owner_name: string;
    phone: string;
    merk: string;
    number_plate: string;
}

interface CreateTransactionData {
    user_id: number;
    feature_id: number;
    number_spk: string;
    customer_id?: number | null;
    number_plate?: string;
    owner_name?: string;
    merk?: string;
    phone?: string;
    notes?: string;
}

export default function CreateTransaction() {
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState<CreateTransactionData>({
        user_id: 0,
        feature_id: 0,
        number_spk: "",
        customer_id: null,
        number_plate: "",
        owner_name: "",
        merk: "",
        phone: "",
        notes: ""
    });

    // Options state
    const [users, setUsers] = useState<User[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [searchingPlate, setSearchingPlate] = useState(false);

    // Customer state
    const [customerFound, setCustomerFound] = useState<Customer | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Generate SPK number
    const generateSPKNumber = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `AA-${dateStr}-${randomNum}`;
    };

    // Load users (mechanics)
    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const params = {
                role_id: 2
            }
            const response = await httpGet(endpointUrl("/mechanic"), true, params);
            console.log(response.data.data)
            setUsers(response.data?.data?.data || []);
        } catch (error) {
            console.error("Failed to load users:", error);
            toast.error("Failed to load mechanics");
        } finally {
            setLoadingUsers(false);
        }
    };

    // Load features
    const loadFeatures = async () => {
        try {
            setLoadingFeatures(true);
            const response = await httpGet(endpointUrl("/feature"), true);
            setFeatures(response?.data?.data?.data || []);
        } catch (error) {
            console.error("Failed to load features:", error);
            toast.error("Failed to load features");
        } finally {
            setLoadingFeatures(false);
        }
    };

    // Search customer by number plate
    const searchCustomerByPlate = async (numberPlate: string) => {
        if (!numberPlate.trim()) {
            setCustomerFound(null);
            setIsNewCustomer(true);
            return;
        }

        try {
            setSearchingPlate(true);
            const form = {
                number_plate: numberPlate.trim()
            }
            const response = await httpPost(endpointUrl(`/customer/number-plate`), form, true);
            if (response.data) {
                setCustomerFound(response.data.data);
                setIsNewCustomer(false);
                // Auto-fill customer data
                setFormData(prev => ({
                    ...prev,
                    customer_id: response.data.data.id,
                    number_plate: response.data.data.number_plate,
                    owner_name: response.data.data.owner_name,
                    phone: response.data.data.phone,
                    merk: response.data.data.merk
                }));
                toast.success("Customer found and data auto-filled!");
            } else {
                setCustomerFound(null);
                setIsNewCustomer(true);
                // Clear customer data
                setFormData(prev => ({
                    ...prev,
                    customer_id: null,
                    owner_name: "",
                    phone: "",
                    merk: ""
                }));
                toast.info("Customer not found. Please fill customer details.");
            }
        } catch (error) {
            setCustomerFound(null);
            setIsNewCustomer(true);
            // Clear customer data
            setFormData(prev => ({
                ...prev,
                customer_id: null,
                owner_name: "",
                phone: "",
                merk: ""
            }));
            toast.info("Customer not found. Please fill customer details.");
        } finally {
            setSearchingPlate(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((numberPlate: string) => {
            searchCustomerByPlate(numberPlate);
        }, 500),
        []
    );

    // Handle number plate change
    const handleNumberPlateChange = (value: string) => {
        setFormData(prev => ({ ...prev, number_plate: value }));
        debouncedSearch(value);
    };

    // Handle form field changes
    const handleFieldChange = (field: keyof CreateTransactionData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user_id || !formData.feature_id || !formData.number_spk) {
            toast.error("Please fill all required fields");
            return;
        }

        if (isNewCustomer && !formData.number_plate) {
            toast.error("Number plate is required for new customer");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                user_id: formData.user_id,
                feature_id: formData.feature_id,
                number_spk: formData.number_spk,
                customer_id: formData.customer_id ?? null,
                // ...(formData.customer_id && { customer_id: formData.customer_id || null }),
                ...(formData.number_plate && { number_plate: formData.number_plate }),
                ...(formData.owner_name && { owner_name: formData.owner_name }),
                ...(formData.merk && { merk: formData.merk }),
                ...(formData.phone && { phone: formData.phone }),
                ...(formData.notes && { notes: formData.notes })
            };

            await httpPost(endpointUrl("/transaction"), payload, true);
            toast.success("Transaction created successfully!");
            router.push("/transaction");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create transaction");
        } finally {
            setLoading(false);
        }
    };

    // Initialize data
    useEffect(() => {
        loadUsers();
        loadFeatures();
        setFormData(prev => ({ ...prev, number_spk: generateSPKNumber() }));
    }, []);

    const userOptions = users.map(user => ({ value: user.id.toString(), label: `${user.name} (${user.phone})` }));
    const featureOptions = features.map(feature => ({ value: feature.id.toString(), label: `${feature.name} - ${feature.type}` }));

    return (
        <ComponentCard title="Create New Transaction">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Information */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm mr-2">Required</span>
                        Transaction Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Mechanic *
                            </label>
                            <Select
                                onValueChange={(selectedOption) => {
                                    handleFieldChange('user_id', parseInt(selectedOption.value));
                                }}
                                placeholder={loadingUsers ? "Loading mechanics..." : "Select mechanic"}
                                value={_.find(userOptions, { value: formData.user_id.toString() })}
                                options={userOptions}
                                disabled={loadingUsers}
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Feature/Service *
                            </label>
                            <Select
                                onValueChange={(selectedOption) => {
                                    handleFieldChange('feature_id', parseInt(selectedOption.value));
                                }}
                                placeholder={loadingFeatures ? "Loading features..." : "Select feature"}
                                value={_.find(featureOptions, { value: formData.feature_id.toString() })}
                                options={featureOptions}
                                disabled={loadingFeatures}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                SPK Number *
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    defaultValue={formData.number_spk}
                                    onChange={(e) => handleFieldChange('number_spk', e.target.value)}
                                    placeholder="SPK Number"
                                    required
                                />
                                {/* <button
                                    type="button"
                                    onClick={() => handleFieldChange('number_spk', generateSPKNumber())}
                                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 whitespace-nowrap"
                                >
                                    Generate
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Customer Information
                    </h3>

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Number Plate
                        </label>
                        <div className="relative">
                            <Input
                                type="text"
                                defaultValue={formData.number_plate || customerFound?.number_plate || ""}
                                onChange={(e) => handleNumberPlateChange(e.target.value)}
                                placeholder="e.g., D 5057 UCE"
                                className="pr-10"
                            />
                            {searchingPlate && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Enter number plate to search existing customer or leave empty for new customer
                        </p>
                    </div>

                    {/* Customer Status Indicator */}
                    {formData?.number_plate?.trim() && (
                        <div className="mt-4 p-3 rounded-lg border">
                            {customerFound ? (
                                <div className="flex items-center text-green-700 dark:text-green-300">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Existing Customer Found</span>
                                </div>
                            ) : isNewCustomer ? (
                                <div className="flex items-center text-blue-700 dark:text-blue-300">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">New Customer - Please fill details below</span>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Customer Details Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Owner Name
                            </label>
                            <Input
                                type="text"
                                defaultValue={formData.owner_name || customerFound?.owner_name || ""}
                                onChange={(e) => handleFieldChange('owner_name', e.target.value)}
                                placeholder="Customer name"
                                disabled={!!customerFound}
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Phone Number
                            </label>
                            <Input
                                type="text"
                                defaultValue={formData.phone || customerFound?.phone || ""}
                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                placeholder="08221864729"
                                disabled={!!customerFound}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Vehicle Brand/Merk
                            </label>
                            <Input
                                type="text"
                                defaultValue={formData.merk || customerFound?.merk || ""}
                                onChange={(e) => handleFieldChange('merk', e.target.value)}
                                placeholder="e.g., Honda, Yamaha, Suzuki"
                                disabled={!!customerFound}
                            />
                        </div>
                    </div>

                    {customerFound && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Customer data has been automatically filled from existing records.
                                Fields are disabled to maintain data consistency.
                            </p>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Additional Notes
                    </h3>

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Notes *
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            placeholder="Additional notes or special instructions..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Summary Preview */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Transaction Summary:</h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <div>SPK: <span className="font-mono">{formData.number_spk}</span></div>
                        <div>Mechanic: {_.find(users, { id: formData.user_id })?.name || "Not selected"}</div>
                        <div>Service: {_.find(features, { id: formData.feature_id })?.name || "Not selected"}</div>
                        <div>Customer: {customerFound ? "Existing" : "New"} {formData.owner_name && `- ${formData.owner_name}`}</div>
                        {formData.number_plate && <div>Vehicle: {formData.number_plate} {formData.merk && `(${formData.merk})`}</div>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => router.push("/transaction")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Creating..." : "Create Transaction"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}