// file: app/dashboard/page.tsx
"use client";
import { Metadata } from "next";
import React, { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionTrendChart } from "@/components/dashboard/TransactionTrendChart";
import { PopularServicesChart } from "@/components/dashboard/PopularServicesChart";
import { CustomerLeaderboard } from "@/components/dashboard/CustomerLeaderboard";
import { MechanicLeaderboard } from "@/components/dashboard/MechanicLeaderboard";
import { useRouter, useSearchParams } from "next/navigation";
import DateRangePicker from "@/components/common/DateRangePicker";
import { endpointUrl, httpGet, httpPost } from "../../../helpers";
import toast from "react-hot-toast";
import moment from "moment";

interface CustomerLeaderboard {
    id: number;
    name: string;
    number_plate: string;
    total_transaction: number;
}

interface Customer {
    id: number;
    number_plate: string;
    owner_name: string;
    merk: string;
    phone: string;
    status: number;
    created_at: string;
    updated_at: string;
}

interface Feature {
    id: number;
    type: string;
    name: string;
    status: number;
    created_at: string;
    updated_at: string;
}

interface MechanicLeaderboard {
    id: number;
    name: string;
    total_transaction: number;
}

interface Mechanic {
    id: number;
    role_id: number;
    email: string;
    name: string;
    phone: string;
    token: string | null;
    url_image: string | null;
    status: number;
    created_at: string;
    updated_at: string;
}

interface TransactionDetailValue {
    id: number;
    transaction_id: number;
    transaction_detail_id: number;
    value: string;
    status: number;
    created_at: string;
    updated_at: string | null;
    full_url: string;
}

interface TransactionDetail {
    id: number;
    transaction_id: number;
    feature_id: number;
    feature_field_id: number;
    feature_field_value_type: number;
    user_id: number;
    customer_id: number;
    step: number;
    number_plate: string;
    label: string;
    notes: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    feature: Feature;
    transaction_detail_value: TransactionDetailValue[];
}

// /data/transaction/list
interface Transaction {
    id: number;
    user_id: number;
    customer_id: number;
    number_spk: string;
    number_plate: string;
    notes: string | null;
    is_done: number;
    status: number;
    created_at: string;
    updated_at: string;
    mechanic: Mechanic;
    customer: Customer;
    transaction_detail: TransactionDetail[];
}

// /data/grafik/transaction



interface CustomerData {
    list: Customer[];
    count_all: number;
    count_new_this_month: number;
    leaderboard: CustomerLeaderboard[];
}

interface FeatureData {
    list: Feature[];
    count_all: number;
}

interface TransactionData {
    list: Transaction[];
    count_all: number;
    on_progress: number;
    completed: number;
    canceled: number;
}

interface MechanicData {
    list: Mechanic[];
    count_all: number;
    leaderboard: MechanicLeaderboard[];
}

interface GrafikTransaction {
    date: string;
    transaction_count: number;
}

interface GrafikData {
    transaction: GrafikTransaction[];
}

interface Data {
    customer: CustomerData;
    feature: FeatureData;
    transaction: TransactionData;
    mechanic: MechanicData;
    grafik: GrafikData;
}


export const metadata: Metadata = {
    title: "Dashboard | CRM Pantes Gold",
};

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<Data | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);

        const params: any = {
        };
        if (currentStartDate) params.start_date = currentStartDate;
        if (currentEndDate) params.end_date = currentEndDate;

        try {
            const response = await httpPost(
                endpointUrl("/dashboard?" + new URLSearchParams(params).toString()),
                "",
                true
            );
            const responseData = response.data.data as Data;
            setDashboardData(responseData);

        } catch (error) {
            toast.error("Failed to fetch data");
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        getData();
    }, [searchParams]);
    const handleDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        if (dates.startDate) {
            currentParams.set("start_date", dates.startDate);
        } else {
            currentParams.delete("start_date");
        }
        if (dates.endDate) {
            currentParams.set("end_date", dates.endDate);
        } else {
            currentParams.delete("end_date");
        }
        router.push(`?${currentParams.toString()}`);
    }
    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Bagian Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard </h1>
                </div>

            </div>

            <div className="w-full">
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD")}
                    initialEndDate={searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD")}
                />
            </div>

        </div>
    );
}