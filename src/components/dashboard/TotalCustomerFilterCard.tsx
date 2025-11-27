"use client";
import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { DollarSign, User, Users } from "lucide-react";

interface TotalCustomerFilterCardProps {
  data: number;
}


export default function TotalCustomerFilterCard({ data }: TotalCustomerFilterCardProps) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2 ">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Total Pelanggan</h3>
              <p className="text-sm text-slate-500">Total pelanggan pada periode</p>
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
          {data}
        </p>
      </div>
      <div />
    </div>
  );
}