import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import EditPage from "./edit"
import React from "react";

export const metadata: Metadata = {
    title: "Edit Customer | CRM Pantes Gold",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Halaman Edit" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <EditPage />
                </div>
            </div>
        </div>
    );
}
