"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { endpointUrl, endpointUrlv2, httpPost } from "../../../../helpers";

import SummaryCards from "@/components/dashboard/SummaryCards";
import TotalTransactionCard from "@/components/dashboard/TotalTransactionCard";
import TransactionTrendChart from "@/components/dashboard/TransactionTrendChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import DateRangePicker from "@/components/common/DateRangePicker";
import { Loader2, Calendar } from 'lucide-react';
import SalesLeaderbord from "@/components/dashboard/SalesLeaderboard";
import CustomerLeaderboard from "@/components/dashboard/CustomerLeaderboard";
import ItemTransactionPieChart from "@/components/dashboard/ItemTransactionLeaderboard";
import BirthdayList from "@/components/dashboard/BirthdayList";
import InactiveCustomerList from "@/components/dashboard/InactiveCustomerList";
import PurchaseNameChart from "@/components/dashboard/PurchaseNameChart";
import TotalCustomerFilterCard from "@/components/dashboard/TotalCustomerFilterCard";

interface LeaderboardItem { id: number; name: string; total_transaction: number; phone?: string; }
interface GrafikTransaction { date: string; transaction_count: number; }
interface Transaction { id: number; date: string; name_purchase: string; customer: { name: string }; sales: { name: string }; }

interface DashboardData {
    customer: { count_all: number; count_new_this_month: number; leaderboard: LeaderboardItem[]; three_month_no_transaction: any; birth_day: any; };
    transaction: { count_all: number; list: Transaction[]; total_price_all: number; purchase_name: { purchase_name: string; total: number; }[]; };
    sales: { count_all: number; leaderboard: LeaderboardItem[]; };
    grafik: { transaction: GrafikTransaction[]; };
    item_transaction: { leaderboard: any };
}

export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [role, setRole] = useState<string | null>("null");

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
                endpointUrlv2("/dashboard?" + new URLSearchParams(params).toString()),
                "",
                true
            );
            const responseData = response.data.data;
            setDashboardData(responseData);

        } catch (error: any) {
            console.log(error?.response?.data?.message)
            toast.error(error?.response?.data?.message || "Gagal mengambil data dashboard");
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        getData();
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
            setRole(storedRole);
        }
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50">
                <div className="text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">Tidak ada data untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Ringkasan penjualan dan aktivitas pelanggan Anda.</p>
                </div>
                <DateRangePicker onDatesChange={handleDatesChange} initialStartDate={currentStartDate} initialEndDate={currentEndDate} />
            </div>

            <TransactionTrendChart data={dashboardData.grafik.transaction} />
            {(role === "1" || role == "4" || role == "6" || role == "7" || role == "8") && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <TotalCustomerFilterCard
                                data={dashboardData.customer.count_new_this_month || 0}
                            />
                            <TotalTransactionCard
                                value={dashboardData.transaction.total_price_all || 0}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <RecentTransactions data={dashboardData.transaction.list} />
                        </div>
                    </div>
                </>
            )}
            {role === "2" && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className=" h-full">
                            <TotalTransactionCard
                                value={dashboardData.transaction.total_price_all || 0}
                            />
                        </div>
                        <div className="space-y-6 h-full">
                            <PurchaseNameChart data={dashboardData.transaction.purchase_name} />
                        </div>

                    </div>
                    <RecentTransactions data={dashboardData.transaction.list} />
                </>
            )}
            <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Sepanjang Waktu</h3>
            {(role === "1" || role == "4" || role == "6" || role == "7" || role == "8") && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-full">
                            <SummaryCards data={dashboardData} role={role} />
                        </div>
                        <div className="h-full">
                            <ItemTransactionPieChart data={dashboardData.item_transaction.leaderboard} />
                        </div>
                    </div>
                </>
            )}
            {role === "2" && (
                <>
                    <SummaryCards data={dashboardData} role={role} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-full">

                            <BirthdayList data={dashboardData.customer.birth_day} />
                        </div>
                        <div className="h-full">
                            <ItemTransactionPieChart data={dashboardData.item_transaction.leaderboard} />
                        </div>
                    </div>
                </>
            )}
            {(role === "1" || role == "4" || role == "6" || role == "7" || role == "8") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt--2">
                    <CustomerLeaderboard data={dashboardData.customer.leaderboard} />
                    <SalesLeaderbord data={dashboardData.sales.leaderboard} />
                </div>
            )}
            {role === "2" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt--2">
                    <div className=" h-full">
                        <CustomerLeaderboard data={dashboardData.customer.leaderboard} />
                    </div>
                    <div className=" h-full">
                        <InactiveCustomerList data={dashboardData.customer.three_month_no_transaction} />
                    </div>
                </div>
            )}


        </div>
    );
}