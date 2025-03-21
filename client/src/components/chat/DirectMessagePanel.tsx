import { useState, useEffect, useRef, useMemo } from "react";
import { socketClient } from "@/lib/socket";
import { type DirectChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ArrowLeft, MoreVertical, Paperclip, Send, Mic, CheckCheck } from "lucide-react";
import { createUniqueDirectMessageMap } from "@/useChat.fix";

interface DirectMessagePanelProps {
  selectedUserId: number;
  selectedUsername: string;
  currentUserId: number;
  currentUsername: string;
  messages: DirectChatMessage[];
  onClose: () => void;
}

export function DirectMessagePanel({
  selectedUserId,
  selectedUsername,
  currentUserId,
  currentUsername,
  messages,
  onClose
}: DirectMessagePanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mark messages as read when panel is opened
  useEffect(() => {
    socketClient.markMessagesAsRead(selectedUserId);
  }, [selectedUserId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socketClient.sendDirectMessage(selectedUserId, newMessage);
      setNewMessage("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };
  
  // Create a map of direct messages with unique keys to prevent React warnings
  const uniqueMessages = useMemo(() => {
    return createUniqueDirectMessageMap(messages);
  }, [messages]);
  
  return (
    <Card className="flex flex-col h-full border-none rounded-none">
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between whatsapp-header">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="mr-1" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(selectedUsername)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{selectedUsername}</span>
            <span className="text-xs text-muted-foreground/90">online</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 whatsapp-bg">
        <ScrollArea className="h-[calc(100vh-12rem)] py-4 px-2">
          <div className="flex flex-col gap-1 md:px-8">
            {Object.entries(uniqueMessages).map(([uniqueId, message]) => {
              const isCurrentUser = message.senderId === currentUserId;
              
              return (
                <div 
                  key={uniqueId}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-2 px-3 shadow-sm ${
                      isCurrentUser 
                        ? 'message-bubble-outgoing' 
                        : 'message-bubble-incoming'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="break-words whitespace-pre-wrap">{message.content}</div>
                      <div className="flex justify-end items-center mt-1 gap-1">
                        <span className="text-[0.65rem] text-muted-foreground/70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.read && isCurrentUser && (
                          <span className="text-primary">
                            <CheckCheck className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-2 whatsapp-header">
        <div className="flex w-full items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 min-h-[40px] max-h-[120px] py-2 px-3 rounded-full border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()} 
            size="icon" 
            className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10"
          >
            {newMessage.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}