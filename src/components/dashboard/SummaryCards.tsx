import { Users, ShoppingCart, TrendingUp, Package } from 'lucide-react';
export default function SummaryCards({ data }: { data: any }) {
    const cards = [
        {
            title: "Total Customers",
            value: data?.customer?.count_all || 0,
            subtitle: "All time customers",
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-50 text-blue-600"
        },
        {
            title: "Total Transactions",
            value: data?.transaction?.count_all || 0,
            subtitle: "All time transactions",
            icon: <ShoppingCart className="w-6 h-6" />,
            color: "bg-green-50 text-green-600"
        },
        {
            title: "Total Sales",
            value: data?.sales?.count_all || 0,
            subtitle: "Active sales team",
            icon: <Users className="w-6 h-6" />,
            color: "bg-orange-50 text-orange-600"
        },
        {
            title: "Total Items Sold",
            value: data?.item_transaction?.count_all || 0,
            subtitle: "All time items sold",
            icon: <Package className="w-6 h-6" />,
            color: "bg-purple-50 text-purple-600"
        }
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-full">
            {cards.map((card, index) => (
                <div
                    key={index}
                    // Padding changed from p-8 to p-6, shadow is now smaller (sm)
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex items-center justify-between"
                >
                    <div>
                        {/* Font size and color updated for better hierarchy */}
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.title}</p>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{card.subtitle}</p>
                    </div>
                    {/* New color scheme: light background with a darker icon */}
                    <div className={`p-4 rounded-xl ${card.color}`}>{card.icon}</div>
                </div>
            ))}
        </div>

    );
}