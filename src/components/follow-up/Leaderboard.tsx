"use client";

import React from "react";
import { Users, Phone, Trophy, Briefcase, TrendingUp } from "lucide-react";

interface LeaderboardProps {
    sales: { id: number; name: string; total_follow_up: number }[];
    customers: { id: number; name: string; total_follow_up: number; phone: string }[];
    role: number | null;
}

export default function Leaderboard({ sales, customers, role }: LeaderboardProps) {
    return (
        <>
            <div className={role === 2 ? "lg:col-span-2" : ""}>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
                    <div className="mb-6 pb-4 border-b border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pelanggan Follow Up Terbanyak</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-gray-400 ml-12">
                            Berdasarkan frekuensi follow up tertinggi
                        </p>
                    </div>

                    <div className="space-y-4 flex-1">
                        {customers.length > 0 ? (
                            customers.slice(0, 5).map((customer, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 cursor-default transition-colors border border-transparent hover:border-slate-200 dark:hover:border-gray-600"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{customer.name}</h4>
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                <Phone className="w-3.5 h-3.5 mr-1.5" />
                                                {customer.phone || "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{customer.total_follow_up}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Follow Up</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Tidak ada data pelanggan</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {role !== 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
                    <div className="mb-6 pb-4 border-b border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sales Follow Up Terbanyak</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-gray-400 ml-12">
                            Peringkat sales berdasarkan aktivitas follow up
                        </p>
                    </div>

                    <div className="space-y-4 flex-1">
                        {sales.length > 0 ? (
                            sales.slice(0, 5).map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 cursor-default transition-colors border border-transparent hover:border-slate-200 dark:hover:border-gray-600"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{item.total_follow_up}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Aktivitas</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Tidak ada data sales</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </>
    );
}