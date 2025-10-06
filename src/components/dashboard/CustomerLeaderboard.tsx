import React from 'react';
import { Users, Phone, Trophy } from 'lucide-react';

export default function CustomerLeaderboard({ data }: { data: any }) {
    const customers = data || [];


    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Top Pelanggan</h3>
                </div>
                <p className="text-sm text-slate-500 ml-12">Diurutkan berdasarkan jumlah total transaksi</p>
            </div>

            <div className="space-y-4">
                {customers.length > 0 ? customers.map((customer: any, index: any) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{customer.name}</h4>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {customer.phone}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">{customer.total_transaction}</p>
                            <p className="text-xs text-gray-500">Transaksi</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Tidak ada data pelanggan yang tersedia</p>
                    </div>
                )}
            </div>
        </div>
    );
}