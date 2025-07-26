"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wheat, Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const authMessage = isLogin
        ? `Sign me in with email: ${email} and password: ${password}`
        : `Register me with email: ${email} and password: ${password}`

      const response = await fetch("http://localhost:8001/api/send_message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: authMessage,
          auth_flow: true,
          email: email,
          password: password,
          action: isLogin ? "signin" : "register",
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          // Check if authentication was successful
          const latestMessage = data.latest_response || ""

          if (
            latestMessage.toLowerCase().includes("welcome") ||
            latestMessage.toLowerCase().includes("success") ||
            latestMessage.toLowerCase().includes("authenticated")
          ) {
            setSuccess(isLogin ? "Login successful! Redirecting..." : "Registration successful! Redirecting...")

            // Store user info in localStorage
            localStorage.setItem(
              "kisaan_user",
              JSON.stringify({
                email: email,
                authenticated: true,
                timestamp: Date.now(),
              }),
            )

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          } else {
            // Authentication failed
            setError(latestMessage || "Authentication failed. Please try again.")
          }
        } else {
          setError(data.error || "Authentication failed. Please try again.")
        }
      } else {
        setError("Connection failed. Please check if the backend server is running.")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setError("Connection failed. Please check if the backend server is running on port 8001.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError("")
    setSuccess("")
    setEmail("")
    setPassword("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-lg">
            <Wheat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">KisaanSaathi</h1>
          <p className="text-green-600">Your Multilingual Agricultural Assistant</p>
        </div>

        {/* Login/Register Card */}
        <Card className="shadow-xl border-2 border-green-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-green-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center text-green-600">
              {isLogin
                ? "Sign in to access your agricultural dashboard"
                : "Join KisaanSaathi to get started with smart farming"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-800">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  <Input
                    type="email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-800">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className={cn(
                  "w-full h-11 text-white font-medium transition-all duration-200",
                  "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {isLogin ? "Sign In" : "Create Account"}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center pt-4 border-t border-green-100">
              <p className="text-sm text-green-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="ghost"
                onClick={toggleMode}
                className="text-green-700 hover:text-green-800 hover:bg-green-50 font-medium"
                disabled={isLoading}
              >
                {isLogin ? "Create Account" : "Sign In"}
              </Button>
            </div>

            {/* Demo Info */}
            <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 text-center">
                <strong>Demo Mode:</strong> Authentication is handled by KisaanSaathi AI backend.
                <br />
                Use any email/password combination to test the system.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-green-600">
          <p>© 2024 KisaanSaathi - Empowering Farmers with AI</p>
        </div>
      </div>
    </div>
  )
}
