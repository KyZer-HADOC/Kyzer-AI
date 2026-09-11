import React, { useEffect, useState } from "react";
import {
  Send, Paperclip, Plus, Settings, Plug, Zap,
  ChevronDown, Menu, X, Loader2, KeyRound
} from "lucide-react";
import { createRoot } from "react-dom/client";
import "./style.css";

const models = [
  "Auto","Agent","GPT-5.6","Claude Sonnet","Claude Opus",
  "Gemini","Nano Banana","Grok","DeepSeek","Qwen"
];

const defaultChats = [
  "Build my Minecraft mod",
  "Fix Fabric error",
  "Create AI website",
  "Aura SMP setup",
  "JARVIS AI"
];

function App() {
  const [model, setModel] = useState("Auto");
  const [text, setText] = useState("");
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [keys, setKeys] = useState(() => ({
    openai: localStorage.getItem("kyzer_openai_key") || "",
    anthropic: localStorage.getItem("kyzer_anthropic_key") || "",
    gemini: localStorage.getItem("kyzer_gemini_key") || "",
    xai: localStorage.getItem("kyzer_xai_key") || "",
    deepseek: localStorage.getItem("kyzer_deepseek_key") || "",
    qwen: localStorage.getItem("kyzer_qwen_key") || ""
  }));

  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kyzer_messages") || "[]");
    } catch {
      return [];
    }
  });

  const [recentChats, setRecentChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("kyzer_recent_chats") || "null"
      ) || defaultChats;
    } catch {
      return defaultChats;
    }
  });

  useEffect(() => {
    localStorage.setItem("kyzer_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(
      "kyzer_recent_chats",
      JSON.stringify(recentChats)
    );
  }, [recentChats]);

  const saveKey = (provider, value) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));

    if (value) {
      localStorage.setItem(`kyzer_${provider}_key`, value);
    } else {
      localStorage.removeItem(`kyzer_${provider}_key`);
    }
  };

  const clearKeys = () => {
    Object.keys(keys).forEach((provider) => {
      localStorage.removeItem(`kyzer_${provider}_key`);
    });

    setKeys({
      openai: "",
      anthropic: "",
      gemini: "",
      xai: "",
      deepseek: "",
      qwen: ""
    });
  };

  const newChat = () => {
    setMessages([]);
    setText("");
  };

  const send = async () => {
    const prompt = text.trim();
    if (!prompt || loading) return;

    const nextMessages = [
      ...messages,
      { role: "user", content: prompt }
    ];

    setMessages(nextMessages);
    setText("");
    setLoading(true);

    const title =
      prompt.length > 34
        ? `${prompt.slice(0, 34)}...`
        : prompt;

    setRecentChats((prev) =>
      [title, ...prev.filter((x) => x !== title)].slice(0, 12)
    );

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: nextMessages,
          keys
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || `Request failed (${response.status})`
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No response received.",
          provider: data.provider
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${error.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app">
      <aside className={mobile ? "side open" : "side"}>
        <div className="brand">
          <div className="logo">K</div>
          <b>KYZER AI</b>
          <button
            onClick={() => setMobile(false)}
            className="mobileClose"
          >
            <X size={18} />
          </button>
        </div>

        <button className="new" onClick={newChat}>
          <Plus size={18} />
          New Chat
        </button>

        <div className="label">RECENT</div>

        {recentChats.map((chat) => (
          <button
            className="chat"
            key={chat}
            onClick={() => setText(chat)}
          >
            {chat}
          </button>
        ))}

        <div className="label">WORKSPACE</div>

        <button className="chat">
          <Plug size={16} />
          Connectors
        </button>

        <button
          className="chat"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={16} />
          Settings
        </button>

        <div className="sideFoot">
          KYZER AI
          <br />
          <span>AI workspace</span>
        </div>
      </aside>

      <main>
        <header>
          <button
            className="hamb"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>

          <div>
            <strong>{model}</strong>
            <span className="mode">
              {model === "Agent"
                ? " agent mode"
                : " model"}
            </span>
          </div>

          <div className="headRight">
            <span className="status">
              ● {loading ? "Thinking..." : "Online"}
            </span>

            <button
              className="iconBtn"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={19} />
            </button>
          </div>
        </header>

        <section className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="orb">✦</div>
              <h1>What can I help you build?</h1>
              <p>
                One workspace for your AI models,
                tools, files and agents.
              </p>

              <div className="cards">
                <button
                  onClick={() =>
                    setText("Build a Minecraft mod")
                  }
                >
                  Build a Minecraft mod
                </button>

                <button
                  onClick={() =>
                    setText(
                      "Analyze my GitHub project"
                    )
                  }
                >
                  Analyze my GitHub
                </button>

                <button
                  onClick={() =>
                    setText("Create a website")
                  }
                >
                  Create a website
                </button>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <div className="msg" key={index}>
                  <div className="avatar">
                    {message.role === "user"
                      ? "U"
                      : "K"}
                  </div>

                  <div className="msgBody">
                    <div className="msgText">
                      {message.content}
                    </div>

                    {message.provider && (
                      <small className="provider">
                        {message.provider}
                      </small>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="msg">
                  <div className="avatar">K</div>
                  <div className="msgBody">
                    <div className="msgText loadingText">
                      <Loader2
                        className="spin"
                        size={18}
                      />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="composerWrap">
          <div className="composer">
            <div className="selectWrap">
              <button
                className="modelBtn"
                onClick={() => setOpen(!open)}
              >
                <Zap size={16} />
                {model}
                <ChevronDown size={15} />
              </button>

              {open && (
                <div className="models">
                  {models.map((item) => (
                    <button
                      key={item}
                      className={
                        item === model
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setModel(item);
                        setOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
            />

            <div className="tools">
              <button>
                <Paperclip size={18} />
              </button>

              <span>
                Shift + Enter for new line
              </span>

              <button
                className="send"
                onClick={send}
                disabled={
                  loading || !text.trim()
                }
              >
                {loading ? (
                  <Loader2
                    className="spin"
                    size={18}
                  />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>

          <footer>
            KYZER AI — Bring Your Own Key
          </footer>
        </div>
      </main>

      {settingsOpen && (
        <div
          className="settingsOverlay"
          onClick={() =>
            setSettingsOpen(false)
          }
        >
          <div
            className="settingsModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="settingsHead">
              <div>
                <h2>Bring Your Own Key</h2>
                <p>
                  Your keys are stored in this
                  browser and sent with your
                  requests.
                </p>
              </div>

              <button
                onClick={() =>
                  setSettingsOpen(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            {[
              ["openai", "OpenAI", "sk-..."],
              [
                "anthropic",
                "Anthropic",
                "sk-ant-..."
              ],
              ["gemini", "Google Gemini", "AIza..."],
              ["xai", "xAI / Grok", "xai-..."],
              [
                "deepseek",
                "DeepSeek",
                "sk-..."
              ],
              [
                "qwen",
                "Qwen / DashScope",
                "sk-..."
              ]
            ].map(
              ([provider, label, placeholder]) => (
                <label
                  className="keyField"
                  key={provider}
                >
                  <span>
                    <KeyRound size={14} />
                    {label}
                  </span>

                  <input
                    type="password"
                    value={keys[provider]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      saveKey(
                        provider,
                        e.target.value
                      )
                    }
                  />
                </label>
              )
            )}

            <div className="settingsActions">
              <button
                className="danger"
                onClick={clearKeys}
              >
                Clear keys
              </button>

              <button
                className="saveBtn"
                onClick={() =>
                  setSettingsOpen(false)
                }
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
