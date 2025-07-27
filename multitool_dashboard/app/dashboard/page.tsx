"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
  Mic,
  MicOff,
  VolumeX,
  Play,
  Pause,
  Speaker,
  Languages,
  Globe,
  ChevronDown,
  LogOut,
  Home,
  LayoutGrid,
} from "lucide-react"
import { cn } from "@/lib/utils"
// dashboard/page.tsx
import { app } from "@/lib/firebase"; // adjust path based on your folder structure




interface Message {
  role: "user" | "assistant"
  content: string
  original_content?: string
  language?: string
  audio_path?: string
  gtts_audio_path?: string
  timestamp?: string
}

interface Session {
  session_id: string
  messages: Message[]
  preferred_language?: string
}

type FeatureType =
  | "overview"
  | "chat"
  | "disease-diagnosis"
  | "product-authentication"
  | "market-trends"
  | "scheme-recommendations"
  | "crop-loss-prevention"
  | "crop-loss-report"
  | "reminders"

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: "English",
  hi: "Hindi (हिंदी)",
  bn: "Bengali (বাংলা)",
  te: "Telugu (తెలుగు)",
  mr: "Marathi (मराठी)",
  ta: "Tamil (தமிழ்)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  or: "Odia (ଓଡ଼ିଆ)",
  as: "Assamese (অসমীয়া)",
  ur: "Urdu (اردو)",
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [isOnlineMode, setIsOnlineMode] = useState(false)
  const [fastApiPort, setFastApiPort] = useState("8001")
  const [activeFeature, setActiveFeature] = useState<FeatureType>("overview")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const gttsAudioRef = useRef<HTMLAudioElement>(null)

  // Separate message states for each feature
  const [overviewMessages, setOverviewMessages] = useState<Message[]>([])
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [diseaseMessages, setDiseaseMessages] = useState<Message[]>([])
  const [authMessages, setAuthMessages] = useState<Message[]>([])
  const [marketMessages, setMarketMessages] = useState<Message[]>([])
  const [schemeMessages, setSchemeMessages] = useState<Message[]>([])
  const [preventionMessages, setPreventionMessages] = useState<Message[]>([])
  const [reportMessages, setReportMessages] = useState<Message[]>([])
  const [reminderMessages, setReminderMessages] = useState<Message[]>([])

  // Helper function to get current messages based on active feature
  const getCurrentMessages = () => {
    switch (activeFeature) {
      case "overview":
        return overviewMessages
      case "chat":
        return chatMessages
      case "disease-diagnosis":
        return diseaseMessages
      case "product-authentication":
        return authMessages
      case "market-trends":
        return marketMessages
      case "scheme-recommendations":
        return schemeMessages
      case "crop-loss-prevention":
        return preventionMessages
      case "crop-loss-report":
        return reportMessages
      case "reminders":
        return reminderMessages
      default:
        return chatMessages
    }
  }

  // Helper function to set current messages based on active feature
  const setCurrentMessages = (newMessages: Message[]) => {
    switch (activeFeature) {
      case "overview":
        setOverviewMessages(newMessages)
        break
      case "chat":
        setChatMessages(newMessages)
        break
      case "disease-diagnosis":
        setDiseaseMessages(newMessages)
        break
      case "product-authentication":
        setAuthMessages(newMessages)
        break
      case "market-trends":
        setMarketMessages(newMessages)
        break
      case "scheme-recommendations":
        setSchemeMessages(newMessages)
        break
      case "crop-loss-prevention":
        setPreventionMessages(newMessages)
        break
      case "crop-loss-report":
        setReportMessages(newMessages)
        break
      case "reminders":
        setReminderMessages(newMessages)
        break
      default:
        setChatMessages(newMessages)
        break
    }
  }

  // Multilingual states
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [availableLanguages, setAvailableLanguages] = useState(SUPPORTED_LANGUAGES)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  // Feature-specific states
  const [diseaseStep, setDiseaseStep] = useState<1 | 2>(1)
  const [diseaseSymptoms, setDiseaseSymptoms] = useState("")
  const [diseasePhoto, setDiseasePhoto] = useState<string | null>(null)
  const [diagnosisResult, setDiagnosisResult] = useState("")
  const [farmerLocation, setFarmerLocation] = useState("")
  const [farmerPhone, setFarmerPhone] = useState("")

  // Voice input states
  const [isRecording, setIsRecording] = useState(false)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)

  // Text-to-speech states
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null)
  const [useGTTS, setUseGTTS] = useState(true)
  const [isPlayingGTTS, setIsPlayingGTTS] = useState(false)

  // Kisaan Radio states
  const [newTask, setNewTask] = useState("")
  const [reminders, setReminders] = useState([
    "Don't forget to water the tomatoes! 🍅 💧",
    "Time to check the soil moisture for the wheat crop. 🌾",
    "Apply fertilizer to the cornfields this afternoon. 🌽",
  ])
  const [broadcastMessage, setBroadcastMessage] = useState(
    `Namaste Kisaan bhaiyon aur behno! Kisaan Radio se aapka dost bol raha hoon! Suno suno suno! Important announcements hain! First things first, mere pyare Kisaan, tamatar ko paani dena mat bhoolna! 🍅💧 Those juicy tomatoes need their hydration! Next up, gehu ki fasal ke liye soil moisture check karna hai! 🌾 Time to get your hands dirty! Aur ant mein, cornfields mein fertilizer lagana hai aaj afternoon mein! 🌽 So, get those fertilizers ready! That's all for now! Happy farming and keep listening to Kisaan Radio!`,
  )

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      setIsCheckingAuth(true)

      const storedUser = localStorage.getItem("kisaan_user")
      if (!storedUser) {
        setIsCheckingAuth(false)
        router.push("/login")
        return
      }

      try {
        const userData = JSON.parse(storedUser)
        if (!userData.authenticated) {
          setIsCheckingAuth(false)
          router.push("/login")
          return
        }

        setUser(userData)
        await checkBackendAndInitialize()
        loadSupportedLanguages()
      } catch (error) {
        console.error("Authentication check failed:", error)
        localStorage.removeItem("kisaan_user")
        setIsCheckingAuth(false)
        router.push("/login")
        return
      }

      setIsCheckingAuth(false)
    }

    checkAuthentication()
  }, [router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [getCurrentMessages(), activeFeature])

  useEffect(() => {
    // Initialize speech recognition with language support
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false

      // Set language based on selected language
      const speechLang =
        selectedLanguage === "hi"
          ? "hi-IN"
          : selectedLanguage === "bn"
            ? "bn-IN"
            : selectedLanguage === "te"
              ? "te-IN"
              : selectedLanguage === "mr"
                ? "mr-IN"
                : selectedLanguage === "ta"
                  ? "ta-IN"
                  : selectedLanguage === "gu"
                    ? "gu-IN"
                    : selectedLanguage === "kn"
                      ? "kn-IN"
                      : selectedLanguage === "ml"
                        ? "ml-IN"
                        : selectedLanguage === "pa"
                          ? "pa-IN"
                          : "en-US"

      recognition.lang = speechLang

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsRecording(false)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      setSpeechRecognition(recognition)
    }

    // Initialize speech synthesis (fallback)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synthesis = window.speechSynthesis
      setSpeechSynthesis(synthesis)
    }
  }, [selectedLanguage])

  // Auto-play the latest assistant message using multilingual GTTS
  useEffect(() => {
    const currentMessages = getCurrentMessages()
    if (autoPlayEnabled && currentMessages.length > 0) {
      const latestMessage = currentMessages[currentMessages.length - 1]
      if (latestMessage.role === "assistant" && !isSpeaking && !isPlayingGTTS) {
        setTimeout(() => {
          playMessageAudio(latestMessage, currentMessages.length - 1)
        }, 500)
      }
    }
  }, [getCurrentMessages(), autoPlayEnabled, activeFeature])

  const logout = () => {
    localStorage.removeItem("kisaan_user")
    router.push("/login")
  }

  const loadSupportedLanguages = async () => {
    if (isOnlineMode) {
      try {
        const response = await fetch(`http://localhost:${fastApiPort}/api/supported_languages`)
        if (response.ok) {
          const data = await response.json()
          setAvailableLanguages(data.languages)
        }
      } catch (error) {
        console.error("Failed to load supported languages:", error)
      }
    }
  }

  const setLanguagePreference = async (language: string) => {
    setSelectedLanguage(language)
    setShowLanguageDropdown(false)

    if (isOnlineMode) {
      try {
        const response = await fetch(`http://localhost:${fastApiPort}/api/set_language`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ language }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Language preference set:", data)
        }
      } catch (error) {
        console.error("Failed to set language preference:", error)
      }
    }
  }

  const testMultilingual = async () => {
    if (!isOnlineMode) return

    setIsTranslating(true)
    try {
      const response = await fetch(`http://localhost:${fastApiPort}/api/test_multilingual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Hello! This is a test of KisaanSaathi's multilingual support with voice.",
          language: selectedLanguage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log("Multilingual test successful:", data)

          // Play the multilingual test audio
          if (data.audio_path && gttsAudioRef.current) {
            gttsAudioRef.current.src = `http://localhost:${fastApiPort}${data.audio_path}`
            gttsAudioRef.current.play()
          }

          // Add test message to chat
          const testMessage: Message = {
            role: "assistant",
            content: data.translated_text,
            original_content: data.original_text,
            language: selectedLanguage,
            gtts_audio_path: data.audio_path,
            timestamp: new Date().toLocaleTimeString(),
          }
          setCurrentMessages([...getCurrentMessages(), testMessage])
        } else {
          console.error("Multilingual test failed:", data.error)
        }
      }
    } catch (error) {
      console.error("Error testing multilingual:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const playMessageAudio = (message: Message, messageIndex?: number) => {
    stopAllAudio()

    if (messageIndex !== undefined) {
      setCurrentSpeakingIndex(messageIndex)
    }

    // Prefer multilingual GTTS audio if available
    if (useGTTS && message.gtts_audio_path && gttsAudioRef.current) {
      console.log("Playing multilingual GTTS audio:", message.gtts_audio_path)
      setIsPlayingGTTS(true)

      gttsAudioRef.current.src = `http://localhost:${fastApiPort}${message.gtts_audio_path}`

      gttsAudioRef.current.onloadeddata = () => {
        gttsAudioRef.current?.play().catch((error) => {
          console.error("Error playing multilingual GTTS audio:", error)
          fallbackToBrowserTTS(message.content, messageIndex)
        })
      }

      gttsAudioRef.current.onended = () => {
        setIsPlayingGTTS(false)
        setCurrentSpeakingIndex(null)
      }

      gttsAudioRef.current.onerror = (error) => {
        console.error("Multilingual GTTS audio error:", error)
        setIsPlayingGTTS(false)
        fallbackToBrowserTTS(message.content, messageIndex)
      }
    }
    // Fallback to original audio path
    else if (message.audio_path && audioRef.current) {
      console.log("Playing original audio:", message.audio_path)
      audioRef.current.src = `http://localhost:${fastApiPort}${message.audio_path}`
      audioRef.current.play().catch((error) => {
        console.error("Error playing original audio:", error)
        fallbackToBrowserTTS(message.content, messageIndex)
      })
    }
    // Fallback to browser TTS
    else {
      fallbackToBrowserTTS(message.content, messageIndex)
    }
  }

  const fallbackToBrowserTTS = (text: string, messageIndex?: number) => {
    if (!speechSynthesis || isSpeaking) return

    console.log("Using browser TTS fallback")

    speechSynthesis.cancel()

    const cleanText = text
      .replace(/[🌾🌱🛡️📈📋🚨📻✅❌]/gu, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n\n/g, ". ")
      .replace(/\n/g, " ")
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8

    // Try to find a voice for the selected language
    const voices = speechSynthesis.getVoices()
    const languageCode =
      selectedLanguage === "hi" ? "hi" : selectedLanguage === "bn" ? "bn" : selectedLanguage === "te" ? "te" : "en"

    const preferredVoice =
      voices.find((voice) => voice.lang.startsWith(languageCode)) || voices.find((voice) => voice.lang.startsWith("en"))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      if (messageIndex !== undefined) {
        setCurrentSpeakingIndex(messageIndex)
      }
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setCurrentSpeakingIndex(null)
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error)
      setIsSpeaking(false)
      setCurrentSpeakingIndex(null)
    }

    speechSynthesis.speak(utterance)
  }

  const stopAllAudio = () => {
    if (gttsAudioRef.current) {
      gttsAudioRef.current.pause()
      gttsAudioRef.current.currentTime = 0
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (speechSynthesis) {
      speechSynthesis.cancel()
    }

    setIsSpeaking(false)
    setIsPlayingGTTS(false)
    setCurrentSpeakingIndex(null)
  }

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
          setChatMessages(formattedMessages)
        } else {
          setChatMessages([
            {
              role: "assistant",
              content: `🌾 Namaste! I'm your Kisaan Saathi. How can I help you today?

**Your agricultural services are ready:**
- ✅ KisaanSaathi AI: Connected
- ✅ Multilingual Support: 13 languages available
- 🔊 High-quality voice responses
- 🌐 Auto-translation enabled

**Available Services:**
🌱 Fasal Suraksha - Disease Diagnosis & Treatment
🛡️ Beej Pehchan - Product Authentication  
📈 Bazaar Dost - Market Trends & Prices
📋 Yojna Sahayak - Government Schemes
🚨 Sankat Mitra - Crop Loss Reporting
📻 Kisaan Radio - Task Reminders

Select any service from the sidebar or chat with me directly!`,
              language: "en",
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

    setChatMessages([
      {
        role: "assistant",
        content: "Namaste! I'm your Kisaan Saathi. How can I help you today?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  // const sendMessage = async (customMessage?: string, flow?: string) => {
  //   const messageToSend = customMessage || inputMessage
  //   if (!messageToSend.trim() || isLoading) return

  //   stopAllAudio()

  //   const userMessage: Message = {
  //     role: "user",
  //     content: messageToSend,
  //     language: selectedLanguage,
  //     timestamp: new Date().toLocaleTimeString(),
  //   }

  //   setCurrentMessages([...getCurrentMessages(), userMessage])
  //   setInputMessage("")
  //   setIsLoading(true)

  //   if (isOnlineMode) {
  //     try {
  //       const response = await fetch(`http://localhost:${fastApiPort}/api/send_message`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //         body: JSON.stringify({ message: messageToSend }),
  //       })

  //       if (response.ok) {
  //         const data = await response.json()
  //         if (data.messages) {
  //           const formattedMessages = data.messages.map((msg: any) => ({
  //             ...msg,
  //             timestamp: new Date().toLocaleTimeString(),
  //           }))
  //           setCurrentMessages(formattedMessages)

  //           // Update detected language if provided
  //           if (data.detected_language) {
  //             setDetectedLanguage(data.detected_language)
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Failed to send message:", error)
  //     }
  //   } else {
  //     // Demo response
  //     setTimeout(() => {
  //       const demoResponse: Message = {
  //         role: "assistant",
  //         content: `Demo Response: Thank you for "${messageToSend}"! Connect the backend for real AI responses with multilingual support and GTTS audio.`,
  //         timestamp: new Date().toLocaleTimeString(),
  //       }
  //       setCurrentMessages([...getCurrentMessages(), demoResponse])
  //     }, 1000)
  //   }

  //   setIsLoading(false)
  // }

const sendMessage = async (customMessage?: string, flow?: string) => {
  const messageToSend = customMessage || inputMessage
  if (!messageToSend.trim() || isLoading) return

  stopAllAudio()

  const userMessage: Message = {
    role: "user",
    content: messageToSend,
    language: selectedLanguage,
    timestamp: new Date().toLocaleTimeString(),
  }

  // Optimistically add user message to UI
  setCurrentMessages([...getCurrentMessages(), userMessage])
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
        body: JSON.stringify({ 
          message: messageToSend,
          language: selectedLanguage  // Add this line to pass the selected language
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          // Find the latest assistant message in the returned messages
          const latestAssistantMessage = data.messages.slice().reverse().find((msg: any) => msg.role === "assistant");

          if (latestAssistantMessage) {
               // Update messages with the full message list from backend, which includes translations and audio paths
              const formattedMessages = data.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date().toLocaleTimeString(),
              }))
            setCurrentMessages(formattedMessages)

            // Update detected language if provided
            if (data.detected_language) {
              setDetectedLanguage(data.detected_language)
            }

          } else {
               console.warn("No new assistant message found in backend response:", data);
                // If no assistant message, at least update with the messages provided
                 const formattedMessages = data.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date().toLocaleTimeString(),
                }))
              setCurrentMessages(formattedMessages)
          }


        } else {
           console.error("Backend response indicated failure or missing messages:", data);
           const errorMessages: Message[] = data.messages || [];
            setCurrentMessages([...getCurrentMessages(), ...errorMessages, {
              role: "assistant",
              content: data.error || "An error occurred while processing your request.",
              timestamp: new Date().toLocaleTimeString(),
              language: "en" // Default to English for error messages
            }]);
        }
      } else {
         console.error("Failed to send message. HTTP Status:", response.status);
         const errorText = await response.text();
           setCurrentMessages([...getCurrentMessages(), {
              role: "assistant",
              content: `Error: Could not connect to backend or receive valid response (Status: ${response.status}). Details: ${errorText.substring(0, 100)}...`,
              timestamp: new Date().toLocaleTimeString(),
              language: "en"
            }]);
      }
    } catch (error) {
      console.error("Failed to send message:", error)
       setCurrentMessages([...getCurrentMessages(), {
          role: "assistant",
          content: `Error: Failed to send message to backend. Please check console for details. ${error}`,
          timestamp: new Date().toLocaleTimeString(),
          language: "en"
        }]);
    }
  } else {
    // Demo response for offline mode
    setTimeout(() => {
      const demoResponse: Message = {
        role: "assistant",
        content: `Demo Response: Thank you for "${messageToSend}"! Connect the backend for real AI responses with multilingual support and GTTS audio.`,
        timestamp: new Date().toLocaleTimeString(),
        language: "en" // Demo response is in English
      }
      setCurrentMessages([...getCurrentMessages(), demoResponse])
    }, 1000)
  }

  setIsLoading(false)
}


  // const handleFeatureSubmit = async (data: any, flow: string) => {
  //   setIsLoading(true)
  //   stopAllAudio()

  //   // Create user-friendly message instead of showing JSON
  //   let userMessage = ""
  //   switch (flow) {
  //     case "diagnosePlantDisease":
  //       userMessage = `I need help diagnosing a plant disease. Symptoms: ${data.symptoms}`
  //       break
  //     case "authenticateProduct":
  //       userMessage = "I want to verify the authenticity of a product using its photo."
  //       break
  //     case "getMarketTrends":
  //       userMessage = `Please show me market trends for ${data.commodity} in ${data.location}.`
  //       break
  //     case "agriculturalSchemeRecommendation":
  //       userMessage = `I need government scheme recommendations for my farm in ${data.location}.`
  //       break
  //     case "cropLossPrevention":
  //       userMessage = `I need crop protection advice for ${data.cropType} in ${data.location}.`
  //       break
  //     case "reportCropLoss":
  //       userMessage = `I want to report crop loss: ${data.lossPercentage}% loss of ${data.cropType} due to ${data.reasonForLoss}.`
  //       break
  //     case "createReminder":
  //       userMessage = `Please add this reminder: ${data.task}`
  //       break
  //     default:
  //       userMessage = "I need assistance with my farming query."
  //   }

  //   // Add user message to chat
  //   const userChatMessage: Message = {
  //     role: "user",
  //     content: userMessage,
  //     language: selectedLanguage,
  //     timestamp: new Date().toLocaleTimeString(),
  //   }

  //   setCurrentMessages([...getCurrentMessages(), userChatMessage])

  //   if (isOnlineMode) {
  //     try {
  //       const response = await fetch(`http://localhost:${fastApiPort}/api/send_message`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //         body: JSON.stringify({
  //           message: `Flow: ${flow}\nData: ${JSON.stringify(data, null, 2)}`,
  //         }),
  //       })

  //       if (response.ok) {
  //         const responseData = await response.json()
  //         if (responseData.messages) {
  //           const formattedMessages = responseData.messages.map((msg: any) => ({
  //             ...msg,
  //             timestamp: new Date().toLocaleTimeString(),
  //           }))
  //           setCurrentMessages(formattedMessages)
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Failed to submit feature data:", error)
  //     }
  //   }

  //   setIsLoading(false)
  // }

  const handleFeatureSubmit = async (data: any, flow: string) => {
  setIsLoading(true)
  stopAllAudio()

  // Create user-friendly message instead of showing JSON
  let userMessage = ""
  switch (flow) {
    case "diagnosePlantDisease":
      userMessage = `I need help diagnosing a plant disease. Symptoms: ${data.symptoms}`
      break
    case "authenticateProduct":
      userMessage = "I want to verify the authenticity of a product using its photo."
      break
    case "getMarketTrends":
      userMessage = `Please show me market trends for ${data.commodity} in ${data.location}.`
      break
    case "agriculturalSchemeRecommendation":
      userMessage = `I need government scheme recommendations for my farm in ${data.location}.`
      break
    case "cropLossPrevention":
      userMessage = `I need crop protection advice for ${data.cropType} in ${data.location}.`
      break
    case "reportCropLoss":
      userMessage = `I want to report crop loss: ${data.lossPercentage}% loss of ${data.cropType} due to ${data.reasonForLoss}.`
      break
    case "createReminder":
      userMessage = `Please add this reminder: ${data.task}`
      break
    default:
      userMessage = "I need assistance with my farming query."
  }

  // Add user message to chat first
  const userChatMessage: Message = {
    role: "user",
    content: userMessage,
    language: selectedLanguage,
    timestamp: new Date().toLocaleTimeString(),
  }
  setCurrentMessages([...getCurrentMessages(), userChatMessage])

  // Use the sendMessage function to send the user-friendly message instead of raw data
  if (isOnlineMode) {
    try {
      const response = await fetch(`http://localhost:${fastApiPort}/api/send_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,  // CLEAN MESSAGE ONLY
          flow: flow,           // SEND FLOW AS SEPARATE FIELD
          data: data,           // SEND DATA AS SEPARATE FIELD
          language: selectedLanguage,
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success && responseData.messages) {
          const formattedMessages = responseData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date().toLocaleTimeString(),
          }))
          setCurrentMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error("Failed to submit feature data:", error)
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        language: "en"
      }
      setCurrentMessages([...getCurrentMessages(), errorMessage])
    }
  } else {
    // Demo response
    setTimeout(() => {
      const demoResponse: Message = {
        role: "assistant",
        content: `Demo Response: I received your request for ${flow}. Connect the backend for real AI processing of your agricultural needs.`,
        timestamp: new Date().toLocaleTimeString(),
        language: "en"
      }
      setCurrentMessages([...getCurrentMessages(), demoResponse])
    }, 1000)
  }

  setIsLoading(false)
}

  const createNewSession = async () => {
    setIsLoading(true)
    stopAllAudio()

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
          // Clear all message states
          setOverviewMessages([])
          setChatMessages([])
          setDiseaseMessages([])
          setAuthMessages([])
          setMarketMessages([])
          setSchemeMessages([])
          setPreventionMessages([])
          setReportMessages([])
          setReminderMessages([])
        }
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    } else {
      initializeDemoMode()
      // Clear all message states
      setOverviewMessages([])
      setChatMessages([])
      setDiseaseMessages([])
      setAuthMessages([])
      setMarketMessages([])
      setSchemeMessages([])
      setPreventionMessages([])
      setReportMessages([])
      setReminderMessages([])
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
        return `Connected + Multilingual GTTS`
      case "disconnected":
        return "Demo Mode (No Translation)"
    }
  }

  const features = [
    { id: "overview", name: "Dashboard Overview", icon: Home, description: "Main dashboard view" },
    { id: "chat", name: "Kisaan Saathi", icon: MessageSquare, description: "Direct conversation with AI" },
    { id: "disease-diagnosis", name: "Fasal Suraksha", icon: Leaf, description: "Identify plant diseases" },
    {
      id: "product-authentication",
      name: "Beej Pehchan",
      icon: Shield,
      description: "Verify product authenticity",
    },
    { id: "market-trends", name: "Bazaar Dost", icon: TrendingUp, description: "Price information" },
    { id: "scheme-recommendations", name: "Yojna Sahayak", icon: FileText, description: "Scheme recommendations" },
    { id: "crop-loss-prevention", name: "Kisaan Rakshak", icon: Sprout, description: "Prevent crop damage" },
    { id: "crop-loss-report", name: "Sankat Mitra", icon: Users, description: "Report crop losses" },
    { id: "reminders", name: "Kisaan Radio", icon: Radio, description: "Task reminders" },
  ]

  const renderOverview = () => (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Welcome to KisaanSaathi Dashboard</h1>
        <p className="text-lg text-green-600">Your comprehensive agricultural management platform</p>
      </div>

      {/* Service Cards - Full Width Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {features.slice(2).map((feature) => (
          <Card
            key={feature.id}
            className="kisaan-card cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 min-h-[200px]"
            onClick={() => setActiveFeature(feature.id as FeatureType)}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-start gap-4 text-xl">
                <div className="p-4 bg-green-100 rounded-xl flex-shrink-0">
                  <feature.icon className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-green-800 mb-2">{feature.name}</div>
                  <div className="text-sm text-muted-foreground font-normal leading-relaxed">{feature.description}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full kisaan-button text-base py-3" size="lg">
                Open {feature.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <Card className="kisaan-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold text-green-800">{getCurrentMessages().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kisaan-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Languages className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="text-sm font-medium text-orange-800">
                  {availableLanguages[selectedLanguage as keyof typeof availableLanguages]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kisaan-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Speaker className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Audio</p>
                <p className="text-sm font-medium text-blue-800">{isOnlineMode ? "GTTS Enabled" : "Browser TTS"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kisaan-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{backendStatus === "connected" ? "Online" : "Offline"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const addReminder = () => {
    if (newTask.trim()) {
      setReminders([...reminders, newTask.trim()])
      setNewTask("")

      // Send to backend if connected
      if (isOnlineMode) {
        handleFeatureSubmit({ task: newTask.trim() }, "createReminder")
      }
    }
  }

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case "overview":
        return renderOverview()

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
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Create New Reminder */}
            <Card className="kisaan-card">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Create New Reminder</CardTitle>
                <CardDescription>Add a new task to your Kisaan Radio reminder list.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Task Description</label>
                  <Textarea
                    placeholder="e.g., Water the crops"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="min-h-[100px] bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <Button
                  onClick={addReminder}
                  disabled={!newTask.trim() || isLoading}
                  className="w-full kisaan-button text-white font-medium py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Reminder
                </Button>
              </CardContent>
            </Card>

            {/* Kisaan Radio Broadcast */}
            <Card className="kisaan-card">
              <CardHeader className="pb-4">
                <CardTitle className="font-headline text-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Radio className="h-6 w-6 text-blue-600" />
                  </div>
                  Kisaan Radio Broadcast
                </CardTitle>
                <CardDescription>Your reminders, read out loud in style!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 min-h-[200px]">
                  <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{broadcastMessage}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (speechSynthesis) {
                        const utterance = new SpeechSynthesisUtterance(broadcastMessage)
                        utterance.rate = 0.9
                        speechSynthesis.speak(utterance)
                      }
                    }}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Broadcast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newBroadcast = `Namaste Kisaan bhaiyon aur behno! Fresh updates from Kisaan Radio! ${reminders.map((reminder, index) => `${index + 1}. ${reminder}`).join(" ")} Keep farming and stay connected!`
                      setBroadcastMessage(newBroadcast)
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Your Reminders */}
            <Card className="kisaan-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Your Reminders</CardTitle>
                <CardDescription>Here is your current list of tasks.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminders.map((reminder, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-800">{reminder}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newReminders = reminders.filter((_, i) => i !== index)
                          setReminders(newReminders)
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {reminders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radio className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No reminders yet. Create your first reminder above!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const startRecording = () => {
    if (speechRecognition) {
      stopAllAudio()
      setIsRecording(true)
      speechRecognition.start()
    }
  }

  const stopRecording = () => {
    if (speechRecognition) {
      speechRecognition.stop()
      setIsRecording(false)
    }
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Wheat className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Sidebar */}
      <div className="w-80 kisaan-sidebar border-r-2 border-green-300 flex flex-col shadow-xl">
        <div className="p-6 border-b-2 border-green-400 kisaan-gradient">
          <h1 className="text-xl font-headline font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wheat className="h-6 w-6 text-white" />
            </div>
            KisaanSaathi
          </h1>
          <p className="text-white/90 text-sm mt-1">Agricultural Dashboard</p>

          {/* User Info */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <User className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/90 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

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

          {/* Language Selection */}
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Languages className="h-3 w-3" />
              Language Settings
            </h4>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between text-sm bg-transparent"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {availableLanguages[selectedLanguage as keyof typeof availableLanguages] || "English"}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {showLanguageDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {Object.entries(availableLanguages).map(([code, name]) => (
                    <button
                      key={code}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors",
                        selectedLanguage === code && "bg-green-100 text-green-800",
                      )}
                      onClick={() => setLanguagePreference(code)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {detectedLanguage && detectedLanguage !== selectedLanguage && (
              <div className="mt-2 text-xs text-muted-foreground">
                Detected: {availableLanguages[detectedLanguage as keyof typeof availableLanguages]}
              </div>
            )}

            {isOnlineMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={testMultilingual}
                className="w-full text-xs bg-transparent mt-2"
                disabled={isTranslating}
              >
                {isTranslating ? "Testing..." : "Test Multilingual"}
              </Button>
            )}
          </div>

          {/* Voice Settings */}
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Speaker className="h-3 w-3" />
              Voice Settings {isOnlineMode && "(Multilingual GTTS)"}
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Auto-play responses</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                className={cn("h-8 w-8 p-0", autoPlayEnabled ? "text-primary" : "text-muted-foreground")}
              >
                {autoPlayEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
            {(isSpeaking || isPlayingGTTS) && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isPlayingGTTS
                    ? `Playing in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]}...`
                    : "Speaking..."}
                </span>
                <Button variant="ghost" size="sm" onClick={stopAllAudio} className="h-6 w-6 p-0">
                  <Pause className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-headline font-medium text-sm text-muted-foreground mb-3">Services</h3>
            {features.map((feature) => (
              <Button
                key={feature.id}
                variant={activeFeature === feature.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3 text-left transition-all duration-200",
                  activeFeature === feature.id
                    ? "kisaan-button shadow-lg"
                    : "hover:bg-green-100 hover:text-green-800 text-green-700",
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
              {selectedLanguage !== "en" && (
                <Badge variant="outline" className="text-xs ml-2">
                  {availableLanguages[selectedLanguage as keyof typeof availableLanguages]}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="kisaan-header p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-headline font-semibold text-foreground">
                {features.find((f) => f.id === activeFeature)?.name || "KisaanSaathi Dashboard"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isOnlineMode
                  ? `Multilingual Support: ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]} • GTTS Audio • Auto-Translation`
                  : ""}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Feature Content - Full Width for Overview, Sidebar for Others */}
          {activeFeature === "overview" ? (
            <div className="flex-1 overflow-y-auto bg-background/50">{renderFeatureContent()}</div>
          ) : activeFeature !== "chat" && activeFeature !== "reminders" ? (
            <>
              <div className="w-96 border-r border-border/50 p-6 overflow-y-auto bg-background/50">
                {renderFeatureContent()}
              </div>
              {/* Chat Section for non-overview features */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {getCurrentMessages().length === 0 ? (
                      <div className="text-center py-8">
                        <div className="p-4 bg-green-100 rounded-full mb-4 border-2 border-green-300 inline-flex">
                          <LayoutGrid className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-headline font-medium text-foreground mb-2">
                          Service Configuration
                        </h3>
                        <p className="text-muted-foreground">
                          Configure the {features.find((f) => f.id === activeFeature)?.name} service in the left panel.
                          Results and AI responses will appear here.
                        </p>
                      </div>
                    ) : (
                      getCurrentMessages().map((message, index) => (
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
                              "max-w-[70%]",
                              message.role === "user"
                                ? "kisaan-message-user shadow-lg"
                                : "kisaan-message-assistant shadow-md",
                              currentSpeakingIndex === index ? "ring-4 ring-green-400 ring-opacity-50" : "",
                            )}
                          >
                            <CardContent className="p-3">
                              <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                              {message.original_content && message.original_content !== message.content && (
                                <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                  <span className="text-muted-foreground">Original: </span>
                                  <span className="italic">{message.original_content}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {message.role === "assistant" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => playMessageAudio(message, index)}
                                    disabled={(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index}
                                  >
                                    {(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index ? (
                                      <Pause className="h-4 w-4 mr-1" />
                                    ) : (
                                      <Play className="h-4 w-4 mr-1" />
                                    )}
                                    {(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index
                                      ? "Playing..."
                                      : message.gtts_audio_path
                                        ? `Play ${availableLanguages[message.language as keyof typeof availableLanguages] || "Audio"}`
                                        : message.audio_path
                                          ? "Play Audio"
                                          : "Speak"}
                                  </Button>
                                )}
                                {message.language && message.language !== "en" && (
                                  <Badge variant="outline" className="text-xs">
                                    {availableLanguages[message.language as keyof typeof availableLanguages]}
                                  </Badge>
                                )}
                              </div>
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
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
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

                {/* Input Area */}
                <div className="kisaan-header border-t-2 border-green-200 p-4">
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
                            ? `Ask KisaanSaathi in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]}...`
                            : "Type a message or use voice input..."
                        }
                        className="flex-1 font-body"
                        disabled={isLoading}
                      />
                      {speechRecognition && (
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isLoading}
                          variant={isRecording ? "destructive" : "outline"}
                          className={cn("transition-all duration-200", isRecording && "animate-pulse")}
                          title={`Voice input in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]}`}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isLoading}
                        className="kisaan-button"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-body">
                      Press Enter to send •{" "}
                      {speechRecognition
                        ? `Voice input in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]} • `
                        : ""}
                      {isOnlineMode ? "Multilingual GTTS audio • Auto-translation • " : "Browser TTS available • "}
                      Messages are processed through KisaanSaathi AI
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeFeature === "reminders" ? (
            <div className="flex-1 p-6 overflow-y-auto bg-background/50">{renderFeatureContent()}</div>
          ) : (
            // Chat Section - Full Width
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {getCurrentMessages().length === 0 ? (
                    <Card className="border-dashed kisaan-card">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 bg-green-100 rounded-full mb-4 border-2 border-green-300">
                          <MessageSquare className="h-12 w-12 text-green-600" />
                        </div>
                        <h3 className="text-lg font-headline font-medium text-foreground mb-2">AI Chat Assistant</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                          Start a conversation with KisaanSaathi AI in your preferred language. Get instant help with
                          farming questions, crop advice, and more.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    getCurrentMessages().map((message, index) => (
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
                            "max-w-[70%]",
                            message.role === "user"
                              ? "kisaan-message-user shadow-lg"
                              : "kisaan-message-assistant shadow-md",
                            currentSpeakingIndex === index ? "ring-4 ring-green-400 ring-opacity-50" : "",
                          )}
                        >
                          <CardContent className="p-3">
                            <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                            {message.original_content && message.original_content !== message.content && (
                              <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                <span className="text-muted-foreground">Original: </span>
                                <span className="italic">{message.original_content}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {message.role === "assistant" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => playMessageAudio(message, index)}
                                  disabled={(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index}
                                >
                                  {(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index ? (
                                    <Pause className="h-4 w-4 mr-1" />
                                  ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                  )}
                                  {(isSpeaking || isPlayingGTTS) && currentSpeakingIndex === index
                                    ? "Playing..."
                                    : message.gtts_audio_path
                                      ? `Play ${availableLanguages[message.language as keyof typeof availableLanguages] || "Audio"}`
                                      : message.audio_path
                                        ? "Play Audio"
                                        : "Speak"}
                                </Button>
                              )}
                              {message.language && message.language !== "en" && (
                                <Badge variant="outline" className="text-xs">
                                  {availableLanguages[message.language as keyof typeof availableLanguages]}
                                </Badge>
                              )}
                            </div>
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
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
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

              {/* Input Area */}
              <div className="kisaan-header border-t-2 border-green-200 p-4">
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
                          ? `Ask KisaanSaathi in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]}...`
                          : "Type a message or use voice input..."
                      }
                      className="flex-1 font-body"
                      disabled={isLoading}
                    />
                    {speechRecognition && (
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                        variant={isRecording ? "destructive" : "outline"}
                        className={cn("transition-all duration-200", isRecording && "animate-pulse")}
                        title={`Voice input in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]}`}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="kisaan-button"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-body">
                    Press Enter to send •{" "}
                    {speechRecognition
                      ? `Voice input in ${availableLanguages[selectedLanguage as keyof typeof availableLanguages]} • `
                      : ""}
                    {isOnlineMode ? "Multilingual GTTS audio • Auto-translation • " : "Browser TTS available • "}
                    Messages are processed through KisaanSaathi AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio elements */}
      <audio ref={audioRef} />
      <audio ref={gttsAudioRef} />
    </div>
  )
}

// Additional Form Components (keeping existing ones)
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



