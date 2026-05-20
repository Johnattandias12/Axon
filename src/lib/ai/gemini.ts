export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = "gemini-2.5-flash"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

/**
 * Generates simple text using Google's Gemini 2.5 Flash model.
 * 
 * @param prompt - The input prompt for the model.
 * @param options - Configuration options such as temperature and system instruction.
 * @returns The generated text string.
 */
export async function generateText(
  prompt: string,
  options?: {
    systemInstruction?: string
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<string> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.")
  }

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: options?.systemInstruction
        ? {
            parts: [{ text: options.systemInstruction }],
          }
        : undefined,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`)
  }

  const data: GeminiResponse = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("No text returned from Gemini API")
  }

  return text
}

/**
 * Generates a structured JSON object conforming to a specific schema using Gemini 2.5 Flash.
 * Great for extracting insights, structured responses, or customer sentiment analysis.
 * 
 * @param prompt - The input prompt for the model.
 * @param options - Configuration options including the JSON schema.
 * @returns The parsed JSON object of type T.
 */
export async function generateJson<T>(
  prompt: string,
  options?: {
    schema?: Record<string, any>
    systemInstruction?: string
    temperature?: number
  }
): Promise<T> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.")
  }

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: options?.systemInstruction
        ? {
            parts: [{ text: options.systemInstruction }],
          }
        : undefined,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: options?.schema,
        temperature: options?.temperature ?? 0.2,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`)
  }

  const data: GeminiResponse = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("No text returned from Gemini API")
  }

  try {
    return JSON.parse(text) as T
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON response: ${text}`)
  }
}
