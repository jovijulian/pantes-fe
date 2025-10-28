import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./customers";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Customers | Pantes Gold App",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Pelanggan" />
            <div className="space-y-6">
                <div
                    className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]`}
                >
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
                        <div className="space-y-6"><IndexPage /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
