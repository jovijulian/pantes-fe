"use client";

import { PhoneCall, Pointer } from "lucide-react";
import React from "react";
import { FaClipboardList, FaUsers, FaUserTie } from "react-icons/fa";

interface StatProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

interface SummaryStatsProps {
    data: any;
}

export default function SummaryStats({ data }: SummaryStatsProps) {
    const cards = [
        {
          title: "Total Follow Up",
          value: data?.follow_up?.count_follow_up || 0,
          subtitle: "Total follow up tercatat",
          icon: <Pointer className="w-6 h-6" />,
          color: "bg-blue-50 text-blue-600"
        },
        {
          title: "Pelanggan Dihubungi",
          value: data?.follow_up?.count_customer_follow_up || 0,
          subtitle: "Pelanggan yang sudah dihubungi",
          icon: <PhoneCall className="w-6 h-6" />,
          color: "bg-green-50 text-green-600"
        },
        {
          title: "Total Keseluruhan Pelanggan",
          value: data?.customer?.count_customer || 0,
          subtitle: "Jumlah pelanggan terdaftar",
          icon: <FaUsers className="w-6 h-6" />,
          color: "bg-orange-50 text-orange-600"
        },
       
      ];
    
      return (
        <div className={`grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-5 h-full`}>
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{card.subtitle}</p>
              </div>
              <div className={`p-4 rounded-xl ${card.color}`}>{card.icon}</div>
            </div>
          ))}
        </div>
      );
}