"use client";
import { Package } from 'lucide-react';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LeaderboardItem {
    value: string;
    total_transaction: number;
}

interface Props {
    data: LeaderboardItem[];
}

// A professional and soft color palette
const COLORS = ['#3b82f6', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show percentage label if it's large enough to be readable
    if (percent * 100 < 5) {
        return null;
    }

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function ItemTransactionPieChart({ data }: Props) {
    // Filter out items with 0 transactions and map to the format recharts expects
    const chartData = data
        .filter(item => item.total_transaction > 0)
        .map(item => ({
            name: item.value,
            value: item.total_transaction,
        }));

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border h-full flex items-center justify-center">
                <p className="text-gray-500">Tidak ada data transaksi item untuk ditampilkan.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Barang Populer</h3>
                            <p className="text-sm text-slate-500">
                                Barang yang paling sering terjual
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [`${value} transactions`, name]}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                        />
                        <Legend
                            iconSize={10}
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}