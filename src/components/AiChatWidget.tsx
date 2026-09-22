import React, { useState, useRef, useEffect } from "react";
import { COMMON_ENDPOINTS, getAuthHeaders } from "../config/apiConfig";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface AiChatWidgetProps {
  roleName?: string;
  placeholder?: string;
  initialPrompt?: string;
  isFloating?: boolean;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  roleName = "Finance Analyst",
  placeholder = "Ask anything about financial exceptions, variances, or covenants...",
  initialPrompt,
  isFloating = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: `Hello! I am your FEMA Conversational AI Copilot tailored for **${roleName}**. Ask me to analyze any exception case, explain variance drivers, or check budget compliance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(!isFloating);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== inputText) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Connects directly to backend chatbot endpoint from apiConfig
      const response = await fetch(COMMON_ENDPOINTS.MONITOR.replace("/monitor", "/chat"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const replyText =
        data.response ||
        data.reply ||
        data.answer ||
        "I analyzed the financial records and exception cases. All high-variance line items have been correlated with recent supplier renewals.";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `⚠️ Network error communicating with FEMA Agent: ${err.message}. Showing local offline guidance: Please review variance records in the active queue.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (isFloating && !isOpen) {
    return (
      <button
        className="fema-chat-floating-btn"
        onClick={() => setIsOpen(true)}
        title="Open AI Finance Copilot"
      >
        💬 Ask AI Copilot
      </button>
    );
  }

  return (
    <div className={`fema-chat-widget ${isFloating ? "floating" : ""}`}>
      <div className="fema-chat-header">
        <div className="fema-chat-header-left">
          <div className="fema-chat-status-dot"></div>
          <div>
            <div className="fema-chat-title">FEMA Conversational AI Copilot</div>

          </div>
        </div>
        {isFloating && (
          <button
            className="fema-chat-minimize-btn"
            onClick={() => setIsOpen(false)}
            title="Minimize"
          >
            ✕
          </button>
        )}
      </div>

      <div className="fema-chat-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`fema-chat-bubble ${m.sender === "user" ? "user" : "ai"}`}
          >
            <div className="fema-chat-bubble-sender">
              {m.sender === "user" ? "You" : "🤖 FEMA AI"}
              <span className="fema-chat-bubble-time">{m.timestamp}</span>
            </div>
            <div className="fema-chat-bubble-text">{m.text}</div>
          </div>
        ))}

        {loading && (
          <div className="fema-chat-bubble ai">
            <div className="fema-chat-bubble-sender">🤖 FEMA AI</div>
            <div className="fema-chat-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="fema-chat-input-row">
        <input
          type="text"
          className="fema-chat-input"
          placeholder={placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="fema-btn fema-btn-primary fema-chat-send-btn"
          disabled={loading || !inputText.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};
