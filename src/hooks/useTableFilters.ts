"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function useTableFilters<T extends Record<string, any>>(defaultFilters: T) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState<T>(() => {
        const initialState = { ...defaultFilters };
        
        Object.keys(defaultFilters).forEach((key) => {
            const paramValue = searchParams.get(key);
            if (paramValue !== null) {
                if (typeof defaultFilters[key] === "number") {
                    (initialState as any)[key] = Number(paramValue);
                } else {
                    (initialState as any)[key] = paramValue;
                }
            }
        });
        
        return initialState;
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            Object.keys(filters).forEach((key) => {
                const val = filters[key];
                const defaultVal = defaultFilters[key];
                if (val !== defaultVal && val !== "" && val !== null && val !== undefined) {
                    params.set(key, String(val));
                } else {
                    params.delete(key);
                }
            });

            const newQuery = params.toString();
            const currentQuery = searchParams.toString();

            if (newQuery !== currentQuery) {
                const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
                router.replace(newUrl, { scroll: false });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, pathname, router, searchParams, defaultFilters]);

    const setFilter = (key: keyof T, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return { filters, setFilter, setFilters };
}