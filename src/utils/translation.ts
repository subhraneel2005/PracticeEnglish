const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY

export async function translateText(text: string, targetLanguage: string) {
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
    }),
  })

  const data = await response.json()
  return data.data.translations[0].translatedText
}

