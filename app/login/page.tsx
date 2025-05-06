"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Lock, Loader2, Calculator, CreditCard, DollarSign, BarChart4, Receipt } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding/Hero section - Hidden on mobile */}
      <div className="hidden md:flex bg-gradient-to-br from-primary to-primary/70 w-full md:w-1/2 p-10 flex-col justify-center items-center text-primary-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Siclo</h1>

          <p className="text-primary-foreground/90 text-lg mb-10 leading-relaxed">
            Sistema especializado en el cálculo y gestión de pagos para instructores de fitness.
          </p>

          {/* Feature icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <Calculator className="h-6 w-6" />, label: "Cálculos" },
              { icon: <CreditCard className="h-6 w-6" />, label: "Pagos" },
              { icon: <Receipt className="h-6 w-6" />, label: "Facturas" },
              { icon: <BarChart4 className="h-6 w-6" />, label: "Reportes" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm"
              >
                {item.icon}
                <span className="mt-2 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Payment calculation illustration */}
          <div>
            <div className="relative bg-primary-foreground/10 p-6 rounded-xl backdrop-blur-sm shadow-lg">
              <div className="absolute -top-6 -right-6 bg-primary-foreground/20 p-3 rounded-full">
                <DollarSign className="h-8 w-8" />
              </div>

              {/* Payment calculation visualization */}
              <div className="space-y-4">
                {/* Instructor row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-foreground/30 mr-3"></div>
                    <div className="h-3 bg-primary-foreground/30 rounded-full w-24"></div>
                  </div>
                  <div className="h-6 w-20 bg-primary-foreground/40 rounded-md"></div>
                </div>

                {/* Payment breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-primary-foreground/20 rounded-full w-full"></div>
                      <div className="h-8 bg-primary-foreground/30 rounded-md flex items-end justify-end p-2">
                        <div className="h-2 w-12 bg-primary-foreground/50 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation rows */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 bg-primary-foreground/20 rounded-full w-1/3"></div>
                    <div className="h-5 w-16 bg-primary-foreground/30 rounded-md"></div>
                  </div>
                ))}

                {/* Total row */}
                <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/20">
                  <div className="h-4 bg-primary-foreground/40 rounded-full w-20"></div>
                  <div className="h-7 w-24 bg-primary-foreground/50 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form - Full width on mobile */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10 bg-background min-h-screen">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <img
              src="https://pub-a15fad1bb05e4ecbb92c9d83b643a721.r2.dev/logo.png"
              alt="QINTEC Logo"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Mobile only title */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Siclo</h1>
            <p className="text-muted-foreground text-sm">Sistema de cálculo y gestión de pagos</p>
          </div>

          <LoginForm />
          <div className="text-center text-muted-foreground mt-10 text-sm flex flex-col items-center">
            <p>© {new Date().getFullYear()} QINTEC. Todos los derechos reservados.</p>
            <div className="mt-5 opacity-70">
              <img
                src="https://pub-a15fad1bb05e4ecbb92c9d83b643a721.r2.dev/Logotipo_QINTEC_TEC_Digital%5B1%5D_Mesa%20de%20trabajo%201%20copia%202.png"
                alt="QINTEC Text Logo"
                className="h-5 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(identifier, password)

    if (!useAuthStore.getState().error) {
      router.push("/")
    }
  }

  return (
    <Card className="border-none shadow-xl rounded-xl bg-card">
      <div className="px-6 md:px-8 pt-8 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-primary">Bienvenido</h2>
        <p className="text-muted-foreground mt-2">Ingresa tus credenciales para acceder a tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit}>
        <CardContent className="px-6 md:px-8 pb-8 space-y-7">
          {error && (
            <div>
              <Alert variant="destructive" className="border border-destructive/20 bg-destructive/5 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
              Nombre o Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  clearError()
                }}
                placeholder="nombre@ejemplo.com"
                required
                className="pl-11 h-13 bg-muted/40 border-input rounded-lg focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                }}
                placeholder="••••••••"
                required
                className="pl-11 h-13 bg-muted/40 border-input rounded-lg focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full h-13 mt-4 font-medium text-base rounded-lg shadow-md",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
