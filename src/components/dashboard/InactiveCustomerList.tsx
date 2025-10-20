"use client";
import React from 'react';
import Link from 'next/link';
import { UserX, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Customer { id: number; name: string; phone: string; }

export default function InactiveCustomerList({ data }: { data: Customer[] }) {
    const router = useRouter();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pelanggan Tidak Aktif</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">Pelanggan yang tidak bertransaksi selama 3 bulan</p>
            </div>

            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {data && data.length > 0 ? (
                    data.map((customer, index) => (
                        <div
                            key={customer.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full font-semibold text-sm">
                                    {index + 1}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{customer.name}</h4>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Phone className="w-3 h-3 mr-1.5" />
                                        {customer.phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <UserX className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada pelanggan yang tidak aktif selama 3 bulan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}