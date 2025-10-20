"use client";
import React from 'react';
import Link from 'next/link';
import { Cake, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import moment from 'moment';

interface Customer { id: number; name: string; phone: string; date_of_birth: string; }

export default function BirthdayList({ data }: { data: Customer[] }) {
    const router = useRouter();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2 ">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                            <Cake className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Ulang Tahun Bulan Ini</h3>
                            <p className="text-sm text-slate-500">Pelanggan yang berulang tahun pada bulan ini</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {data && data.length > 0 ? (
                    data.map((customer, index) => (
                        <>
                            <div
                                key={customer.id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
                                onClick={() => router.push(`/customers/${customer.id}`)} 
                            >
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{customer.name} </h4>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <Phone className="w-3 h-3 mr-1.5" />
                                            {customer.phone}

                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Tanggal Lahir: {moment(customer.date_of_birth).format('DD MMMM')}
                                        </div>
                                    </div>

                                </div>
                                <Cake className="w-5 h-5 text-pink-400 flex-shrink-0" />
                            </div>
                        </>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Cake className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada pelanggan yang berulang tahun hari ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}