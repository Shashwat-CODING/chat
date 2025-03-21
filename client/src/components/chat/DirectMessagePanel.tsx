import { useState, useEffect, useRef } from "react";
import { socketClient } from "@/lib/socket";
import { type DirectChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

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
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{getInitials(selectedUsername)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{selectedUsername}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="break-words whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                        {message.read && isCurrentUser && (
                          <span className="ml-2">Read</span>
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
      
      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-[60px] max-h-[120px]"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}