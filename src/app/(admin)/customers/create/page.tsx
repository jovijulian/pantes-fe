import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./create"
import React from "react";

export const metadata: Metadata = {
    title: "Create Customer Data | CRM Pantes Gold",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Customer Data" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
