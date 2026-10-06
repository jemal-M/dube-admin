import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Geist has no Ethiopic glyphs; this covers the ዱቤ brand name and any Amharic text.
const fontEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: { default: "ዱቤ Admin", template: "%s · ዱቤ Admin" },
  description: "Platform administration for ዱቤ merchants.",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontEthiopic.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
