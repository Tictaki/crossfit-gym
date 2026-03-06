import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { ConfirmModalProvider } from '@/context/ConfirmModalContext'
import './globals.css'
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

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
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-black`}>
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
