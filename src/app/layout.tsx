"use client";
import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Bounce, ToastContainer } from "react-toastify";
const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const publicPaths = ["/signin", "/signup", "/public-page"];

    if (!token && !publicPaths.includes(pathname)) {
      router.replace("/signin");
    }
  }, [pathname, router]);
  return (
    <html lang="en" className="notranslate">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ToastContainer
          style={{ marginTop: '4rem', zIndex: 9999999 }}
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
        />
        <ThemeProvider>

          <SidebarProvider>
            {children}

          </SidebarProvider>

        </ThemeProvider>

      </body>
    </html>
  );
}
