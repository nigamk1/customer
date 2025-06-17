import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaMicrophone } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Helper function to generate valid timestamps
const getValidTimestamp = () => {
  try {
    return new Date().toISOString();
  } catch (e) {
    // Fallback for any edge cases
    return new Date().toString();
  }
};

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null); // Load previous chat history if needed
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get("/api/chat/history");

        // Validate response data
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Make sure each message has required fields and valid timestamp
          const processedData = res.data.map((msg) => {
            // Ensure msg is a valid object
            if (!msg || typeof msg !== "object") {
              return {
                role: "assistant",
                content: "Error displaying message",
                timestamp: getValidTimestamp(),
              };
            }

            return {
              role: msg.role || "assistant",
              content: msg.content || "No message content",
              timestamp: getValidTimestamp(), // Ensure valid timestamp
            };
          });

          setChatHistory(processedData);
        } else {
          // Add a welcome message if no history with a guaranteed valid timestamp
          setChatHistory([
            {
              role: "assistant",
              content: "Hello! I'm HelpMate AI. How can I assist you today?",
              timestamp: getValidTimestamp(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
        toast.error("Failed to load chat history");

        // Set default welcome message on error
        setChatHistory([
          {
            role: "assistant",
            content: "Hello! I'm HelpMate AI. How can I assist you today?",
            timestamp: getValidTimestamp(),
          },
        ]);
      }
    };

    fetchChatHistory();
  }, []);

  // Manual scroll function that will be called only when sending messages
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return; // Create user message with a guaranteed valid timestamp
    const userMessage = {
      role: "user",
      content: message,
      timestamp: getValidTimestamp(),
    };

    // Add user message to chat
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    // Manual scroll after sending user message
    setTimeout(scrollToBottom, 100);

    try {
      // Send message to backend
      const response = await axios.post("/api/chat/send", {
        message: message.trim(),
      }); // Add AI response to chat with guaranteed valid timestamp
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.response,
          timestamp: getValidTimestamp(),
        },
      ]);

      // Manual scroll after receiving AI response
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to get response. Please try again later."); // Add error message to chat with guaranteed valid timestamp
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: getValidTimestamp(),
        },
      ]);

      // Manual scroll after error message
      setTimeout(scrollToBottom, 100);
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (timestamp) => {
    // Safe default for any invalid input
    const defaultTime = () => {
      try {
        return new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return "Just now"; // Ultimate fallback
      }
    };

    // If timestamp is undefined or null, return default time
    if (!timestamp) {
      return defaultTime();
    }

    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Instead of showing invalid date, return current time
        return defaultTime();
      }
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      // Return default time if there's any error
      return defaultTime();
    }
  }; // Function to render formatted message content - ensuring no timestamps are added
  const renderMessageContent = (content) => {
    // Check if content is valid (not undefined or null)
    if (!content) {
      return <p>No content to display</p>;
    }

    // Ensure content is a string before calling replace
    const contentStr = String(content);

    // Remove any timestamp-like content from the message to prevent duplication
    const cleanedContent = contentStr.replace(
      /\d{1,2}:\d{2}(?:\s?[AP]M)?/g,
      ""
    );

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          root: ({ node, ...props }) => (
            <div className="message-content" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl font-bold mb-3 mt-4 pb-1 border-b border-gray-200"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-bold mb-3 mt-4 pb-1 border-b border-gray-200"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-md font-bold mb-2 mt-3" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-1 pl-1" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) => {
            return inline ? (
              <code
                className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-sm"
                {...props}
              />
            ) : (
              <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto font-mono text-sm">
                <code {...props} />
              </pre>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 italic my-4 py-1 text-gray-700 bg-gray-50 rounded-r-lg"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4 rounded-lg shadow-sm">
              <table
                className="min-w-full border border-gray-300 rounded-lg"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-300" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-gray-300 px-3 py-2 text-sm"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-gray-300 px-3 py-2 text-sm font-bold bg-gray-50"
              {...props}
            />
          ),
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto rounded-lg my-4 shadow-sm"
              {...props}
              alt={props.alt || "Image"}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-lg shadow-lg border bg-gradient-to-b from-white to-gray-50">
      <style jsx="true">{`
        /* Ensure only one timestamp is visible */
        .single-timestamp-container {
          position: relative;
          display: block;
        }

        /* Hide any timestamp-like text that might be in the message content */
        .message-content time,
        .message-content .timestamp {
          display: none !important;
        }
      `}</style>
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-full shadow-md">
            <FaRobot className="text-primary text-xl" />
          </div>
          <h2 className="text-lg font-semibold">HelpMate AI Assistant</h2>
        </div>
      </div>

      <div className="p-6 flex-grow overflow-auto chat-container bg-white bg-opacity-90">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`flex ${
              chat.role === "user" ? "justify-end" : "justify-start"
            } mb-5`}
          >
            <div className="flex items-start max-w-[80%]">
              {chat.role === "assistant" && (
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-full p-2 text-white mr-3 shadow-md flex-shrink-0">
                  <FaRobot />
                </div>
              )}
              <div
                className={`rounded-2xl p-4 shadow-md ${
                  chat.role === "user"
                    ? "bg-gradient-to-r from-secondary to-indigo-500 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                {" "}
                {chat.role === "user" ? (
                  <p className="mb-2 leading-relaxed whitespace-pre-line">
                    {chat.content || "No message content"}
                  </p>
                ) : (
                  <div className="markdown-content">
                    {renderMessageContent(chat.content)}
                  </div>
                )}
                {/* Single timestamp container with unique class to style and ensure it appears only once */}
                <div className="single-timestamp-container">
                  <p
                    className={`text-xs ${
                      chat.role === "user" ? "text-gray-200" : "text-gray-500"
                    } text-right mt-2`}
                  >
                    {chat && chat.timestamp
                      ? formatTime(chat.timestamp)
                      : formatTime(new Date())}
                  </p>
                </div>
              </div>

              {chat.role === "user" && (
                <div className="bg-gradient-to-br from-secondary to-indigo-500 rounded-full p-2 text-white ml-3 shadow-md flex-shrink-0">
                  <FaUser />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-5">
            <div className="flex items-start">
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-full p-2 text-white mr-3 shadow-md">
                <FaRobot />
              </div>
              <div className="bg-gray-100 rounded-2xl p-4 shadow-md flex space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2 items-center bg-gray-100 rounded-full px-4 py-2 shadow-inner">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow p-2 bg-transparent focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            className="text-gray-500 hover:text-primary p-2 rounded-full focus:outline-none transition-colors"
          >
            <FaMicrophone />
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-primary to-blue-600 text-white p-3 rounded-full hover:opacity-90 disabled:opacity-50 transition shadow-md"
            disabled={loading || message.trim() === ""}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
