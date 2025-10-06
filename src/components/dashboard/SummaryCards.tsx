import { Users, ShoppingCart, Package, User } from 'lucide-react';

export default function SummaryCards({ data, role }: { data: any, role: any }) {
  const cards = [
    {
      title: "Total Pelanggan",
      value: data?.customer?.count_all || 0,
      subtitle: "Pelanggan sepanjang masa",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Total Transaksi",
      value: data?.transaction?.count_all || 0,
      subtitle: "Semua transaksi sepanjang masa",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Total Sales",
      value: data?.sales?.count_all || 0,
      subtitle: "Tim sales aktif",
      icon: <User className="w-6 h-6" />,
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Total Barang Terjual",
      value: data?.item_transaction?.count_all || 0,
      subtitle: "Semua barang terjual sepanjang masa",
      icon: <Package className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600"
    }
  ];

  const filteredCards = role === "2"
    ? cards.filter(c => c.title !== "Total Sales")
    : cards;

  const gridCols =
    filteredCards.length === 3
      ? "lg:grid-cols-1"
      : "lg:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-5 h-full`}>
      {filteredCards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.title}</p>
            <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{card.subtitle}</p>
          </div>
          <div className={`p-4 rounded-xl ${card.color}`}>{card.icon}</div>
        </div>
      ))}
    </div>
  );
}

