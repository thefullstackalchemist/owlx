const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MICROBRAIN = process.env.MODEL_MICROBRAIN ?? "nvidia/nemotron-3-super-120b-a12b:free";
export const MACROBRAIN = process.env.MODEL_MACROBRAIN ?? "nvidia/nemotron-3-super-120b-a12b:free";

interface Message {
  role:    "system" | "user" | "assistant";
  content: string;
}

function headers() {
  const key = process.env.OPENROUTER_KEY;
  if (!key) throw new Error("OPENROUTER_KEY is not set in .env.local");
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${key}`,
    "HTTP-Referer":  "http://localhost:3000",
    "X-Title":       "OWL Finance",
  };
}

class OpenRouterClient {
  /** Streaming generator — yields raw content tokens */
  async *streamChat(messages: Message[], model = MICROBRAIN): AsyncGenerator<string> {
    const res = await fetch(BASE_URL, {
      method:  "POST",
      headers: headers(),
      body:    JSON.stringify({ model, messages, stream: true }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const reader  = res.body!.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const chunk = JSON.parse(data);
          const token = chunk.choices?.[0]?.delta?.content;
          if (token) yield token as string;
        } catch { /* skip malformed */ }
      }
    }
  }

  /** Single-shot completion */
  async chat(messages: Message[], model = MICROBRAIN): Promise<string> {
    const res = await fetch(BASE_URL, {
      method:  "POST",
      headers: headers(),
      body:    JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "") as string;
  }

  async analyze(prompt: string): Promise<string> {
    return this.chat([{ role: "user", content: prompt }], MACROBRAIN);
  }
}

export const openrouter = new OpenRouterClient();
