interface LeaderboardItem { id: number; name: string; total_transaction: number; }

export default function Leaderboard({ title, data }: { title: string, data: LeaderboardItem[] }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
            <ul className="space-y-4">
                {data.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold w-6 text-center ${index < 3 ? 'text-blue-600' : 'text-gray-500'}`}>#{index + 1}</span>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{item.total_transaction} <span className="font-normal text-gray-500">trx</span></p>
                    </li>
                ))}
            </ul>
        </div>
    );
}