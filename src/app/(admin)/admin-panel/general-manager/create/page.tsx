import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import CreatePage from "./create"
import React from "react";

export const metadata: Metadata = {
    title: "Create General Manager Data | Pantes Gold App",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Tambahkan General Manager" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
