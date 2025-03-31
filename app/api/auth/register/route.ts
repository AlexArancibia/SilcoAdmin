import { registerUser, UserType } from "@/lib/api/auth-api"
import { type NextRequest, NextResponse } from "next/server"
 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userType, nombre, email, password, rol } = body

    if (!userType || !nombre || !password) {
      return NextResponse.json({ message: "User type, name and password are required" }, { status: 400 })
    }

    if (userType === "usuario" && !email) {
      return NextResponse.json({ message: "Email is required for usuario registration" }, { status: 400 })
    }

    const result = await registerUser(userType as UserType, {
      nombre,
      email,
      password,
      rol,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 500 },
    )
  }
}

