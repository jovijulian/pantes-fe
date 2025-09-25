import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import IndexPage from "./transactions"
import React from "react";

export const metadata: Metadata = {
    title: "Transactions | CRM Pantes Gold",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Transactions" />
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
