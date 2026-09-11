function env(name) {
  return Netlify.env.get(name);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function pickProvider(model) {
  const m = String(model || "Auto").toLowerCase();
  if (m.includes("claude")) return "anthropic";
  if (m.includes("gemini") || m.includes("nano banana")) return "gemini";
  if (m.includes("grok")) return "xai";
  if (m.includes("deepseek")) return "deepseek";
  if (m.includes("qwen")) return "qwen";
  return "openai";
}

function openAIModel(model) {
  const m = String(model || "").toLowerCase();
  if (m.includes("gpt")) return model.replace(/^GPT-?/i, "gpt-").toLowerCase();
  return "gpt-4o-mini";
}

function anthropicModel(model) {
  const m = String(model || "").toLowerCase();
  return m.includes("opus") ? "claude-opus-4-1" : "claude-sonnet-4-20250514";
}

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages.filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system") && typeof m.content === "string")
    : [];
}

async function callOpenAI(baseUrl, apiKey, model, messages) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Provider error ${response.status}`);
  return data?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(apiKey, model, messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const chat = messages.filter((m) => m.role !== "system");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: 2048, ...(system ? { system } : {}), messages: chat }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Anthropic error ${response.status}`);
  return data?.content?.filter((x) => x.type === "text").map((x) => x.text).join("\n") || "";
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json();
    const model = body?.model || "Auto";
    const messages = normalizeMessages(body?.messages);
    if (!messages.length) return json({ error: "No messages supplied" }, 400);

    let provider = pickProvider(model);
    const keys = {
      openai: env("OPENAI_API_KEY"),
      anthropic: env("ANTHROPIC_API_KEY"),
      gemini: env("GEMINI_API_KEY"),
      xai: env("XAI_API_KEY"),
      deepseek: env("DEEPSEEK_API_KEY"),
      qwen: env("QWEN_API_KEY"),
    };

    if (model === "Auto" || model === "Agent") {
      if (keys.openai) provider = "openai";
      else if (keys.anthropic) provider = "anthropic";
      else if (keys.gemini) provider = "gemini";
      else if (keys.xai) provider = "xai";
      else if (keys.deepseek) provider = "deepseek";
      else if (keys.qwen) provider = "qwen";
    }

    let text;
    if (provider === "openai" && keys.openai) {
      text = await callOpenAI("https://api.openai.com/v1", keys.openai, openAIModel(model), messages);
    } else if (provider === "anthropic" && keys.anthropic) {
      text = await callAnthropic(keys.anthropic, anthropicModel(model), messages);
    } else if (provider === "gemini" && keys.gemini) {
      return json({ error: "Gemini adapter is not configured yet. Add an OpenAI or Anthropic key first." }, 501);
    } else if (provider === "xai" && keys.xai) {
      text = await callOpenAI("https://api.x.ai/v1", keys.xai, "grok-4", messages);
    } else if (provider === "deepseek" && keys.deepseek) {
      text = await callOpenAI("https://api.deepseek.com/v1", keys.deepseek, "deepseek-chat", messages);
    } else if (provider === "qwen" && keys.qwen) {
      text = await callOpenAI("https://dashscope-intl.aliyuncs.com/compatible-mode/v1", keys.qwen, "qwen-plus", messages);
    } else {
      return json({ error: "No AI provider API key is configured in Netlify. Add OPENAI_API_KEY or ANTHROPIC_API_KEY in the kyzer-ai environment variables." }, 503);
    }

    return json({ reply: text, provider });
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || "AI request failed" }, 500);
  }
};
