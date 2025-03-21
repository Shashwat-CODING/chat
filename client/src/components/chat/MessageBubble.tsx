import { forwardRef } from "react";
import { type ChatMessage, type SystemMessage } from "@shared/schema";

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
    if (message.type === 'system') {
      return (
        <div ref={ref} className="flex justify-center my-4">
          <div className="bg-gray-100 text-gray-500 rounded-full px-4 py-1 text-xs">
            {message.content}
          </div>
        </div>
      );
    }

    // User message
    if (isCurrentUser) {
      return (
        <div ref={ref} className="flex flex-row-reverse items-end space-x-reverse space-x-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
            {message.username.charAt(0).toUpperCase()}
          </div>
          <div className="max-w-md">
            <div className="text-xs text-gray-500 mb-1 mr-1 text-right">You</div>
            <div className="bg-indigo-600 rounded-lg rounded-br-none p-3 shadow-sm">
              <p className="text-white">{message.content}</p>
            </div>
            <div className="text-xs text-gray-400 mt-1 mr-1 text-right">
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      );
    }

    // Other user message
    return (
      <div ref={ref} className="flex items-end space-x-2 mb-4">
        <div className={`w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-medium text-sm`}>
          {message.username.charAt(0).toUpperCase()}
        </div>
        <div className="max-w-md">
          <div className="text-xs text-gray-500 mb-1 ml-1">{message.username}</div>
          <div className="bg-white rounded-lg rounded-bl-none p-3 shadow-sm border border-gray-200">
            <p className="text-gray-800">{message.content}</p>
          </div>
          <div className="text-xs text-gray-400 mt-1 ml-1">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
