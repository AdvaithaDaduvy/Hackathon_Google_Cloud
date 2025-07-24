"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import {
  Send,
  User,
  Volume2,
  Plus,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Leaf,
  TrendingUp,
  Shield,
  FileText,
  Radio,
  Sprout,
  Users,
  Phone,
  Search,
  RefreshCw,
  Heart,
  Wheat,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  audio_path?: string
  timestamp?: string
}

interface Session {
  session_id: string
  messages: Message[]
}

type FeatureType =
  | "chat"
  | "disease-diagnosis"
  | "product-authentication"
  | "market-trends"
  | "scheme-recommendations"
  | "crop-loss-prevention"
  | "crop-loss-report"
  | "reminders"

export default function KisaanSaathiDashboard() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [isOnlineMode, setIsOnlineMode] = useState(false)
  const [fastApiPort, setFastApiPort] = useState("8001")
  const [activeFeature, setActiveFeature] = useState<FeatureType>("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Feature-specific states
  const [diseaseStep, setDiseaseStep] = useState<1 | 2>(1)
  const [diseaseSymptoms, setDiseaseSymptoms] = useState("")
  const [diseasePhoto, setDiseasePhoto] = useState<string | null>(null)
  const [diagnosisResult, setDiagnosisResult] = useState("")
  const [farmerLocation, setFarmerLocation] = useState("")
  const [farmerPhone, setFarmerPhone] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    checkBackendAndInitialize()
  }, [])

  const checkBackendAndInitialize = async () => {
    setBackendStatus("checking")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`http://localhost:${fastApiPort}/api/session`, {
        method: "GET",
        credentials: "include",
        mode: "cors",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setBackendStatus("connected")
        setIsOnlineMode(true)

        setUserId(data.user_id)
        setSessionId(data.session_id)

        if (data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date().toLocaleTimeString(),
          }))
          setMessages(formattedMessages)
        } else {
          setMessages([
            {
              role: "assistant",
              content: `🌾 Hello! I'm KisaanSaathi, your digital agricultural assistant!

**Your Setup is Ready:**
- ✅ KisaanSaathi AI: localhost:8000 (Connected)
- ✅ Backend Server: localhost:8001 (Connected)
- ✅ Dashboard: localhost:3000 (This interface)

**I can help you with these services:**
🌱 Disease Diagnosis & Treatment
🛡️ Product Authentication
📈 Market Trends
📋 Government Schemes
🚨 Crop Loss Reporting
📻 Kisaan Radio Reminders

Choose any service from the sidebar or chat with me directly!`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ])
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setBackendStatus("disconnected")
      setIsOnlineMode(false)
      initializeDemoMode()
    }
  }

  const initializeDemoMode = () => {
    const demoSessionId = `demo-session-${Date.now()}`
    const demoUserId = `demo-user-${Math.random().toString(36).substr(2, 9)}`

    setSessionId(demoSessionId)
    setUserId(demoUserId)

    setMessages([
      {
        role: "assistant",
        content: `🌾 KisaanSaathi Demo Mode

**Setup Status:**
- ✅ Dashboard: localhost:3000 (This interface)
- ❌ Backend Server: localhost:8001 (Not connected)
- ❌ KisaanSaathi AI: localhost:8000 (Not connected)

**To connect your backend:**
1. Start FastAPI server: \`uvicorn main:app --reload --port 8001\`
2. Start SDK Agent server: on port 8000
3. Click "Reconnect" button

**Available in Demo:**
- Full UI experience
- Test all features
- Interface design preview`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  const sendMessage = async (customMessage?: string, flow?: string) => {
    const messageToSend = customMessage || inputMessage
    if (!messageToSend.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    if (isOnlineMode) {
      try {
        const response = await fetch(`http://localhost:${fastApiPort}/api/send_message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ message: messageToSend }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.messages) {
            const formattedMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date().toLocaleTimeString(),
            }))
            setMessages(formattedMessages)
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    } else {
      // Demo response
      setTimeout(() => {
        const demoResponse: Message = {
          role: "assistant",
          content: `Demo Response: Thank you for "${messageToSend}"! Connect the backend for real AI responses.`,
          timestamp: new Date().toLocaleTimeString(),
        }
        setMessages((prev) => [...prev, demoResponse])
      }, 1000)
    }

    setIsLoading(false)
  }

  const handleFeatureSubmit = async (data: any, flow: string) => {
    setIsLoading(true)

    if (isOnlineMode) {
      try {
        const response = await fetch(`http://localhost:${fastApiPort}/api/send_message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: `Flow: ${flow}\nData: ${JSON.stringify(data, null, 2)}`,
          }),
        })

        if (response.ok) {
          const responseData = await response.json()
          if (responseData.messages) {
            const formattedMessages = responseData.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date().toLocaleTimeString(),
            }))
            setMessages(formattedMessages)
          }
        }
      } catch (error) {
        console.error("Failed to submit feature data:", error)
      }
    }

    setIsLoading(false)
  }

  const createNewSession = async () => {
    setIsLoading(true)

    if (isOnlineMode) {
      try {
        const response = await fetch(`http://localhost:${fastApiPort}/api/create_session`, {
          method: "POST",
          credentials: "include",
        })

        if (response.ok) {
          setTimeout(async () => {
            await checkBackendAndInitialize()
          }, 1000)
          setMessages([])
        }
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    } else {
      initializeDemoMode()
      setMessages([])
    }

    setIsLoading(false)
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case "checking":
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "disconnected":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case "checking":
        return "Checking connection..."
      case "connected":
        return `Connected (port ${fastApiPort})`
      case "disconnected":
        return "Demo Mode"
    }
  }

  const features = [
    { id: "chat", name: "Chat", icon: MessageSquare, description: "Direct conversation" },
    { id: "disease-diagnosis", name: "Disease Diagnosis", icon: Leaf, description: "Identify plant diseases" },
    {
      id: "product-authentication",
      name: "Product Authentication",
      icon: Shield,
      description: "Verify product authenticity",
    },
    { id: "market-trends", name: "Market Trends", icon: TrendingUp, description: "Price information" },
    { id: "scheme-recommendations", name: "Government Schemes", icon: FileText, description: "Scheme recommendations" },
    { id: "crop-loss-prevention", name: "Crop Protection", icon: Sprout, description: "Prevent crop damage" },
    { id: "crop-loss-report", name: "Loss Report", icon: Users, description: "Report crop losses" },
    { id: "reminders", name: "Kisaan Radio", icon: Radio, description: "Task reminders" },
  ]

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case "disease-diagnosis":
        return (
          <Card className="kisaan-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Leaf className="h-5 w-5 text-accent" />
                Disease Diagnosis
              </CardTitle>
              <CardDescription>Describe plant symptoms and upload a photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {diseaseStep === 1 ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Symptom Description</label>
                    <Textarea
                      placeholder="Provide detailed description of symptoms visible on the plant..."
                      value={diseaseSymptoms}
                      onChange={(e) => setDiseaseSymptoms(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Plant Photo (Optional)</label>
                    <FileUpload
                      onFileSelect={(file, dataUri) => setDiseasePhoto(dataUri)}
                      placeholder="Upload plant photo"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const data = {
                        symptoms: diseaseSymptoms,
                        photoDataUri: diseasePhoto,
                      }
                      handleFeatureSubmit(data, "diagnosePlantDisease")
                      setDiseaseStep(2)
                      setDiagnosisResult("Diagnosis in progress...")
                    }}
                    disabled={!diseaseSymptoms.trim() || isLoading}
                    className="w-full kisaan-button"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Diagnose Disease
                  </Button>
                </>
              ) : (
                <>
                  <Alert>
                    <Leaf className="h-4 w-4" />
                    <AlertDescription>Diagnosis: {diagnosisResult}</AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Location</label>
                      <Input
                        placeholder="Village, District"
                        value={farmerLocation}
                        onChange={(e) => setFarmerLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">WhatsApp Number</label>
                      <Input
                        placeholder="Your phone number"
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const data = {
                        diseaseDiagnosis: diagnosisResult,
                        farmerLocation,
                        farmerPhoneNumber: farmerPhone,
                        preferredContactMethod: "WhatsApp",
                      }
                      handleFeatureSubmit(data, "automatedVendorContact")
                    }}
                    disabled={!farmerLocation.trim() || !farmerPhone.trim() || isLoading}
                    className="w-full kisaan-button"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Vendor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDiseaseStep(1)
                      setDiseaseSymptoms("")
                      setDiseasePhoto(null)
                      setDiagnosisResult("")
                      setFarmerLocation("")
                      setFarmerPhone("")
                    }}
                    className="w-full"
                  >
                    New Diagnosis
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )

      case "product-authentication":
        return (
          <Card className="kisaan-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Product Authentication
              </CardTitle>
              <CardDescription>Upload product label photo to verify authenticity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onFileSelect={(file, dataUri) => {
                  if (dataUri) {
                    const data = { photoDataUri: dataUri }
                    handleFeatureSubmit(data, "authenticateProduct")
                  }
                }}
                placeholder="Upload product label photo"
              />
            </CardContent>
          </Card>
        )

      case "market-trends":
        return <MarketTrendsForm onSubmit={handleFeatureSubmit} isLoading={isLoading} />

      case "scheme-recommendations":
        return <SchemeRecommendationsForm onSubmit={handleFeatureSubmit} isLoading={isLoading} />

      case "crop-loss-prevention":
        return <CropLossPreventionForm onSubmit={handleFeatureSubmit} isLoading={isLoading} />

      case "crop-loss-report":
        return <CropLossReportForm onSubmit={handleFeatureSubmit} isLoading={isLoading} />

      case "reminders":
        return <RemindersForm onSubmit={handleFeatureSubmit} isLoading={isLoading} />

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-background/80">
      {/* Sidebar */}
      <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-border/50 flex flex-col shadow-lg">
        <div className="p-6 border-b border-border/50 kisaan-gradient">
          <h1 className="text-xl font-headline font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wheat className="h-6 w-6 text-white" />
            </div>
            KisaanSaathi
          </h1>
          <p className="text-white/90 text-sm mt-1">Your Digital Agricultural Assistant</p>

          {/* Connection Status */}
          <div className="mt-4 flex items-center gap-2 text-xs bg-white/10 rounded-lg p-2">
            {getStatusIcon()}
            <span className="font-medium text-white">{getStatusText()}</span>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <Button onClick={createNewSession} className="w-full mb-6 kisaan-button" disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>

          {backendStatus === "disconnected" && (
            <Button
              onClick={checkBackendAndInitialize}
              variant="outline"
              className="w-full mb-4 bg-transparent"
              disabled={backendStatus === "checking"}
            >
              {backendStatus === "checking" ? "Checking..." : "Reconnect to Backend"}
            </Button>
          )}

          <div className="space-y-2">
            <h3 className="font-headline font-medium text-sm text-muted-foreground mb-3">Services</h3>
            {features.map((feature) => (
              <Button
                key={feature.id}
                variant={activeFeature === feature.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3 text-left",
                  activeFeature === feature.id ? "kisaan-button" : "hover:bg-primary/5",
                )}
                onClick={() => setActiveFeature(feature.id as FeatureType)}
              >
                <feature.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{feature.name}</div>
                  <div className="text-xs opacity-70">{feature.description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Session Info</h4>
              <Badge variant="outline" className="text-xs">
                {sessionId.slice(0, 20)}...
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {userId?.slice(0, 15) || "Anonymous User"}...
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-headline font-semibold text-foreground">
                {features.find((f) => f.id === activeFeature)?.name || "KisaanSaathi Dashboard"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isOnlineMode
                  ? "Dashboard (3000) → FastAPI (8001) → KisaanSaathi AI (8000)"
                  : "Demo mode - Start FastAPI server on port 8001"}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Connection Alert */}
        {backendStatus === "disconnected" && (
          <div className="p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Demo mode active. Start your FastAPI server on port 8001:
                <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">uvicorn main:app --reload --port 8001</code>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex-1 flex">
          {/* Feature Content */}
          {activeFeature !== "chat" && (
            <div className="w-96 border-r border-border/50 p-4 overflow-y-auto bg-background/50">
              {renderFeatureContent()}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <Card className="border-dashed kisaan-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Wheat className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-lg font-headline font-medium text-foreground mb-2">
                        Welcome to KisaanSaathi
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Your intelligent agricultural assistant. Choose a service from the sidebar or start a
                        conversation directly.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="kisaan-gradient text-white">
                            <Wheat className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <Card
                        className={cn(
                          "max-w-[70%] kisaan-card",
                          message.role === "user" ? "kisaan-gradient text-white border-primary" : "",
                        )}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                          {message.audio_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-8"
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.src = `http://localhost:${fastApiPort}${message.audio_path}`
                                  audioRef.current.play()
                                }
                              }}
                            >
                              <Volume2 className="h-4 w-4 mr-1" />
                              Play Audio
                            </Button>
                          )}
                          {message.timestamp && <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>}
                        </CardContent>
                      </Card>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="kisaan-gradient text-white">
                        <Wheat className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="kisaan-card">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground font-body">
                            {isOnlineMode ? "KisaanSaathi is thinking..." : "Generating demo response..."}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area - Only show for chat */}
            {activeFeature === "chat" && (
              <div className="bg-white/90 backdrop-blur-sm border-t border-border/50 p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder={
                        isOnlineMode
                          ? "Ask KisaanSaathi anything..."
                          : "Type a message (demo mode - connect backend for real responses)..."
                      }
                      className="flex-1 font-body"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="kisaan-button"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-body">
                    Press Enter to send • Messages are processed through KisaanSaathi
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  )
}

// Additional Form Components
function MarketTrendsForm({
  onSubmit,
  isLoading,
}: { onSubmit: (data: any, flow: string) => void; isLoading: boolean }) {
  const [location, setLocation] = useState("")
  const [commodity, setCommodity] = useState("")

  return (
    <Card className="kisaan-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Market Trends
        </CardTitle>
        <CardDescription>Get current market prices for your crops</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Input placeholder="Your location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Crop/Commodity</label>
          <Input
            placeholder="e.g., Onions, Wheat, Rice"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
          />
        </div>
        <Button
          onClick={() => onSubmit({ location, commodity }, "getMarketTrends")}
          disabled={!location.trim() || !commodity.trim() || isLoading}
          className="w-full kisaan-button"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Get Market Trends
        </Button>
      </CardContent>
    </Card>
  )
}

function SchemeRecommendationsForm({
  onSubmit,
  isLoading,
}: { onSubmit: (data: any, flow: string) => void; isLoading: boolean }) {
  const [farmerProfile, setFarmerProfile] = useState("")
  const [location, setLocation] = useState("")
  const [commodity, setCommodity] = useState("")

  return (
    <Card className="kisaan-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          Government Schemes
        </CardTitle>
        <CardDescription>Get recommendations for suitable government schemes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Farmer Profile</label>
          <Textarea
            placeholder="Describe your farm size, income, crops, etc..."
            value={farmerProfile}
            onChange={(e) => setFarmerProfile(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Input placeholder="Your location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Primary Crop</label>
          <Input placeholder="Your main crop" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
        </div>
        <Button
          onClick={() => onSubmit({ farmerProfile, location, commodity }, "agriculturalSchemeRecommendation")}
          disabled={!farmerProfile.trim() || !location.trim() || !commodity.trim() || isLoading}
          className="w-full kisaan-button"
        >
          <FileText className="h-4 w-4 mr-2" />
          Find Schemes
        </Button>
      </CardContent>
    </Card>
  )
}

function CropLossPreventionForm({
  onSubmit,
  isLoading,
}: { onSubmit: (data: any, flow: string) => void; isLoading: boolean }) {
  const [cropType, setCropType] = useState("")
  const [location, setLocation] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [environmentalData, setEnvironmentalData] = useState("")

  return (
    <Card className="kisaan-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Sprout className="h-5 w-5 text-accent" />
          Crop Protection
        </CardTitle>
        <CardDescription>Preventive measures against crop damage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Crop Type</label>
          <Input placeholder="e.g., Rice, Wheat, Corn" value={cropType} onChange={(e) => setCropType(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Input placeholder="Your location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Symptoms</label>
          <Textarea
            placeholder="Symptoms observed in crops..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Environmental Data</label>
          <Textarea
            placeholder="Weather conditions, soil conditions, etc..."
            value={environmentalData}
            onChange={(e) => setEnvironmentalData(e.target.value)}
          />
        </div>
        <Button
          onClick={() => onSubmit({ cropType, location, symptoms, environmentalData }, "cropLossPrevention")}
          disabled={!cropType.trim() || !location.trim() || isLoading}
          className="w-full kisaan-button"
        >
          <Heart className="h-4 w-4 mr-2" />
          Get Protection Tips
        </Button>
      </CardContent>
    </Card>
  )
}

function CropLossReportForm({
  onSubmit,
  isLoading,
}: { onSubmit: (data: any, flow: string) => void; isLoading: boolean }) {
  const [farmerName, setFarmerName] = useState("")
  const [farmerContact, setFarmerContact] = useState("")
  const [cropType, setCropType] = useState("")
  const [location, setLocation] = useState("")
  const [lossPercentage, setLossPercentage] = useState("")
  const [reasonForLoss, setReasonForLoss] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")

  return (
    <Card className="kisaan-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Crop Loss Report
        </CardTitle>
        <CardDescription>Send report to NGO or government organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Farmer Name</label>
            <Input placeholder="Your name" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Contact Number</label>
            <Input
              placeholder="Phone number"
              value={farmerContact}
              onChange={(e) => setFarmerContact(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Crop Type</label>
            <Input placeholder="Crop name" value={cropType} onChange={(e) => setCropType(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input placeholder="Village, District" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Loss Percentage</label>
            <Input
              type="number"
              placeholder="% loss"
              value={lossPercentage}
              onChange={(e) => setLossPercentage(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Reason for Loss</label>
            <Input
              placeholder="e.g., Flood, Drought, Pests"
              value={reasonForLoss}
              onChange={(e) => setReasonForLoss(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Recipient Email</label>
          <Input
            type="email"
            placeholder="NGO or government organization email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Additional Details</label>
          <Textarea
            placeholder="Any other information..."
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            const data = {
              farmerName,
              farmerContact,
              cropType,
              location,
              lossPercentage: Number.parseInt(lossPercentage) || 0,
              reasonForLoss,
              recipientEmail,
              additionalDetails,
            }
            onSubmit(data, "reportCropLoss")
          }}
          disabled={
            !farmerName.trim() || !farmerContact.trim() || !cropType.trim() || !recipientEmail.trim() || isLoading
          }
          className="w-full kisaan-button"
        >
          <FileText className="h-4 w-4 mr-2" />
          Send Report
        </Button>
      </CardContent>
    </Card>
  )
}

function RemindersForm({ onSubmit, isLoading }: { onSubmit: (data: any, flow: string) => void; isLoading: boolean }) {
  const [task, setTask] = useState("")

  return (
    <Card className="kisaan-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Radio className="h-5 w-5 text-accent" />
          Kisaan Radio
        </CardTitle>
        <CardDescription>Create and listen to farm task reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">New Reminder</label>
          <Input placeholder="e.g., Water the tomatoes" value={task} onChange={(e) => setTask(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onSubmit({ task }, "createReminder")
              setTask("")
            }}
            disabled={!task.trim() || isLoading}
            className="flex-1 kisaan-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
          <Button variant="outline" onClick={() => onSubmit({ reminders: [] }, "listReminders")} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
