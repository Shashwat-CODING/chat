import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

// Configure neon to use WebSocket for better performance
neonConfig.fetchConnectionCache = true;

// Make sure we have a database connection string
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL environment variable is not set!");
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.startsWith('PG') || key.includes('DATABASE')));
  throw new Error("No database connection string was provided. Please make sure DATABASE_URL environment variable is properly set.");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

// Create public exported functions for database operations
export async function findUserById(id: number) {
  const result = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
  return result;
}

export async function findUserByUsername(username: string) {
  const result = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  return result;
}

export async function createUser(user: schema.InsertUser) {
  const result = await db.insert(schema.users).values(user).returning();
  return result[0];
}

export async function updateUserOnlineStatus(userId: number, isOnline: boolean) {
  await db.update(schema.users)
    .set({ isOnline })
    .where(eq(schema.users.id, userId));
}

export async function updateUserLastSeen(userId: number) {
  await db.update(schema.users)
    .set({ lastSeen: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function getAllMessages() {
  const result = await db.query.messages.findMany({
    orderBy: (messages) => [messages.timestamp],
  });
  
  // Transform to ChatMessage or SystemMessage type
  return result.map(msg => {
    if (msg.type === 'system') {
      return {
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
        type: 'system' as const
      };
    } else {
      return {
        id: msg.id,
        userId: msg.userId,
        username: msg.username,
        content: msg.content,
        timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
        type: 'message' as const
      };
    }
  });
}

export async function createMessage(message: schema.InsertMessage) {
  const result = await db.insert(schema.messages).values({
    userId: message.userId,
    username: message.username,
    content: message.content,
    type: message.type || 'message',
  }).returning();
  
  const msg = result[0];
  return {
    id: msg.id,
    userId: msg.userId,
    username: msg.username,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
    type: 'message' as const
  };
}

export async function createSystemMessage(content: string) {
  // Find the first user in the system to use as the system message user
  // This is a workaround for the foreign key constraint
  const firstUser = await db.query.users.findFirst();
  
  if (!firstUser) {
    // If no users exist, we can't create a system message that satisfies the foreign key constraint
    // Return a synthetic system message without storing it in the database
    return {
      id: Date.now(),  // Use current timestamp as a unique ID
      content,
      timestamp: new Date().toISOString(),
      type: 'system' as const
    };
  }
  
  const result = await db.insert(schema.messages).values({
    content,
    type: 'system',
    userId: firstUser.id,  // Use an existing user ID to satisfy the foreign key constraint
    username: 'System',
  }).returning();
  
  const msg = result[0];
  return {
    id: msg.id,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
    type: 'system' as const
  };
}

export async function getDirectMessagesBetweenUsers(user1Id: number, user2Id: number) {
  const result = await db.query.directMessages.findMany({
    where: (directMessages) => (
      or(
        and(
          eq(directMessages.senderId, user1Id),
          eq(directMessages.receiverId, user2Id)
        ),
        and(
          eq(directMessages.senderId, user2Id),
          eq(directMessages.receiverId, user1Id)
        )
      )
    ),
    orderBy: (directMessages) => [directMessages.timestamp],
    with: {
      sender: true,
      receiver: true,
    },
  });
  
  return result.map(msg => {
    if (!msg.sender || !msg.receiver) {
      throw new Error('User relation not found');
    }
    
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderUsername: msg.sender.username,
      receiverId: msg.receiverId,
      receiverUsername: msg.receiver.username,
      content: msg.content,
      timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
      read: msg.read || false,
      type: 'direct-message' as const,
    };
  });
}

export async function getDirectMessagesByUser(userId: number) {
  const result = await db.query.directMessages.findMany({
    where: (directMessages) => (
      or(
        eq(directMessages.senderId, userId),
        eq(directMessages.receiverId, userId)
      )
    ),
    orderBy: (directMessages) => [directMessages.timestamp],
    with: {
      sender: true,
      receiver: true,
    },
  });
  
  return result.map(msg => {
    if (!msg.sender || !msg.receiver) {
      throw new Error('User relation not found');
    }
    
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderUsername: msg.sender.username,
      receiverId: msg.receiverId,
      receiverUsername: msg.receiver.username,
      content: msg.content,
      timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
      read: msg.read || false,
      type: 'direct-message' as const,
    };
  });
}

export async function createDirectMessage(message: schema.InsertDirectMessage) {
  const result = await db.insert(schema.directMessages).values({
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    read: false,
  }).returning();
  
  // Get the sender and receiver usernames to include in the response
  const [sender, receiver] = await Promise.all([
    findUserById(message.senderId),
    findUserById(message.receiverId),
  ]);
  
  if (!sender || !receiver) {
    throw new Error('User not found');
  }
  
  const msg = result[0];
  return {
    id: msg.id,
    senderId: msg.senderId,
    senderUsername: sender.username,
    receiverId: msg.receiverId,
    receiverUsername: receiver.username,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
    read: msg.read || false,
    type: 'direct-message' as const,
  };
}

export async function markDirectMessagesAsRead(senderId: number, receiverId: number) {
  await db.update(schema.directMessages)
    .set({ read: true })
    .where(
      and(
        eq(schema.directMessages.senderId, senderId),
        eq(schema.directMessages.receiverId, receiverId),
        eq(schema.directMessages.read, false)
      )
    );
}

export async function getUnreadMessageCount(userId: number) {
  const unreadMessages = await db.query.directMessages.findMany({
    where: (directMessages) => (
      and(
        eq(directMessages.receiverId, userId),
        eq(directMessages.read, false)
      )
    ),
  });
  
  const counts: Record<number, number> = {};
  unreadMessages.forEach(msg => {
    if (!counts[msg.senderId]) {
      counts[msg.senderId] = 0;
    }
    counts[msg.senderId]++;
  });
  
  return counts;
}

export async function getAllUsers() {
  const users = await db.query.users.findMany();
  return users;
}

// Add authentication function
export async function authenticateUser(credentials: schema.SignInCredentials) {
  const user = await findUserByUsername(credentials.username);
  if (!user) return null;
  
  // In a real app, we'd use a proper password comparison with bcrypt
  if (user.password !== credentials.password) return null;
  
  return user;
}