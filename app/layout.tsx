import './globals.css'

export const metadata = {
  title: 'Quiz Bíblico | MIRJE',
  description: 'Quiz Bíblico do Ministério Internacional Reconstruindo Jerusalém',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
