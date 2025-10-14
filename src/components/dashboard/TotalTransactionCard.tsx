"use client";
import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { DollarSign } from "lucide-react";

interface TotalTransactionCardProps {
  value: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(amount);

export default function TotalTransactionCard({ value }: TotalTransactionCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplayValue(latest);
      }
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2 ">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Total Nilai Transaksi</h3>
              <p className="text-sm text-slate-500">Akumulasi seluruh transaksi pada periode</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center my-4 md:my-8">
        <p
          className="
            font-extrabold 
            text-gray-800 dark:text-white 
            tracking-tight 
            break-words 
            text-2xl sm:text-3xl md:text-4xl lg:text-5xl
            max-w-full
            leading-tight
            overflow-hidden text-ellipsis
          "
          style={{
            wordBreak: "break-word",
            lineHeight: 1.1,
          }}
        >
          {formatCurrency(displayValue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total nilai transaksi (IDR)</p>
      </div>
      <div />
    </div>
  );
}