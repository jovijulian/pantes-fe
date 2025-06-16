// file: components/dashboard/MechanicLeaderboard.tsx

"use client";
import React from 'react';
import { Check, Star } from 'lucide-react';

interface LeaderboardData {
  id: number;
  name: string;
  total_transaction: number;
}

interface MechanicLeaderboardProps {
  data: LeaderboardData[];
}

export const MechanicLeaderboard: React.FC<MechanicLeaderboardProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top 5 Productive Mechanics</h3>
      <ul className="space-y-3">
        {data.map((mechanic, index) => (
          <li key={mechanic.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-center gap-3">
              <span className={`font-bold text-gray-500 ${index < 3 ? 'text-green-500' : ''}`}>{index + 1}</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{mechanic.name}</p>
            </div>
             <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
               <Check className="h-4 w-4 text-green-500"/>
               <span>{mechanic.total_transaction} Done</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};