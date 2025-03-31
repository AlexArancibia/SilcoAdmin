import { authenticateUser } from "@/lib/api/auth-api"
import { type NextRequest, NextResponse } from "next/server"
 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json({ message: "Identifier and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(identifier, password)

    if (!result) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Authentication failed" }, { status: 500 })
  }
}

