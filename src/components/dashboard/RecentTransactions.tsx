import { Users, ShoppingCart, Award, Calendar, Package } from 'lucide-react';
import moment from 'moment';
import { FaMoneyBillWave } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
interface Transaction {
  id: number;
  date: string;
  name_purchase: string;
  customer: { name: string };
  sales: { name: string };
}

export default function RecentTransactions({ data }: { data: Transaction[] }) {
  const transactions = data || [];
  const router = useRouter();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FaMoneyBillWave className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Aktivitas Terbaru</h3>
              <p className="text-sm text-slate-500">Transaksi terbaru</p>
            </div>
          </div>
        </div>

      </div>

      <div className="space-y-1">
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <div>
              <div
                key={transaction.id}
                onClick={() => router.push(`/transactions/${transaction.id}`)}
                className="flex items-center justify-between p-3 mt-2 bg-slate-50 border-2 border-slate-100 rounded-lg hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer transition-colors"
              >
                {/* Left side: Icon and Main Info */}
                <div className="flex items-center gap-4 min-w-0"> 
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <ShoppingCart className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      Pelanggan: {transaction.customer?.name} ({transaction.name_purchase})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {`by ${transaction.sales?.name}`}
                    </p>
                  </div>
                </div>

                {/* Right side: Date */}
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {moment(transaction.date).format('DD MMM')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {moment(transaction.date).format('YYYY')}
                  </p>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            {/* Empty state */}
            <p>Tidak ada transaksi terkini yang ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}