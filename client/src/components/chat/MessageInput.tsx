import { useState } from "react";
import { Smile, Paperclip, ImageIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isConnected: boolean;
}

export function MessageInput({ onSendMessage, isConnected }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && isConnected) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && isConnected) {
        onSendMessage(message);
        setMessage("");
      }
    }
  };

  return (
    <div className="message-input-area">
      <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-2 w-full max-w-5xl mx-auto px-1 sm:px-0">
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[45px] max-h-[120px] py-3 px-4 rounded-2xl bg-background/50 border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 shadow-sm"
            disabled={!isConnected}
            autoComplete="off"
          />
        </div>
        
        {isMobile ? (
          <Button
            type={message.trim() ? "submit" : "button"}
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 flex-shrink-0 transition-all shadow-sm"
            disabled={!isConnected || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type={message.trim() ? "submit" : "button"}
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 h-11 w-11 flex-shrink-0 transition-all shadow-sm"
            disabled={!isConnected || !message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
}

export default MessageInput;
