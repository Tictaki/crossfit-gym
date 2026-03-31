'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { settingsAPI, authAPI, getImageUrl } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Force a small timeout to prevent permanent spinner if something hangs
      const timeoutId = setTimeout(() => {
        if (loading) setLoading(false);
      }, 5000);

      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      try {
        // Source of truth: check the actual session if token/user might be missing (OAuth)
        const response = await authAPI.me();
        
        if (response.data?.user) {
          const fetchedUser = response.data.user;
          localStorage.setItem('user', JSON.stringify(fetchedUser));
          setUser(fetchedUser);
          loadSettings();
        } else if (storedUser) {
          // Fallback to local storage if API check specifically didn't return a user but we have one
          // (Usually happens if offline or dev mode)
          setUser(JSON.parse(storedUser));
          loadSettings();
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.warn('Session check failed:', error.message);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          loadSettings();
        } else {
          router.push('/login');
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initApp();
  }, [router]);

  useEffect(() => {
    let lastY = window.scrollY;
    
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Update scrolled state for visual styles (threshold 20px)
      setIsScrolled(currentY > 20);

      // Show immediately if near top
      if (currentY < 10) {
        setIsVisible(true);
        lastY = currentY;
        return;
      }

      // Hide only after significant downward movement (50px) to prevent accidental hide
      if (currentY > lastY + 50) {
        setIsVisible(false);
        lastY = currentY;
      } 
      // Show immediately on ANY upward scroll
      else if (currentY < lastY - 5) {
        setIsVisible(true);
        lastY = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          className="fixed inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}



      {/* Smart Sidebar - handles its own mobile/desktop behavior */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />

      {/* Main Area — always offset by the collapsed sidebar width on lg+ */}
      <div className="lg:pl-[80px] min-h-screen flex flex-col transition-none">

        {/* Floating Header */}
        <motion.div 
          className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-2"
          initial={{ y: 0 }}
          animate={{ 
            y: isVisible ? 0 : "-150%",
            scale: isVisible ? 1 : 0.95,
            opacity: isVisible ? 1 : 0
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            mass: 0.8
          }}
        >
          <div className={`max-w-[1600px] mx-auto w-full transition-all duration-500 ${isScrolled ? 'scale-[0.98]' : 'scale-100'}`}>
            <Header user={user} setSidebarOpen={setIsSidebarOpen} isScrolled={isScrolled} />
          </div>
        </motion.div>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6 relative z-10 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}

