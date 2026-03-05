'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { settingsAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({ children }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
      loadSettings();
    }
    setLoading(false);
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data?.background_image) {
        setBackgroundImage(getImageUrl(response.data.background_image));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-sans">
      {/* Background Image */}
      {backgroundImage && (
        <div
          className="fixed inset-0 z-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Dark Mode Texture Background */}
      <div
        className="fixed inset-0 z-0 opacity-0 dark:opacity-40 pointer-events-none transition-opacity duration-700 select-none"
        style={{
          backgroundImage: "url('/bg-dark.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Smart Sidebar - handles its own mobile/desktop behavior */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />

      {/* Main Area — always offset by the collapsed sidebar width on lg+ */}
      <div className="lg:pl-[80px] min-h-screen flex flex-col transition-none">

        {/* Floating Header */}
        <div className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-2 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto w-full">
            <Header user={user} setSidebarOpen={setIsSidebarOpen} />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-2 relative z-10 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomNav />
      </div>
    </div>
  );
}

