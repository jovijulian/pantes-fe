import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./create-simple"
import React from "react";

export const metadata: Metadata = {
    title: "Title Page | Title App",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Title page" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
