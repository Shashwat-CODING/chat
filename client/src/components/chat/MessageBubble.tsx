import { forwardRef } from "react";
import { type ChatMessage, type SystemMessage } from "@shared/schema";
import { Check, CheckCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageBubbleProps {
  message: ChatMessage | SystemMessage;
  isCurrentUser: boolean;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, isCurrentUser }, ref) => {
    const isMobile = useIsMobile();

    if (message.type === 'system') {
      return (
        <div ref={ref} className="flex justify-center my-3">
          <div className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium shadow-sm max-w-[85%] text-center">
            {message.content}
          </div>
        </div>
      );
    }

    // User message (outgoing)
    if (isCurrentUser) {
      return (
        <div ref={ref} className="flex flex-row-reverse items-end space-x-reverse space-x-2 mb-3 group">
          <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[75%]'} sm:max-w-md`}>
            <div className="message-bubble-outgoing p-2.5 px-3.5 sm:p-3 sm:px-4">
              <p className="break-words text-sm sm:text-base">{message.content}</p>
              <div className="flex justify-end items-center mt-1 space-x-1.5">
                <span className="text-[0.65rem] opacity-80 text-slate-600 dark:text-white/80">
                  {formatTime(message.timestamp)}
                </span>
                <span className="text-primary">
                  <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Other user message (incoming)
    return (
      <div ref={ref} className="flex items-end space-x-2 mb-3 group">
        <div className="user-avatar w-7 h-7 sm:w-8 sm:h-8 border border-primary/10">
          {message.username.charAt(0).toUpperCase()}
        </div>
        <div className={`${isMobile ? 'max-w-[80%]' : 'max-w-[75%]'} sm:max-w-md`}>
          <div className="text-xs font-medium text-primary mb-1 ml-1">{message.username}</div>
          <div className="message-bubble-incoming p-2.5 px-3.5 sm:p-3 sm:px-4">
            <p className="break-words text-sm sm:text-base">{message.content}</p>
            <div className="flex justify-end items-center mt-1">
              <span className="text-[0.65rem] opacity-80 text-slate-600 dark:text-white/80">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
