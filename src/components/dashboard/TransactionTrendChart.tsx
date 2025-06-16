"use client";
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string;
    transaction_count: number;
}

interface TransactionTrendChartProps {
    data: ChartData[];
    startDate: string; 
    endDate: string;   
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = new Date(label + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return (
            <div className="p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <p className="font-semibold text-base">{formattedDate}</p>
                <p className="text-sm text-blue-500 dark:text-blue-400">{`Total: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const formatXAxis = (tickItem: string) => {
    const [year, month, day] = tickItem.split('-');
    return `${day}/${month}`;
};

const getTickInterval = (dataLength: number) => {
    if (dataLength <= 7) return 0; 
    if (dataLength <= 14) return 1; 
    if (dataLength <= 31) return Math.ceil(dataLength / 7) - 1; 
    return Math.ceil(dataLength / 10) - 1; 
};

export const TransactionTrendChart: React.FC<TransactionTrendChartProps> = ({ data, startDate, endDate }) => {

    const processedData = useMemo(() => {
        if (!startDate || !endDate) {
            return [];
        }
        const dataMap = new Map(data.map(item => [item.date, item.transaction_count]));
        const filledData: ChartData[] = [];
        const start = new Date(startDate + 'T00:00:00Z');
        const end = new Date(endDate + 'T00:00:00Z');
        const current = new Date(start);

        while (current <= end) {
            const dateString = current.toISOString().split('T')[0];
            filledData.push({
                date: dateString,
                transaction_count: dataMap.get(dateString) || 0,
            });
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return filledData;
    }, [data, startDate, endDate]);
  
  

    const tickInterval = useMemo(() => getTickInterval(processedData.length), [processedData.length]);
    const yAxisDomain = useMemo(() => {
        if (!processedData.length) return [0, 10];
        const maxVal = Math.max(...processedData.map(d => d.transaction_count));
        return [0, Math.max(maxVal + 2, 10)]; 
    }, [processedData]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Transaction Activity Trends</h3>
            <div className="flex-grow" style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart 
                        data={processedData} 
                        margin={{ top: 50, right: 30, left: 20, bottom: 0 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            strokeOpacity={0.2} 
                            stroke="rgb(156 163 175)" 
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            stroke="rgb(156 163 175)"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                            interval={tickInterval}
                            height={60}
                            tick={{ fontSize: 11 }}
                            
                        />
                        <YAxis 
                            stroke="rgb(156 163 175)" 
                            fontSize={12} 
                            allowDecimals={false}
                            domain={yAxisDomain}
                            width={50}
                            label={{ 
                                value: 'Total', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { 
                                    textAnchor: 'middle',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    fill: 'rgb(75 85 99)'
                                }
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                        />
                        <Line
                            type="monotone"
                            dataKey="transaction_count"
                            name="Date"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                            activeDot={{ 
                                r: 6, 
                                strokeWidth: 2, 
                                fill: '#fff', 
                                stroke: '#3b82f6',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};