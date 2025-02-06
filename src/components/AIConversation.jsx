"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AIConversation() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [conversation, setConversation] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef(null)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  useEffect(() => {
    if (transcript) {
      handleSendMessage(transcript)
      setTranscript("")
    }
  }, [transcript])

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel()
      }
    }
  }, [])

  const speakText = (text) => {
    if (synth) {
      // Cancel any ongoing speech
      synth.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      synth.speak(utterance)
    }
  }

  const startListening = () => {
    setIsListening(true)
    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onresult = (event) => {
      const last = event.results.length - 1
      const text = event.results[last][0].transcript
      setTranscript(text)
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleSendMessage = async (message) => {
    setIsLoading(true)
    setConversation((prev) => [...prev, { role: "user", content: message }])

    try {
      const response = await fetch("/api/ai-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversation.map((c) => `${c.role}: ${c.content}`),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      const aiResponse = data.response
      setConversation((prev) => [...prev, { role: "ai", content: aiResponse }])
      
      // Speak the AI response
      speakText(aiResponse)
    } catch (error) {
      console.error("Error in AI conversation:", error)
      const errorMessage = "I apologize, but I encountered an error. Could you please try again?"
      setConversation((prev) => [...prev, { role: "ai", content: errorMessage }])
      speakText(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      synth?.cancel()
      setIsSpeaking(false)
    } else if (conversation.length > 0) {
      // Speak the last AI message
      const lastAiMessage = [...conversation].reverse().find(msg => msg.role === 'ai')
      if (lastAiMessage) {
        speakText(lastAiMessage.content)
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Talk with AI English Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          {conversation.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block p-2 rounded-lg ${message.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}
              >
                {message.content}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="text-center">
              <span className="inline-block p-2 rounded-lg bg-gray-100">Thinking...</span>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={isListening ? stopListening : startListening} 
          className="flex-1"
          disabled={isSpeaking}
        >
          {isListening ? "🛑 Stop Listening" : "🎤 Start Talking"}
        </Button>
        <Button 
          onClick={toggleSpeech} 
          variant="outline" 
          className="w-12"
          disabled={isLoading || conversation.length === 0}
        >
          {isSpeaking ? "🔇" : "🔊"}
        </Button>
      </CardFooter>
    </Card>
  )
}