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
  Receipt,
  CircleUserRound,
  ShieldUser,
  Truck,
  Building2,
  Package,
  CreditCard,
  Navigation,
  UserCog,
  Archive,
  Gem,
  Coins,
  Diamond,
} from 'lucide-react';

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string; 
  roles: number[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, roles: number[] }[];
};

export const menuConfig: Record<string, NavItem[]> = {
  menu: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/dashboard',
      roles: [1, 2],
    },
    {
      name: 'Transaksi',
      icon: <Receipt />,
      path: '/transactions',
      roles: [1, 2],
    },
    {
      name: 'Pelanggan',
      icon: <Users />,
      path: '/customers',
      roles: [1, 2],
    },
    {
      name: 'Akun Sales',
      icon: <ShieldUser />,
      path: '/sales-accounts',
      roles: [1],
    },
    {
      name: 'Manajemen Data Master',
      icon: <Database />,
      path: '/master-data',
      roles: [1],
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1],
    }
  ],
  menu_purchasing: [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard />,
      path: '/purchasing/dashboard',
      roles: [1, 3],
    },
    {
      name: 'CT',
      icon: <Gem />, 
      roles: [1, 3],
      subItems: [
        { name: 'Pembelian', path: '/purchasing/orders', roles: [1, 3] },
        { name: 'Surat Jalan', path: '/purchasing/work-orders', roles: [1, 3] },
      ]
    },
    {
      name: 'LM',
      icon: <Diamond />, 
      roles: [1, 3],
      subItems: [
        { name: 'Pembelian', path: '/purchasing/orders-lm', roles: [1, 3] },
        { name: 'Surat Jalan', path: '/purchasing/work-orders-lm', roles: [1, 3] },
      ]
    },
    // {
    //   name: 'Pembelian CT',
    //   icon: <FileText />,
    //   path: '/purchasing/orders',
    //   roles: [1, 3],
    // },
    // {
    //   name: 'Surat Jalan CT',
    //   icon: <Truck />, 
    //   path: '/purchasing/work-orders',
    //   roles: [1, 3],
    // },
    {
      name: 'Setor Barang',
      icon: <Archive />, 
      path: '/purchasing/deposits',
      roles: [1, 3],
    },
    {
      name: 'Master Data',
      icon: <Database />, 
      roles: [1, 3],
      subItems: [
        { name: 'Supplier', path: '/purchasing/master/suppliers', roles: [1, 3] },
        { name: 'Barang', path: '/purchasing/master/items', roles: [1, 3] },
        { name: 'Bank', path: '/purchasing/master/banks', roles: [1, 3] },
        { name: 'Ekspedisi', path: '/purchasing/master/expeditions', roles: [1, 3] },
        { name: 'Staff', path: '/purchasing/master/staffs', roles: [1, 3] },
      ]
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1],
    },
  ],
};