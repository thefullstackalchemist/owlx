import { OLLAMA_URL, MATH_MODEL, ANALYSIS_MODEL } from "@/constants";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StreamChunk {
  message: { content: string };
  done: boolean;
}

class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl = OLLAMA_URL) {
    this.baseUrl = baseUrl;
  }

  async *streamChat(
    messages: OllamaMessage[],
    model = MATH_MODEL
  ): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        const chunk: StreamChunk = JSON.parse(line);
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      }
    }
  }

  async chat(messages: OllamaMessage[], model = MATH_MODEL): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const data = await res.json();
    return data.message.content as string;
  }

  async analyze(prompt: string): Promise<string> {
    return this.chat(
      [{ role: "user", content: prompt }],
      ANALYSIS_MODEL
    );
  }
}

export const ollama = new OllamaClient();
