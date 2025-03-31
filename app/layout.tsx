import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"

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
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange enableColorScheme>
            <SidebarProvider>
              <div className="flex w-full min-h-screen">
                <AppSidebar />
 
                  {/* <SiteHeader /> */}
                  <main className=" w-full  ">{children}</main>
 
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}