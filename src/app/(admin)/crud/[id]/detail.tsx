"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Table from "@/components/tables/Table";
import { FaEdit, FaListAlt, FaTag, FaTrash } from "react-icons/fa";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import { useParams } from 'next/navigation';
import { endpointUrl, httpGet } from "../../../../../helpers";
import { set } from "lodash";
interface TableDataItem {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: number;
    created_at: string;
    updated_at: string;
}

export default function MechanicDetailPage() {
    const [data, setData] = useState<TableDataItem | null>(null);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);


    const getDetail = async (id: number) => {
        try {
            const response = await httpGet(endpointUrl(`mechanic/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching mechanic details:", error);
        }
    };
    useEffect(() => {
        if (id) getDetail(id);
    }, [id]);


    if (!data) return <p className="text-center mt-10 text-gray-400">Loading...</p>;
    return (
        <ComponentCard title="Mechanic Detail">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-blue-700">
                    <FaTag className="text-blue-500 w-5 h-5" />
                    <h3 className="text-xl font-semibold">Mechanic Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-800">
                    <div>
                        <span className="block text-gray-500 text-md">Name</span>
                        <span className="font-medium text-lg">{data.name}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-md">Phone</span>
                        <span className="font-medium text-lg">{data.phone}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-md">Email</span>
                        <span className="font-medium text-lg">{data.email}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-md">Status</span>
                        <span className={`font-medium text-lg ${data.status == 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.status == 1 ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

        </ComponentCard >
    );

}
