import './globals.css'

export const metadata = { title: 'Painel Administrativo | MIRJE' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
