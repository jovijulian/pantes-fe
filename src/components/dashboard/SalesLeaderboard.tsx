import React from 'react';
import { Award, TrendingUp, Trophy } from 'lucide-react';

export default function SalesLeaderbord({ data }: { data: any }) {
    const salesTeam = data || [];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Sales Performance</h3>
                </div>
                <p className="text-sm text-slate-500 ml-12">Top performing sales team members</p>
            </div>
            
            <div className="space-y-4">
                {salesTeam.length > 0 ? salesTeam.map((sales: any, index: any) => (
                    <div key={sales.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                        index === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                }`}>
                                {index === 0 ? <Award className="w-5 h-5" /> : index + 1}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{sales.name}</h4>
                                <p className="text-xs text-gray-500">Sales Representative</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">{sales.total_transaction}</p>
                            <p className="text-xs text-gray-500">Transactions</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No sales data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}