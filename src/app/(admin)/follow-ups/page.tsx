import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./follow-ups";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Follow Up | Pantes Gold App",
};


export default function BasicTables() {
    return (
        <div>
            <IndexPage />
        </div>
    );
}
