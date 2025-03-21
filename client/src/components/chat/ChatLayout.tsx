import { useEffect, useRef, useMemo } from "react";
import { MoreVertical, Search, Users, Info } from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { type ConnectionStatus as ConnectionStatusType } from "@/lib/socket";
import { type ChatMessage, type SystemMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { createUniqueMessageMap } from "@/useChat.fix";

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
  const isMobile = useIsMobile();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isConnected = connectionStatus === 'connected';

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  // Create a map of messages with unique keys to prevent React warnings
  const uniqueMessages = useMemo(() => {
    return createUniqueMessageMap(messages);
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="whatsapp-header px-4 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials("G")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-lg">Group Chat</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ConnectionStatus status={connectionStatus} />
              <span>
                {connectionStatus === 'connected' ? 'Online' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <Button variant="ghost" size="icon" 
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full h-9 w-9">
              <Users className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" 
            className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full h-9 w-9">
            <Search className="h-5 w-5" />
          </Button>
          {!isMobile && (
            <Button variant="ghost" size="icon" 
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full h-9 w-9">
              <Info className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" 
            className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full h-9 w-9">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Chat container */}
      <main className="flex-1 overflow-hidden flex flex-col whatsapp-bg">
        {/* Messages */}
        <div id="chat-history" className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-1 scrollbar-thin">
          {Object.entries(uniqueMessages).map(([uniqueId, message]) => (
            <MessageBubble
              key={uniqueId}
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
