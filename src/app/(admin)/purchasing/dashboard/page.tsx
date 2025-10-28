import type { Metadata } from "next";
import React from "react";
import Dashboard from "./dashboard";

export const metadata: Metadata = {
    title:
        "Dashboard | Pantes Gold App",
};

export default function Ecommerce() {
    return (
        <>
            <Dashboard />
        </>
    );
}
