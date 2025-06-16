// file: components/dashboard/SummaryCards.tsx

"use client";
import React from 'react';
import { Briefcase, CheckCircle, Clock, UserPlus, Users, Wrench, AlertCircle } from 'lucide-react';

interface SummaryCardsProps {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions?: number;
  newCustomers: number;
  totalCustomers: number;
  totalMechanics: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = (props) => {
  const {
    totalTransactions,
    completedTransactions,
    pendingTransactions,
    cancelledTransactions = 0,
    newCustomers,
    totalCustomers,
    totalMechanics,
  } = props;

  // Calculate completion rate
  const completionRate = totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Transaction Card - Combined with all statuses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                <Briefcase className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Transactions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This period</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalTransactions}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{completionRate}% completed</p>
            </div>
          </div>

          {/* Transaction Status Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
              </div>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">{completedTransactions}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
              </div>
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{pendingTransactions}</span>
            </div>

            {cancelledTransactions > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Cancelled</span>
                </div>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">{cancelledTransactions}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-600" />
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">All Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
                <Users className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customers</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer base</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalCustomers}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Total customers</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            {/* <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">New Customers</span>
              </div>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">{newCustomers}</span>
            </div> */}

            {/* <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Returning Customers</span>
            </div>
            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalCustomers - newCustomers}</span>
          </div> */}
          </div>
        </div>

        {/* Mechanics Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-lg">
                <Wrench className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mechanics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available workforce</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalMechanics}</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Total mechanics</p>
            </div>
          </div>

          {/* Mechanics Details */}
          <div className="space-y-3">
            {/* <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Available</span>
              </div>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">{Math.max(0, totalMechanics - pendingTransactions)}</span>
            </div> */}

            {/* <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Working</span>
            </div>
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{Math.min(pendingTransactions, totalMechanics)}</span>
          </div> */}
          </div>
        </div>
      </div>
    </>
  );
};