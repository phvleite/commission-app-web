import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Commission App Web',
    description: 'Sistema web de gestão de comissões multi-tenant',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="pt-BR"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                {children}
                <Toaster
                    richColors
                    closeButton
                    position="top-right"
                    duration={5000}
                    toastOptions={{
                        classNames: {
                            toast: 'text-sm font-semibold',
                        },
                    }}
                />
            </body>
        </html>
    )
}
