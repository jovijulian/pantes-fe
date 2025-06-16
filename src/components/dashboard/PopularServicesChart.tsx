"use client";
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TooltipProps } from 'recharts';

interface RawServiceData {
    name: string;
}

interface PopularServicesChartProps {
    data: RawServiceData[];
}

const COLORS = [
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{`${label}`}</p>
                <p className="text-sm text-blue-500 dark:text-blue-400">{`Total : ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

export const PopularServicesChart: React.FC<PopularServicesChartProps> = ({ data: rawData }) => {

    const processedData = useMemo(() => {
        if (!rawData || rawData.length == 0) return [];

        const counts = rawData.reduce((acc, service) => {
            acc[service.name] = (acc[service.name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [rawData]);
    const yAxisDomain = useMemo(() => {
        if (!processedData.length) return [0, 10];
        const maxVal = Math.max(...processedData.map(d => d.total));
        return [0, Math.max(maxVal + 2, 10)]; 
    }, [processedData]);
    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                5 Most Popular Service Packages
            </h3>
            <div className="flex-grow" style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                    <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 75 }}>
                        <XAxis
                            dataKey="name"
                            type="category"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            tick={{ fill: 'currentColor' }}
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={10}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            domain={yAxisDomain}
                            tick={{ fill: 'currentColor' }}
                            className="text-gray-600 dark:text-gray-400"
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                            content={<CustomTooltip />}
                        />
                        <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} barSize={25}>
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};