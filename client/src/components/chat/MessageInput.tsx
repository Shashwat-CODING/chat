import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isConnected: boolean;
}

export function MessageInput({ onSendMessage, isConnected }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && isConnected) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-full pl-4 pr-10 py-2 bg-gray-50"
            disabled={!isConnected}
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className={`rounded-full p-2 ${
            isConnected
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
          disabled={!isConnected}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}

export default MessageInput;
