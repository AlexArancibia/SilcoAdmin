import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { UserInfo } from "@/components/ui/user-info"
import { CurrentPeriodDisplay } from "@/components/period-info"

const dmSans = DM_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión de Instructores",
  description: "Gestiona instructores, clases y pagos para estudios de fitness",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={dmSans.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background/95 backdrop-blur sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className=" hover:bg-primary/10 hover:text-primary transition-colors" />
                    <Separator orientation="vertical" className="h-4 mr-2" />
                    {/* <CurrentPeriodDisplay /> */}
                  </div>
                  <div className="flex items-center gap-4">
                    <UserInfo />
                  </div>
                </header>
                <main className="">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

// User info component for the header
 