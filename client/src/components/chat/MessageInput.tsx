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
      <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-2 w-full max-w-5xl mx-auto px-2 sm:px-0">
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
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
            className="min-h-[40px] sm:min-h-[45px] max-h-[100px] sm:max-h-[120px] py-2 sm:py-3 px-3 sm:px-4 rounded-full bg-background/50 
                      border focus:border-primary/50 resize-none 
                      focus-visible:ring-0 focus-visible:ring-offset-0 
                      focus-visible:outline-none shadow-sm"
            disabled={!isConnected}
            autoComplete="off"
            style={{ overflowY: 'auto' }}
          />
        </div>
        
        <Button
          type={message.trim() ? "submit" : "button"}
          size="icon"
          className={`rounded-full bg-primary hover:bg-primary/90 
                     ${isMobile ? 'h-10 w-10' : 'h-11 w-11'} 
                     flex-shrink-0 transition-all shadow-sm 
                     disabled:bg-primary/50 disabled:cursor-not-allowed`}
          disabled={!isConnected || !message.trim()}
          aria-label="Send message"
        >
          <Send className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </form>
    </div>
  );
}

export default MessageInput;
