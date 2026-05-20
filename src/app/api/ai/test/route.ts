import { NextResponse } from "next/server"
import { generateText, generateJson } from "@/lib/ai/gemini"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, prompt, systemInstruction } = body

    if (action === "text") {
      const response = await generateText(prompt || "Diga olá!", {
        systemInstruction:
          systemInstruction || "Você é um assistente da AXON, plataforma de ingressos online.",
      })
      return NextResponse.json({ success: true, response })
    }

    if (action === "insights") {
      // Exemplo de schema estruturado para insights e resposta de feedback
      const schema = {
        type: "OBJECT",
        properties: {
          sentiment: {
            type: "STRING",
            description: "O sentimento geral do feedback do cliente (positivo, neutro, negativo)",
          },
          keyTakeaways: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Pontos chaves extraídos do feedback do cliente",
          },
          suggestedReply: {
            type: "STRING",
            description: "Sugestão de resposta empática e profissional para o cliente",
          },
        },
        required: ["sentiment", "keyTakeaways", "suggestedReply"],
      }

      const defaultPrompt = `Feedback do cliente: "O checkout por Pix foi super rápido, mas achei o QR Code do ingresso meio confuso na hora de validar na portaria."`

      const response = await generateJson(prompt || defaultPrompt, {
        schema,
        systemInstruction:
          "Você é um analista de suporte e especialista em experiência do usuário da plataforma de ingressos AXON.",
      })

      return NextResponse.json({ success: true, response })
    }

    return NextResponse.json({ error: "Ação inválida. Use 'text' ou 'insights'." }, { status: 400 })
  } catch (error: unknown) {
    console.error("AI API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
