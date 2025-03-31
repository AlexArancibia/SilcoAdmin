import { compare, hash } from "bcryptjs"
import prisma from "../prisma"
import { signJWT, verifyJWT } from "../auth/jwt"

export type UserType = "usuario" | "instructor"

export interface AuthUser {
  id: number
  nombre: string
  email?: string
  rol?: string
  userType: UserType
}

export async function authenticateUser(
  identifier: string,
  password: string,
): Promise<{ user: AuthUser; token: string } | null> {
  // Try to find user by email
  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: identifier }, { nombre: identifier }],
      activo: true,
    },
  })

  if (usuario) {
    const passwordMatch = await compare(password, usuario.password)
    if (passwordMatch) {
      const user: AuthUser = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        userType: "usuario",
      }

      const token = await signJWT({
        id: usuario.id,
        userType: "usuario",
        rol: usuario.rol,
      })

      return { user, token }
    }
  }

  // Try to find instructor by nombre
  const instructor = await prisma.instructor.findFirst({
    where: {
      nombre: identifier,
    },
  })

  if (instructor && instructor.password) {
    const passwordMatch = await compare(password, instructor.password)
    if (passwordMatch) {
      const user: AuthUser = {
        id: instructor.id,
        nombre: instructor.nombre,
        userType: "instructor",
      }

      const token = await signJWT({
        id: instructor.id,
        userType: "instructor",
      })

      return { user, token }
    }
  }

  return null
}

export async function registerUser(
  userType: UserType,
  userData: {
    nombre: string
    email?: string
    password: string
    rol?: string
  },
) {
  const hashedPassword = await hash(userData.password, 10)

  if (userType === "usuario") {
    if (!userData.email) {
      throw new Error("Email is required for usuario registration")
    }

    // Check if user already exists
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [{ email: userData.email }, { nombre: userData.nombre }],
      },
    })

    if (existingUser) {
      throw new Error("User with this email or name already exists")
    }

    const newUser = await prisma.usuario.create({
      data: {
        nombre: userData.nombre,
        email: userData.email,
        password: hashedPassword,
        rol: userData.rol || "USUARIO",
      },
    })

    const user: AuthUser = {
      id: newUser.id,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: newUser.rol,
      userType: "usuario",
    }

    const token = await signJWT({
      id: newUser.id,
      userType: "usuario",
      rol: newUser.rol,
    })

    return { user, token }
  } else {
    // Check if instructor already exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { nombre: userData.nombre },
    })

    if (existingInstructor) {
      throw new Error("Instructor with this name already exists")
    }

    const newInstructor = await prisma.instructor.create({
      data: {
        nombre: userData.nombre,
        password: hashedPassword,
      },
    })

    const user: AuthUser = {
      id: newInstructor.id,
      nombre: newInstructor.nombre,
      userType: "instructor",
    }

    const token = await signJWT({
      id: newInstructor.id,
      userType: "instructor",
    })

    return { user, token }
  }
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verifyJWT<{
      id: number
      userType: UserType
      rol?: string
    }>(token)

    if (payload.userType === "usuario") {
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id },
      })

      if (!usuario || !usuario.activo) return null

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        userType: "usuario",
      }
    } else {
      const instructor = await prisma.instructor.findUnique({
        where: { id: payload.id },
      })

      if (!instructor) return null

      return {
        id: instructor.id,
        nombre: instructor.nombre,
        userType: "instructor",
      }
    }
  } catch (error) {
    return null
  }
}

