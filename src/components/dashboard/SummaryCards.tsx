import { Users, ShoppingCart, TrendingUp } from 'lucide-react';
export default function SummaryCards({ data }: { data: any }) {
    const cards = [
        {
            title: "Total Customers",
            value: data?.customer?.count_all || 0,
            subtitle: `${data?.customer?.count_new_this_month || 0} new this month`,
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
            color: "bg-purple-50 text-purple-600"
        },
        {
            title: "Growth Rate",
            value: "12%",
            subtitle: "This month vs last",
            icon: <TrendingUp className="w-6 h-6" />,
            color: "bg-orange-50 text-orange-600"
        }
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${card.color}`}>
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}