"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FollowUpChartProps {
    data: { date: string; follow_up_count: number | string }[];
}

export default function FollowUpChart({ data }: FollowUpChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Jumlah Follow Up',
      data: data.map(d => Number(d.follow_up_count)),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
      fill: true,
      tension: 0.4, 
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false 
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)', 
        },
        ticks: {
            stepSize: 1 
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tren Aktivitas Follow Up</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ikhtisar volume follow up dalam periode</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}