"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Chat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [selectedPromptKey, setSelectedPromptKey] = useState<string | null>(
    null,
  );

  const promptMap: Record<string, string> = {
    "Electronics Trade":
      "Hedge $75,000 on a shipment of electronics from Shenzhen, China to Los Angeles due to potential tariff changes from US-China trade negotiations.",
    "Agricultural Exports":
      "Hedge $150,000 on agricultural exports from Iowa to Hamburg, Germany to mitigate currency risk amid Eurozone economic instability.",
    Pharmaceuticals:
      "Hedge $120,000 on pharmaceuticals shipped from Basel, Switzerland to New York to protect against Brexit-related customs delays.",
    "Automotive Parts":
      "Hedge $90,000 on automotive parts moving from Detroit to Mexico City affected by changes in USMCA trade policies.",
    "Seafood Exports":
      "Hedge $200,000 on seafood exports from Tokyo, Japan to San Francisco due to risks from Pacific Ocean shipping route disruptions.",
    "Natural Gas":
      "Hedge $110,000 on natural gas shipments from Houston to European countries in response to geopolitical tensions affecting energy prices.",
    "Luxury Goods":
      "Hedge $80,000 on luxury goods transported from Milan, Italy to New York anticipating fluctuations in demand from global economic slowdowns.",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Get existing hedges to determine next number
      const existingHedges = JSON.parse(
        sessionStorage.getItem("hedges") || "[]",
      );
      const hedgeNumber = existingHedges.length + 1;

      // Use prompt key if available, otherwise use simple naming
      const hedgeDisplayName = selectedPromptKey || `Hedging ${hedgeNumber}`;
      const hedgeName = hedgeDisplayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      const hedgeDescription = selectedPromptKey ? selectedPromptKey : input;

      // Add to sidebar hedges
      window.dispatchEvent(
        new CustomEvent("hedgeCreated", {
          detail: {
            name: hedgeDisplayName,
            description: hedgeDescription,
            urlName: hedgeName,
          },
        }),
      );

      // Navigate to the new hedge page
      router.push(`/${hedgeName}`);
    }
  };

  const handlePromptClick = (category: string) => {
    const fullPrompt = promptMap[category];
    if (fullPrompt) {
      setInput(fullPrompt);
      setSelectedPromptKey(category); // Track which prompt was selected
      // Auto-expand textarea after setting the prompt
      setTimeout(() => {
        const textarea = document.querySelector(
          ".chat-input",
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        }
      }, 0);
    }
  };

  return (
    <div className="chat-container">
      {/* Welcome Message */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, John!</h1>
        <p className="welcome-subtitle">
          How can I help you create a hedge today?
        </p>
      </div>

      {/* Chat Input */}
      <div className="chat-input-section">
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="chat-input-container">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Clear selected prompt key if user types manually
                if (selectedPromptKey) {
                  setSelectedPromptKey(null);
                }
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="How can I help you today?"
              className="chat-input"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>

        {/* Example Prompts */}
        <div className="example-prompts">
          <div className="prompts-row">
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Electronics Trade")}
            >
              Electronics Trade
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Agricultural Exports")}
            >
              Agricultural Exports
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Pharmaceuticals")}
            >
              Pharmaceuticals
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Automotive Parts")}
            >
              Automotive Parts
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Seafood Exports")}
            >
              Seafood Exports
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Natural Gas")}
            >
              Natural Gas
            </button>
            <button
              className="prompt-tag"
              onClick={() => handlePromptClick("Luxury Goods")}
            >
              Luxury Goods
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
