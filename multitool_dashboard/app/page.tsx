"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const storedUser = localStorage.getItem("kisaan_user")

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.authenticated) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
          return
        }
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem("kisaan_user")
      }
    }

    // No valid authentication, redirect to login
    router.push("/login")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-green-600">Loading KisaanSaathi...</p>
      </div>
    </div>
  )
}
