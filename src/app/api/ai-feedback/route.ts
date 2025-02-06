import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  const { text, targetLanguage } = await request.json()

  const prompt = `Analyze the following ${targetLanguage} speech for pronunciation, fluency, and grammar. Provide feedback and a score out of 100:

Speech: "${text}"

Feedback:`

  try {
    const response = await openai.completions.create({
      model: 'gpt-4',
      prompt: prompt,
      max_tokens: 150,
    })

    const feedback = response.choices[0].text.trim()
    const scoreMatch = feedback.match(/Score: (\d+)/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null

    return NextResponse.json({ feedback, score })
  } catch (error) {
    console.error('Error getting AI feedback:', error)
    return NextResponse.json({ error: 'Failed to get AI feedback' }, { status: 500 })
  }
}
