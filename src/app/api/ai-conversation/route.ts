import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  const { message, conversationHistory } = await request.json()

  const systemPrompt = `You are a kind, humble, and appreciative Spoken English teacher. Your goal is to help the student improve their English speaking skills. Provide gentle feedback on pronunciation, grammar, and fluency. Always be encouraging and positive.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg: string) => ({
          role: 'user' as const,
          content: msg
        })),
        { role: 'user', content: message }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const aiResponse = response.choices[0].message.content?.trim() || ''
    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Error in AI conversation:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' }, 
      { status: 500 }
    )
  }
}