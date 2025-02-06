"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { startSpeechRecognition } from "@/utils/speechRecognition"
import { translateText as translateTextUtil } from "@/utils/translation"

// Type definitions
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type LanguageDirection = "hindi-to-english" | "english-to-hindi"

interface AIFeedbackResponse {
  feedback: string
  score: number
}

export default function LanguagePractice() {
  const [language, setLanguage] = useState<LanguageDirection>("hindi-to-english")
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [translation, setTranslation] = useState("")
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageDirection)
  }

  const startListening = () => {
    setIsListening(true)
    recognitionRef.current = startSpeechRecognition(
      (transcript: string) => {
        setTranscript(transcript)
        handleTranslation(transcript)
      },
      () => setIsListening(false)
    )
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleTranslation = async (text: string) => {
    try {
      const targetLanguage = language === "hindi-to-english" ? "en" : "hi"
      const translatedText = await translateTextUtil(text, targetLanguage)
      setTranslation(translatedText)
      speakText(translatedText, targetLanguage)
    } catch (error) {
      console.error("Translation error:", error)
    }
  }

  const speakText = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    window.speechSynthesis.speak(utterance)
  }

  const handleAIFeedback = async () => {
    if (transcript) {
      setIsLoading(true)
      try {
        const targetLanguage = language === "hindi-to-english" ? "English" : "Hindi"
        const response = await fetch("/api/ai-feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: transcript, targetLanguage }),
        })

        if (!response.ok) {
          throw new Error("Failed to get AI feedback")
        }

        const data = await response.json() as AIFeedbackResponse
        setFeedback(data.feedback)
        setScore(data.score)
      } catch (error) {
        console.error("Error getting AI feedback:", error)
        setFeedback("Failed to get AI feedback. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Language Practice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select onValueChange={handleLanguageChange} defaultValue={language}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hindi-to-english">Hindi to English</SelectItem>
              <SelectItem value="english-to-hindi">English to Hindi</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Button onClick={isListening ? stopListening : startListening} className="w-full">
              {isListening ? "🛑 Stop" : "🎤 Start Speaking"}
            </Button>
          </div>
          {transcript && (
            <div>
              <h3 className="font-semibold">You said:</h3>
              <p>{transcript}</p>
            </div>
          )}
          {translation && (
            <div>
              <h3 className="font-semibold">Translation:</h3>
              <p>{translation}</p>
            </div>
          )}
          {feedback && (
            <div>
              <h3 className="font-semibold">AI Feedback:</h3>
              <p>{feedback}</p>
              {score !== null && <p>Score: {score}/100</p>}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAIFeedback} className="w-full" disabled={isLoading || !transcript}>
          {isLoading ? "Loading..." : "📊 Get AI Feedback"}
        </Button>
      </CardFooter>
    </Card>
  )
}