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
  PackageSearch,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { TbUserDollar } from 'react-icons/tb';
import { FaTags } from 'react-icons/fa';

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
      roles: [1, 2, 4, 6, 7],
    },
    {
      name: 'Transaksi',
      icon: <Receipt />,
      path: '/transactions',
      roles: [1, 2, 4, 6, 7],
    },
    {
      name: 'Pelanggan',
      icon: <Users />,
      path: '/customers',
      roles: [1, 2, 4],
    },
    {
      name: 'Akun Sales',
      icon: <ShieldUser />,
      path: '/sales-accounts',
      roles: [1, 4],
    },
    {
      name: 'Kategori Pelanggan',
      icon: <FaTags />,
      path: '/customer-categories',
      roles: [1],
    },
    {
      name: 'Manajemen Data Master',
      icon: <Database />,
      path: '/master-data',
      roles: [1, 8],
    },
    {
      name: 'List Pelanggan',
      icon: <Users />,
      path: '/area-manager/customer-lists',
      roles: [1, 6],
    },
    {
      name: 'Pelanggan Saya',
      icon: <UserCheck />,
      path: '/area-manager/my-customers',
      roles: [1, 6],
    },
    {
      name: 'List Pelanggan',
      icon: <Users />,
      path: '/general-manager/customer-lists',
      roles: [1, 7],
    },
    {
      name: 'Pelanggan Saya',
      icon: <UserCheck />,
      path: '/general-manager/my-customers',
      roles: [1, 7],
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
      roles: [1, 3, 5],
    },
    {
      name: 'CT',
      icon: <Gem />, 
      roles: [1, 3, 5],
      subItems: [
        { name: 'Pembelian', path: '/purchasing/orders', roles: [1, 3, 5] },
        { name: 'Surat Jalan', path: '/purchasing/work-orders', roles: [1, 3, 5] },
      ]
    },
    {
      name: 'LM',
      icon: <Diamond />, 
      roles: [1, 3, 5],
      subItems: [
        { name: 'Pembelian', path: '/purchasing/orders-lm', roles: [1, 3, 5] },
        { name: 'Surat Jalan', path: '/purchasing/work-orders-lm', roles: [1, 3, 5] },
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
      roles: [1, 3, 5],
    },
    {
      name: 'Laporan Stok Global',
      icon: <PackageSearch />, 
      path: '/purchasing/stock-global',
      roles: [1, 3, 5],
    },
    {
      name: 'Master Data',
      icon: <Database />, 
      roles: [1, 3, 5],
      subItems: [
        { name: 'Supplier', path: '/purchasing/master/suppliers', roles: [1, 3, 5] },
        { name: 'Barang', path: '/purchasing/master/items', roles: [1, 3, 5] },
        { name: 'Bank', path: '/purchasing/master/banks', roles: [1, 3, 5] },
        { name: 'Ekspedisi', path: '/purchasing/master/expeditions', roles: [1, 3, 5] },
        { name: 'Karyawan', path: '/purchasing/master/employees', roles: [1, 3, 5] },
        { name: 'Pemesan', path: '/purchasing/master/staffs', roles: [1, 3, 5] },
      ]
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1],
    },
  ],
  menu_admin: [
    {
      name: 'Admin Utama',
      icon: <ShieldUser />,
      path: '/admin-panel/main-admin',
      roles: [1],
    },
    {
      name: 'Admin Sales & Purchasing',
      icon: <ShieldUser />,
      path: '/admin-panel',
      roles: [1, 8],
    },
    {
      name: 'Area Manager',
      icon: <ShieldUser />,
      path: '/admin-panel/area-manager',
      roles: [1, 8],
    },
    {
      name: 'General Manager',
      icon: <ShieldUser />,
      path: '/admin-panel/general-manager',
      roles: [1, 8],
    },
    {
      name: 'Menu',
      icon: <Home />,
      path: '/menus',
      roles: [1],
    }
  ],
};