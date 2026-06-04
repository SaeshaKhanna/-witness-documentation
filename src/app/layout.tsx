import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Witness — Secure Evidence & Memory Preservation',
  description:
    'A secure, trauma-informed evidence preservation platform for survivors.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://unpkg.com/@phosphor-icons/web@2.1.1"
          async
        ></script>
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--ink-4)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-md)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
