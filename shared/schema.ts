import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Added fields for user authentication and profile
  email: text("email"),
  avatarUrl: text("avatar_url"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const signInSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(15, "Username must be less than 15 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignInCredentials = z.infer<typeof signInSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Messages table - for public chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  username: true,
  content: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Direct messages table
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  senderUsername: text("sender_username").notNull(),
  receiverId: integer("receiver_id").notNull(),
  receiverUsername: text("receiver_username").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").default(false),
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  senderId: true,
  senderUsername: true,
  receiverId: true,
  receiverUsername: true,
  content: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

// Types for WebSocket communication
export type ChatMessage = {
  id: number;
  userId: number;
  username: string;
  content: string;
  timestamp: string;
  type: 'message';
};

export type DirectChatMessage = {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'direct-message';
};

export type SystemMessage = {
  id: number;
  content: string;
  timestamp: string;
  type: 'system';
};

export type ConnectionMessage = {
  type: 'connection';
  status: 'connected' | 'disconnected';
  userId?: number;
  username?: string;
};

export type UserListMessage = {
  type: 'userList';
  users: { id: number, username: string, isOnline: boolean, lastSeen?: string }[];
};

export type AuthMessage = {
  type: 'auth';
  status: 'success' | 'error';
  userId?: number;
  username?: string;
  message?: string;
};

export type MessagesReadMessage = {
  type: 'messages-read';
  senderId: number;
  receiverId: number;
};

export type WebSocketMessage = 
  | ChatMessage 
  | DirectChatMessage
  | SystemMessage 
  | ConnectionMessage 
  | UserListMessage
  | AuthMessage
  | MessagesReadMessage;
