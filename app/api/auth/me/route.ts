import { getUserFromToken } from "@/lib/api/auth-api"
import { type NextRequest, NextResponse } from "next/server"
 

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ message: "Authentication failed" }, { status: 500 })
  }
}

