"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff, Save, Lock, User, Building, Shield, UserCircle } from "lucide-react"
import { hash } from "bcryptjs"
import type { Instructor } from "@/types/schema"
import type { PagoInstructor } from "@/types/schema"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/useAuthStore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InstructorInfoProps {
  instructor: Instructor | null
  isEditing: boolean
  isSaving: boolean
  editedInstructor: Partial<Instructor>
  editedPaymentMetrics: {
    dobleteos: number
    horariosNoPrime: number
    participacionEventos: boolean
    cumpleLineamientos: boolean
  }
  handleSaveChanges: () => void
  handleInputChange: (field: string, value: any) => void
  handleExtraInfoChange: (field: string, value: any) => void
  handlePaymentMetricChange: (field: string, value: any) => void
  pagosPeriodo: PagoInstructor[]
}

export function InstructorInfo({
  instructor,
  isEditing,
  isSaving,
  editedInstructor,
  handleSaveChanges,
  handleInputChange,
  handleExtraInfoChange,
  pagosPeriodo,
}: InstructorInfoProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isHashingPassword, setIsHashingPassword] = useState(false)
  const [passwordToHash, setPasswordToHash] = useState<string | null>(null)
  const [shouldHash, setShouldHash] = useState(false)
  const [wasEditing, setWasEditing] = useState(false)

  const userType = useAuthStore((state) => state.userType)
  const isInstructor = userType === "instructor"

  const [hashPassword, setHashPassword] = useState<((plainPassword: string) => Promise<void>) | null>(null)

  const createHashPassword = useCallback(() => {
    return async (plainPassword: string) => {
      if (!plainPassword) return

      try {
        setIsHashingPassword(true)
        const hashedPassword = await hash(plainPassword, 10)
        handleInputChange("password", hashedPassword)
      } catch (error) {
        console.error("Error al hashear la contraseña:", error)
        setPasswordError("Error al procesar la contraseña")
      } finally {
        setIsHashingPassword(false)
        setPasswordToHash(null)
        setShouldHash(false)
      }
    }
  }, [handleInputChange])

  useEffect(() => {
    setHashPassword(() => createHashPassword())
  }, [createHashPassword])

  const isEditingRef = useRef(isEditing)

  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (isEditingRef.current && shouldHash) {
      if (
        passwordToHash &&
        confirmPassword === passwordToHash &&
        !passwordError &&
        !editedInstructor.password &&
        hashPassword
      ) {
        hashPassword(passwordToHash)
      }
    }
  }, [passwordToHash, confirmPassword, passwordError, editedInstructor.password, hashPassword, shouldHash])

  useEffect(() => {
    if (isEditing && !wasEditing && instructor) {
      handleInputChange("nombreCompleto", instructor.nombreCompleto || "")
      handleInputChange("DNI", instructor.DNI || "")
      handleInputChange("celular", instructor.celular || "")
      handleInputChange("personaContacto", instructor.personaContacto || "")
      handleInputChange("activo", instructor.activo)
      handleInputChange("banco", instructor.banco || "")
      handleInputChange("cuentaBancaria", instructor.cuentaBancaria || "")
      handleInputChange("CCI", instructor.CCI || "")
      setWasEditing(true)
    } else if (!isEditing) {
      setWasEditing(false)
    }
  }, [isEditing, wasEditing, instructor, handleInputChange])

  if (!instructor) return null

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordToHash(e.target.value)
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
    } else {
      setPasswordError("")
    }
    setShouldHash(true)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (e.target.value !== password) {
      setPasswordError("Las contraseñas no coinciden")
    } else {
      setPasswordError("")
    }
    setShouldHash(true)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleDNIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      handleInputChange("DNI", value === "" ? null : Number(value))
    }
  }

  // Vista de visualización (no edición)
  if (!isEditing) {
    return (
      <Card className="border border-border shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2 md:text-lg">
              <UserCircle className="h-4 w-4 text-primary md:h-5 md:w-5" />
              Información del instructor
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Datos personales y bancarios</CardDescription>
          </div>
          <Badge
            variant={instructor.activo ? "success" : "destructive"}
            className={`text-xs ${
              instructor.activo
                ? "bg-green-500/10 text-green-600 border-green-200"
                : "bg-red-500/10 text-red-600 border-red-200"
            }`}
          >
            {instructor.activo ? "Activo" : "Inactivo"}
          </Badge>
        </CardHeader>

        <CardContent className="pt-3">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
            {/* Columna izquierda: Información del instructor */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5 text-primary/70 md:h-4 md:w-4" />
                <h3 className="text-xs font-medium md:text-sm">Información Personal</h3>
              </div>

              <div className="space-y-2 text-xs md:text-sm md:space-y-3">
                <div>
                  <p className="text-muted-foreground mb-1">Nombre Completo</p>
                  <p className="font-medium">{instructor.nombreCompleto || "-"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">DNI</p>
                  <p className="font-medium">{instructor.DNI || "-"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Celular</p>
                  <p className="font-medium">{instructor.celular || "-"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Persona de Contacto</p>
                  <p className="font-medium">{instructor.personaContacto || "-"}</p>
                </div>
              </div>
            </div>

            {/* Columna derecha: Información bancaria */}
            <div className="space-y-3 border-t pt-4 border-border/30 md:border-t-0 md:border-l md:pl-6 md:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-3.5 w-3.5 text-primary/70 md:h-4 md:w-4" />
                <h3 className="text-xs font-medium md:text-sm">Información Bancaria</h3>
              </div>

              <div className="space-y-2 text-xs md:text-sm md:space-y-3">
                <div>
                  <p className="text-muted-foreground mb-1">Banco</p>
                  <p className="font-medium">{instructor.banco || "-"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Cuenta Bancaria</p>
                  <p className="font-medium">{instructor.cuentaBancaria || "-"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">CCI</p>
                  <p className="font-medium">{instructor.CCI || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vista de edición
  return (
    <Card className="border border-border shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2 md:text-lg">
            <UserCircle className="h-4 w-4 text-primary md:h-5 md:w-5" />
            Editar información
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Modifica los datos del instructor</CardDescription>
        </div>
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving || passwordError !== "" || isHashingPassword}
          size="sm"
          className="h-7 text-xs px-2.5 md:h-8 md:text-sm md:px-3"
        >
          {isSaving || isHashingPassword ? (
            "Guardando..."
          ) : (
            <>
              <Save className="h-3 w-3 mr-1 md:h-3.5 md:w-3.5 md:mr-1.5" />
              Guardar
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
          {/* Columna izquierda: Información del instructor */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3.5 w-3.5 text-primary/70 md:h-4 md:w-4" />
              <h3 className="text-xs font-medium md:text-sm">Información Personal</h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="space-y-1">
                <Label htmlFor="nombreCompleto" className="text-xs md:text-sm">
                  Nombre Completo
                </Label>
                <Input
                  id="nombreCompleto"
                  value={editedInstructor.nombreCompleto || ""}
                  onChange={(e) => handleInputChange("nombreCompleto", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dni" className="text-xs md:text-sm">
                  DNI
                </Label>
                <Input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editedInstructor.DNI || ""}
                  onChange={handleDNIChange}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="celular" className="text-xs md:text-sm">
                  Celular
                </Label>
                <Input
                  id="celular"
                  value={editedInstructor.celular || ""}
                  onChange={(e) => handleInputChange("celular", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="personaContacto" className="text-xs md:text-sm">
                  Persona de Contacto
                </Label>
                <Input
                  id="personaContacto"
                  value={editedInstructor.personaContacto || ""}
                  onChange={(e) => handleInputChange("personaContacto", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between border rounded-md p-2 bg-background/50 md:p-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-primary/70 md:h-3.5 md:w-3.5" />
                    <Label htmlFor="activo" className="text-xs md:text-sm">
                      Estado:
                    </Label>
                    <Badge
                      variant={
                        editedInstructor.activo !== undefined
                          ? editedInstructor.activo
                            ? "success"
                            : "destructive"
                          : instructor.activo
                            ? "success"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {editedInstructor.activo !== undefined
                        ? editedInstructor.activo
                          ? "Activo"
                          : "Inactivo"
                        : instructor.activo
                          ? "Activo"
                          : "Inactivo"}
                    </Badge>
                  </div>

                  {isInstructor ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-muted-foreground">
                            <Lock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p>Los instructores no pueden cambiar el estado</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Switch
                      id="activo"
                      checked={editedInstructor.activo !== undefined ? editedInstructor.activo : instructor.activo}
                      onCheckedChange={(checked) => handleInputChange("activo", checked)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: Información bancaria */}
          <div className="space-y-3 border-t pt-4 border-border/30 md:border-t-0 md:border-l md:pl-6 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-3.5 w-3.5 text-primary/70 md:h-4 md:w-4" />
              <h3 className="text-xs font-medium md:text-sm">Información Bancaria</h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="space-y-1">
                <Label htmlFor="banco" className="text-xs md:text-sm">
                  Banco
                </Label>
                <Input
                  id="banco"
                  value={editedInstructor.banco || ""}
                  onChange={(e) => handleInputChange("banco", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cuentaBancaria" className="text-xs md:text-sm">
                  Cuenta Bancaria
                </Label>
                <Input
                  id="cuentaBancaria"
                  value={editedInstructor.cuentaBancaria || ""}
                  onChange={(e) => handleInputChange("cuentaBancaria", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="CCI" className="text-xs md:text-sm">
                  CCI
                </Label>
                <Input
                  id="CCI"
                  value={editedInstructor.CCI || ""}
                  onChange={(e) => handleInputChange("CCI", e.target.value)}
                  className="h-7 text-xs md:h-8 md:text-sm"
                />
              </div>

              <div className="pt-1">
                <div className="border rounded-md p-2 bg-background/50 md:p-2.5">
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="relative">
                      <Label htmlFor="password" className="text-xs mb-1 block md:text-sm md:mb-1.5">
                        Nueva Contraseña
                      </Label>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        className="h-7 text-xs pr-7 md:h-8 md:text-sm md:pr-8"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-2 top-[calc(50%+6px)] transform -translate-y-1/2 text-muted-foreground md:top-[calc(50%+8px)]"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-xs mb-1 block md:text-sm md:mb-1.5">
                        Confirmar Contraseña
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="h-7 text-xs md:h-8 md:text-sm"
                      />
                    </div>
                    {passwordError && <p className="text-xs text-destructive mt-1">{passwordError}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}