import { Users, ShoppingCart, Award, Calendar, Package } from 'lucide-react';

interface Transaction {
  id: number;
  date: string;
  name_purchase: string;
  customer: { name: string };
  sales: { name: string };
}

export default function RecentTransactions({ data }: { data: Transaction[] }) {
  const transactions = data || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
        </div>
        <p className="text-sm text-slate-500 ml-12">Latest transactions</p>
      </div>


      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {transactions.length > 0 ? transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 bg-slate-50 border-2 border-slate-100 rounded-lg hover:bg-slate-100 hover:border-slate-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 text-base">
                {transaction.name_purchase}
              </h4>
              <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                Completed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <Users className="w-4 h-4 mr-2 text-slate-400" />
                <span className="font-medium text-slate-500">Customer:</span>
                <span className="ml-2 text-slate-700 font-medium">
                  {transaction.customer?.name}
                </span>
              </div>

              <div className="flex items-center text-sm text-slate-600">
                <Award className="w-4 h-4 mr-2 text-slate-400" />
                <span className="font-medium text-slate-500">Sales:</span>
                <span className="ml-2 text-slate-700 font-medium">
                  {transaction.sales?.name}
                </span>
              </div>

              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <span className="font-medium text-slate-500">Date:</span>
                <span className="ml-2 text-slate-700 font-medium">
                  {new Date(transaction.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-slate-400">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-medium">No transactions available</p>
            <p className="text-sm mt-1">Recent transactions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}