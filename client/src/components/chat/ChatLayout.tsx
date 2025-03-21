import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { type ConnectionStatus as ConnectionStatusType } from "@/lib/socket";
import { type ChatMessage, type SystemMessage } from "@shared/schema";

interface ChatLayoutProps {
  connectionStatus: ConnectionStatusType;
  username: string;
  messages: (ChatMessage | SystemMessage)[];
  onSendMessage: (content: string) => void;
}

export function ChatLayout({
  connectionStatus,
  username,
  messages,
  onSendMessage
}: ChatLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-semibold text-gray-800">ChatterBox</h1>
        </div>
        <div className="flex items-center">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </header>

      {/* Chat container */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Messages */}
        <div id="chat-history" className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={
                message.type === "message" && message.username === username
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <MessageInput
          onSendMessage={onSendMessage}
          isConnected={isConnected}
        />
      </main>
    </div>
  );
}

export default ChatLayout;
