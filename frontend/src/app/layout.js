import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { ConfirmModalProvider } from '@/context/ConfirmModalContext'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Crosstraining Gym - Gestão',
  description: 'Sistema de gestão para Crosstraining Gym',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Crosstraining Gym',
  },
  other: {
    'mobile-web-app-capable': 'yes'
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.jpg',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} bg-black`}>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmModalProvider>
              {children}
            </ConfirmModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
