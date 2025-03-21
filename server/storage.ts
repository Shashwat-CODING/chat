import { 
  messages, 
  type Message, 
  type InsertMessage, 
  users, 
  type User, 
  type InsertUser,
  type SystemMessage,
  type ChatMessage,
  type WebSocketMessage,
  type DirectChatMessage,
  type InsertDirectMessage,
  type DirectMessage,
  directMessages,
  type SignInCredentials
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(credentials: SignInCredentials): Promise<User | null>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  updateUserLastSeen(userId: number): Promise<void>;
  
  // Public Messages
  getAllMessages(): Promise<(ChatMessage | SystemMessage)[]>;
  createMessage(message: InsertMessage): Promise<ChatMessage>;
  createSystemMessage(content: string): Promise<SystemMessage>;
  
  // Direct Messages
  getDirectMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<DirectChatMessage[]>;
  getDirectMessagesByUser(userId: number): Promise<DirectChatMessage[]>;
  createDirectMessage(message: InsertDirectMessage): Promise<DirectChatMessage>;
  markDirectMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<Record<number, number>>;
  
  // Connected users
  getConnectedUsers(): Promise<{ id: number, username: string, isOnline: boolean, lastSeen?: string }[]>;
  addConnectedUser(user: User): Promise<void>;
  removeConnectedUser(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, ChatMessage | SystemMessage>;
  private directMessages: Map<number, DirectChatMessage>;
  private connectedUsers: Map<number, { id: number, username: string, isOnline: boolean, lastSeen?: string }>;
  currentUserId: number;
  currentMessageId: number;
  currentDirectMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.directMessages = new Map();
    this.connectedUsers = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentDirectMessageId = 1;
  }

  // User Management Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date().toISOString();
    const user = { 
      ...insertUser, 
      id, 
      isOnline: false, 
      lastSeen: timestamp,
      avatarUrl: null,
      email: insertUser.email || null
    } as User;
    this.users.set(id, user);
    return user;
  }
  
  async authenticateUser(credentials: SignInCredentials): Promise<User | null> {
    const user = await this.getUserByUsername(credentials.username);
    if (user && user.password === credentials.password) { // In a real app, use bcrypt.compare
      return user;
    }
    return null;
  }
  
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.isOnline = isOnline;
      this.users.set(userId, user);
    }
  }
  
  async updateUserLastSeen(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastSeen = new Date().toISOString();
      this.users.set(userId, user);
    }
  }
  
  // Public Message Methods
  async getAllMessages(): Promise<(ChatMessage | SystemMessage)[]> {
    return Array.from(this.messages.values());
  }
  
  async createMessage(message: InsertMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const timestamp = new Date().toISOString();
    
    const chatMessage: ChatMessage = {
      id,
      userId: message.userId,
      username: message.username,
      content: message.content,
      timestamp,
      type: 'message'
    };
    
    this.messages.set(id, chatMessage);
    return chatMessage;
  }
  
  async createSystemMessage(content: string): Promise<SystemMessage> {
    const id = this.currentMessageId++;
    const timestamp = new Date().toISOString();
    
    const systemMessage: SystemMessage = {
      id,
      content,
      timestamp,
      type: 'system'
    };
    
    this.messages.set(id, systemMessage);
    return systemMessage;
  }
  
  // Direct Message Methods
  async getDirectMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<DirectChatMessage[]> {
    return Array.from(this.directMessages.values()).filter(
      (msg) => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) || 
        (msg.senderId === user2Id && msg.receiverId === user1Id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async getDirectMessagesByUser(userId: number): Promise<DirectChatMessage[]> {
    return Array.from(this.directMessages.values()).filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId
    );
  }
  
  async createDirectMessage(message: InsertDirectMessage): Promise<DirectChatMessage> {
    const id = this.currentDirectMessageId++;
    const timestamp = new Date().toISOString();
    
    const directMessage: DirectChatMessage = {
      id,
      senderId: message.senderId,
      senderUsername: message.senderUsername,
      receiverId: message.receiverId,
      receiverUsername: message.receiverUsername,
      content: message.content,
      timestamp,
      read: false,
      type: 'direct-message'
    };
    
    this.directMessages.set(id, directMessage);
    return directMessage;
  }
  
  async markDirectMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    for (const [id, message] of this.directMessages.entries()) {
      if (message.senderId === senderId && message.receiverId === receiverId && !message.read) {
        message.read = true;
        this.directMessages.set(id, message);
      }
    }
  }
  
  async getUnreadMessageCount(userId: number): Promise<Record<number, number>> {
    const unreadCounts: Record<number, number> = {};
    
    for (const message of this.directMessages.values()) {
      if (message.receiverId === userId && !message.read) {
        if (!unreadCounts[message.senderId]) {
          unreadCounts[message.senderId] = 0;
        }
        unreadCounts[message.senderId]++;
      }
    }
    
    return unreadCounts;
  }
  
  // Connected User Methods
  async getConnectedUsers(): Promise<{ id: number, username: string, isOnline: boolean, lastSeen?: string }[]> {
    return Array.from(this.connectedUsers.values());
  }
  
  async addConnectedUser(user: User): Promise<void> {
    await this.updateUserOnlineStatus(user.id, true);
    
    this.connectedUsers.set(user.id, { 
      id: user.id, 
      username: user.username,
      isOnline: true,
      lastSeen: new Date().toISOString()
    });
  }
  
  async removeConnectedUser(userId: number): Promise<void> {
    await this.updateUserOnlineStatus(userId, false);
    await this.updateUserLastSeen(userId);
    this.connectedUsers.delete(userId);
  }
}

export const storage = new MemStorage();
