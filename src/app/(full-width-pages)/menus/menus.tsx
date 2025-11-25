"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Briefcase,
    CalendarClock,
    Car,
    Package,
    ShieldCheck,
    FileText,
    ShoppingCart,
    Wallet,
    BookUser,
} from "lucide-react";
import AppHeader from "@/layout/AppHeader";

const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
};

type ColorKey = keyof typeof colors;

const menuItems: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    href: string;
    color: ColorKey;

}[] = [
        {
            title: "CRM & Sales",
            description: "Kelola hubungan pelanggan dan penjualan Anda.",
            icon: BookUser,
            href: "/dashboard",
            color: "blue",
        },
        {
            title: "Purchasing",
            description: "Kelola pembelian dan pemasok Anda dengan efisien.",
            icon: ShoppingCart,
            href: "/purchasing/dashboard",
            color: "green",
        },
        {
            title: "Admin Panel",
            description: "Kelola pengaturan dan pengguna sistem Anda.",
            icon: ShieldCheck,
            href: "/admin-panel",
            color: "gray",
        },
    ];

interface MenuCardProps {
    title: string;
    description: string | React.ReactNode;
    icon: React.ComponentType<any>;
    href: string;
    color: ColorKey;
    userRole: string | null;
}

const MenuCard: React.FC<MenuCardProps> = ({
    title,
    description,
    icon: Icon,
    href,
    color,
    userRole,
}) => {
    return (
        <Link href={href} className="group block">
            <div
                className={`
                    bg-white dark:bg-gray-800 rounded-2xl shadow p-6 h-full flex flex-col justify-between
                    transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
                <div>
                    <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors[color] ?? "bg-gray-500"
                            }`}
                    >
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mt-4">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Buka Menu →
                </div>
            </div>
        </Link>
    );
};

export default function MenusPage() {
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);


    useEffect(() => {
        const name = localStorage.getItem("name");
        const role = localStorage.getItem("role");
        if (name) setUserName(name);
        if (role) setUserRole(role);
    }, []);
    const filteredMenuItems = menuItems.filter((item) => {
        if (userRole === "8") {
            return item.href === "/dashboard" || item.href === "/admin-panel";
        }
        return true;
    });
    return (
        <div className="min-h-screen xl:flex-center">
            <div
                className={`flex-1 transition-all  duration-300 ease-in-out `}
            >
                <AppHeader />
                <div className="p-4 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                            Selamat Datang, {userName}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Silakan pilih menu yang ingin Anda akses di bawah ini.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMenuItems.map((item) => (
                            <MenuCard key={item.href} {...item} userRole={userRole} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
