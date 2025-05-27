import type { Metadata } from "next"
import type React from "react"
import { Inter } from "next/font/google"
import { ClientLayout } from "@/components/layout/client-layout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Email Marketing App",
  description: "Aplicación completa de email marketing",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
