"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tags } from 'lucide-react';

interface PurchaseNameData {
    purchase_name: string;
    total: number;
}

export default function PurchaseNameChart({ data }: { data: PurchaseNameData[] }) {
    const chartData = data
        .filter(item => item.total > 0)
        .map(item => ({
            name: item.purchase_name,
            count: item.total,
        }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                            <Tags className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rincian Nama Pembelian</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total transaksi berdasarkan nama pembelian
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-70">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }} />
                            <Bar dataKey="count" fill="#2dd4bf" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada data nama pembelian untuk ditampilkan.</p>
                )}
            </div>
        </div>
    );
}