import React from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Users,
  GitBranch,
  Home,
  FileText,
  Settings,
  School,
  LayoutList,
  GitPullRequestArrow,
  List,
  PlusCircle,
  Pin,
  Calendar,
  Database,
  Receipt
} from 'lucide-react';

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  roles: number[]; 
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, roles: number[] }[];
};

export const menuConfig: Record<string, NavItem[]> = {
  menu: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/',
      roles: [1, 2],
    },
    {
      name: 'Transactions',
      icon: <Receipt />,
      path: '/transactions',
      roles: [1, 2],
    },
    {
      name: 'Sales Accounts',
      icon: <Users />,
      path: '/sales-accounts',
      roles: [1],
    },
    {
      name: 'Management Master Data',
      icon: <Database />,
      path: '/master-data',
      roles: [1],
    },
  ], 
};