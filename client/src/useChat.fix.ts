/**
 * This file fixes the duplicate key warning by generating a unique ID for each message
 * We're using a helper function instead of modifying the original useChat.ts directly to maintain backward compatibility
 */

import { ChatMessage, DirectChatMessage, SystemMessage, WebSocketMessage } from "@shared/schema";

/**
 * Generates a unique message ID by combining the original ID with the timestamp
 * This ensures each message has a unique ID even if the original ID is duplicated
 */
export function generateUniqueMessageId(message: WebSocketMessage): string {
  if (message.type === 'message' || message.type === 'system' || message.type === 'direct-message') {
    return `msg-${message.id}-${Date.now()}`;
  }
  
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a map of messages with unique IDs
 * This prevents React warnings about duplicate keys
 */
export function createUniqueMessageMap(messages: (ChatMessage | SystemMessage)[]): Record<string, ChatMessage | SystemMessage> {
  const messageMap: Record<string, ChatMessage | SystemMessage> = {};
  
  messages.forEach(message => {
    const uniqueId = `msg-${message.id}-${message.timestamp}`;
    messageMap[uniqueId] = message;
  });
  
  return messageMap;
}

/**
 * Creates a map of direct messages with unique IDs
 */
export function createUniqueDirectMessageMap(messages: DirectChatMessage[]): Record<string, DirectChatMessage> {
  const messageMap: Record<string, DirectChatMessage> = {};
  
  messages.forEach(message => {
    const uniqueId = `dm-${message.id}-${message.timestamp}`;
    messageMap[uniqueId] = message;
  });
  
  return messageMap;
}