import { useState, useEffect, useRef } from "react";

// ============================================================
// CONFIGURATION — Replace with your n8n Chat Webhook URL
// ============================================================
const N8N_CHAT_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
// e.g. "https://your-n8n.com/webhook/webryza-chat"
// ============================================================

const QUICK_REPLIES = [
  "Tell me about your services",
  "How much does a website cost?",
  "I need SEO help",
  "I want an e-commerce store",
];

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RyzaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [sessionId] = useState("sess_" + Math.random().toString(36).substr(2, 9));
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        setMessages([
          {
            role: "bot",
            text: "Welcome to Webryza! 👋 I'm Ryza, your dedicated AI assistant. Whether you need a stunning website, SEO strategy, or an e-commerce store — I'm here to help. What can I assist you with today?",
            time: getTime(),
          },
        ]);
      }, 400);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    setInput("");
    setShowQuickReplies(false);
    setMessages((prev) => [...prev, { role: "user", text: msg, time: getTime() }]);
    setIsTyping(true);

    try {
      const res = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: msg, sessionId }),
      });
      const data = await res.json();
      const reply =
        data.output || data.reply || data.text ||
        "I'm sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "bot", text: reply, time: getTime() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I'm having trouble connecting. Please try again or visit webryza.com.",
          time: getTime(),
        },
      ]);
    }
    setIsTyping(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .ryza-wrap * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

        /* LAUNCHER */
        .ryza-launcher {
          position: fixed; bottom: 28px; right: 28px;
          width: 64px; height: 64px; border-radius: 50%;
          background: #0a0a0a;
          border: 1.5px solid rgba(57, 255, 20, 0.4);
          box-shadow: 0 8px 32px rgba(57, 255, 20, 0.2), 0 0 0 0 rgba(57, 255, 20, 0.4);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        .ryza-launcher:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(57, 255, 20, 0.3), 0 0 0 8px rgba(57, 255, 20, 0.1);
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 8px 32px rgba(57, 255, 20, 0.2), 0 0 0 0 rgba(57, 255, 20, 0.3); }
          50% { box-shadow: 0 8px 32px rgba(57, 255, 20, 0.4), 0 0 0 10px rgba(57, 255, 20, 0); }
        }
        .ryza-launcher-icon { width: 30px; height: 30px; }

        /* WINDOW */
        .ryza-window {
          position: fixed; bottom: 106px; right: 28px;
          width: 375px; height: 560px;
          background: rgba(20, 20, 20, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          display: flex; flex-direction: column; overflow: hidden;
          z-index: 9998;
          transform-origin: bottom right;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease;
        }
        .ryza-window.closed {
          transform: scale(0.85) translateY(16px);
          opacity: 0; pointer-events: none;
        }
        .ryza-window.open {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        /* HEADER */
        .ryza-header {
          padding: 16px 18px;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex; align-items: center; gap: 12px;
          flex-shrink: 0;
        }
        .ryza-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: transparent;
          border: 2px solid #39FF14;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 17px; color: #39FF14; flex-shrink: 0;
          box-shadow: 0 0 10px rgba(57, 255, 20, 0.4);
        }
        .ryza-header-info h3 {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; color: #ffffff; letter-spacing: 0.2px;
        }
        .ryza-header-info p {
          font-size: 11px; color: #a1a1aa; margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }
        .ryza-online-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #39FF14;
          box-shadow: 0 0 6px #39FF14;
          display: inline-block;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .ryza-close {
          margin-left: auto; color: #a1a1aa; cursor: pointer;
          font-size: 18px; padding: 6px; border-radius: 8px;
          transition: color 0.15s, background 0.15s; line-height: 1;
          background: transparent; border: none;
        }
        .ryza-close:hover { color: #ffffff; background: rgba(255,255,255,0.06); }

        /* MESSAGES */
        .ryza-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 14px;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .ryza-messages::-webkit-scrollbar { width: 3px; }
        .ryza-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .ryza-msg { display: flex; flex-direction: column; max-width: 82%; }
        .ryza-msg.bot { align-self: flex-start; }
        .ryza-msg.user { align-self: flex-end; }

        .ryza-bubble {
          padding: 11px 15px; border-radius: 16px;
          font-size: 13.5px; line-height: 1.6; font-weight: 400;
        }
        .ryza-msg.bot .ryza-bubble {
          background: #1f1f1f;
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.1);
          border-bottom-left-radius: 4px;
        }
        .ryza-msg.user .ryza-bubble {
          background: rgba(57, 255, 20, 0.05);
          color: #39FF14;
          border: 1px solid rgba(57, 255, 20, 0.5);
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 16px rgba(57, 255, 20, 0.1);
        }
        .ryza-time {
          font-size: 10px; color: #a1a1aa; margin-top: 5px; padding: 0 4px;
        }
        .ryza-msg.user .ryza-time { text-align: right; }

        /* TYPING */
        .ryza-typing {
          align-self: flex-start;
          background: #1f1f1f;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 13px 18px; border-radius: 16px; border-bottom-left-radius: 4px;
          display: flex; gap: 5px; align-items: center;
        }
        .ryza-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #39FF14; animation: typingBounce 1.2s infinite;
        }
        .ryza-dot:nth-child(2) { animation-delay: 0.2s; }
        .ryza-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-7px); }
        }

        /* QUICK REPLIES */
        .ryza-quick {
          display: flex; flex-wrap: wrap; gap: 7px;
          padding: 0 14px 12px;
        }
        .ryza-qbtn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #a1a1aa; font-size: 12px; font-family: 'DM Sans', sans-serif;
          padding: 6px 13px; border-radius: 20px; cursor: pointer;
          transition: all 0.2s ease;
        }
        .ryza-qbtn:hover {
          background: rgba(57, 255, 20, 0.1);
          border-color: #39FF14; color: #39FF14;
        }

        /* INPUT */
        .ryza-input-area {
          padding: 12px 14px;
          background: #141414;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0;
        }
        .ryza-textarea {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 14px;
          color: #ffffff; font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          resize: none; outline: none; max-height: 90px; line-height: 1.5;
          transition: border-color 0.2s;
        }
        .ryza-textarea:focus { border-color: #39FF14; }
        .ryza-textarea::placeholder { color: #a1a1aa; }

        .ryza-send {
          width: 42px; height: 42px; border-radius: 50%;
          background: transparent;
          border: 2px solid rgba(57, 255, 20, 0.5);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 0 10px rgba(57, 255, 20, 0.1);
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .ryza-send:hover { transform: scale(1.1); border-color: #39FF14; box-shadow: 0 0 15px rgba(57, 255, 20, 0.3); }
        .ryza-send:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

        .ryza-branding {
          text-align: center; padding: 7px;
          font-size: 10px; color: #a1a1aa; letter-spacing: 0.3px;
          flex-shrink: 0;
        }

        @media (max-width: 430px) {
          .ryza-window { width: calc(100vw - 20px); right: 10px; bottom: 94px; }
          .ryza-launcher { bottom: 16px; right: 16px; }
        }
      `}</style>

      <div className="ryza-wrap">
        {/* LAUNCHER */}
        <button className="ryza-launcher" onClick={() => setIsOpen((o) => !o)} aria-label="Open Ryza chat">
          {isOpen ? (
            <svg className="ryza-launcher-icon" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="ryza-launcher-icon" viewBox="0 0 24 24" fill="none" stroke="url(#rg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"/>
              <rect width="16" height="12" x="4" y="8" rx="2"/>
              <path d="M2 14h2"/>
              <path d="M20 14h2"/>
              <path d="M15 13v2"/>
              <path d="M9 13v2"/>
              <defs>
                <linearGradient id="rg" x1="2" y1="2" x2="22" y2="21">
                  <stop offset="0%" stopColor="#39FF14"/>
                  <stop offset="100%" stopColor="#2db30f"/>
                </linearGradient>
              </defs>
            </svg>
          )}
        </button>

        {/* CHAT WINDOW */}
        <div className={`ryza-window ${isOpen ? "open" : "closed"}`}>
          {/* Header */}
          <div className="ryza-header">
            <div className="ryza-avatar">R</div>
            <div className="ryza-header-info">
              <h3>Ryza — Webryza AI</h3>
              <p><span className="ryza-online-dot"/> Online · Replies instantly</p>
            </div>
            <button className="ryza-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="ryza-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ryza-msg ${msg.role}`}>
                <div className="ryza-bubble">{msg.text}</div>
                <div className="ryza-time">{msg.time}</div>
              </div>
            ))}
            {isTyping && (
              <div className="ryza-typing">
                <div className="ryza-dot"/>
                <div className="ryza-dot"/>
                <div className="ryza-dot"/>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Quick Replies */}
          {showQuickReplies && messages.length > 0 && (
            <div className="ryza-quick">
              {QUICK_REPLIES.map((q) => (
                <button key={q} className="ryza-qbtn" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ryza-input-area">
            <textarea
              ref={inputRef}
              className="ryza-textarea"
              placeholder="Ask me anything..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="ryza-send" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#39FF14">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>

          <div className="ryza-branding">Powered by Webryza AI · Ryza</div>
        </div>
      </div>
    </>
  );
}
