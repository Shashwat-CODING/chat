import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { log } from "./vite";
import { 
  type ChatMessage, 
  type SystemMessage, 
  type ConnectionMessage,
  type UserListMessage,
  type WebSocketMessage,
  type DirectChatMessage,
  type AuthMessage,
  signInSchema
} from "@shared/schema";

// Map to store client connections with user IDs
const clients: Map<number, WebSocket> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // REST endpoints
  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      if (!username || typeof username !== "string" || username.length < 2 || username.length > 15) {
        return res.status(400).json({ message: "Invalid username. Must be 2-15 characters" });
      }
      
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Invalid password. Must be at least 6 characters" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create a new user
      const newUser = await storage.createUser({ 
        username,
        password,
        email
      });
      
      res.status(201).json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      log(`Error creating user: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Login a user
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate credentials
      const validation = signInSchema.safeParse({ username, password });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Authenticate user
      const user = await storage.authenticateUser({ username, password });
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Return user info
      res.status(200).json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
    } catch (error) {
      log(`Error logging in: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Backward compatibility for the old users endpoint
  app.post("/api/users", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username || typeof username !== "string" || username.length < 2 || username.length > 15) {
        return res.status(400).json({ message: "Invalid username. Must be 2-15 characters" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // If user exists, return existing user
        return res.status(200).json({ id: existingUser.id, username: existingUser.username });
      }
      
      // Create a new user with a default password
      const newUser = await storage.createUser({ 
        username,
        password: username, // Simple password same as username for testing
        email: null
      });
      
      res.status(201).json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      log(`Error creating user: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all public messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      log(`Error fetching messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get direct messages between two users
  app.get("/api/messages/direct/:user1Id/:user2Id", async (req, res) => {
    try {
      const user1Id = parseInt(req.params.user1Id);
      const user2Id = parseInt(req.params.user2Id);
      
      if (isNaN(user1Id) || isNaN(user2Id)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      
      const messages = await storage.getDirectMessagesBetweenUsers(user1Id, user2Id);
      res.json(messages);
    } catch (error) {
      log(`Error fetching direct messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all direct messages for a user
  app.get("/api/messages/direct/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getDirectMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      log(`Error fetching user direct messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Mark direct messages as read
  app.post("/api/messages/direct/read", async (req, res) => {
    try {
      const { senderId, receiverId } = req.body;
      
      if (!senderId || !receiverId || isNaN(senderId) || isNaN(receiverId)) {
        return res.status(400).json({ message: "Invalid sender or receiver ID" });
      }
      
      await storage.markDirectMessagesAsRead(senderId, receiverId);
      res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
      log(`Error marking messages as read: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get unread message counts for a user
  app.get("/api/messages/unread/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const unreadCounts = await storage.getUnreadMessageCount(userId);
      res.json(unreadCounts);
    } catch (error) {
      log(`Error fetching unread message counts: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle authentication
        if (message.type === 'auth') {
          const { username, password } = message;
          const user = await storage.authenticateUser({ username, password });
          
          if (user) {
            userId = user.id;
            
            // Store client connection
            clients.set(userId, ws);
            
            // Update user status to online
            await storage.updateUserOnlineStatus(userId, true);
            
            // Send authentication confirmation
            const authMessage: AuthMessage = {
              type: 'auth',
              status: 'success',
              userId: user.id,
              username: user.username
            };
            ws.send(JSON.stringify(authMessage));
            
            // Send user list to all clients
            const connectedUsers = await storage.getConnectedUsers();
            const userListMessage: UserListMessage = {
              type: 'userList',
              users: connectedUsers
            };
            broadcastMessage(userListMessage);
          } else {
            // Authentication failed
            const authMessage: AuthMessage = {
              type: 'auth',
              status: 'error',
              message: 'Invalid username or password'
            };
            ws.send(JSON.stringify(authMessage));
          }
        }
        
        // Handle initial connection with user info
        if (message.type === 'connect' && message.userId) {
          userId = message.userId;
          
          // Type guard to ensure userId is a number
          if (typeof userId === 'number') {
            const user = await storage.getUser(userId);
            
            if (user) {
              // Store client connection
              clients.set(userId, ws);
              
              // Add to connected users list
              await storage.addConnectedUser(user);
              
              // Create system message for user join
              const systemMessage = await storage.createSystemMessage(`${user.username} joined the chat`);
              
              // Send connection confirmation to the client
              const connectionMessage: ConnectionMessage = {
                type: 'connection',
                status: 'connected',
                userId: user.id,
                username: user.username
              };
              ws.send(JSON.stringify(connectionMessage));
              
              // Send system message to all clients
              broadcastMessage(systemMessage);
              
              // Send updated user list to all clients
              const connectedUsers = await storage.getConnectedUsers();
              const userListMessage: UserListMessage = {
                type: 'userList',
                users: connectedUsers
              };
              broadcastMessage(userListMessage);
              
              // Send message history to new client
              const messageHistory = await storage.getAllMessages();
              messageHistory.forEach(msg => {
                ws.send(JSON.stringify(msg));
              });
            }
          }
        }
        
        // Handle public chat messages
        if (message.type === 'message' && userId) {
          const user = await storage.getUser(userId);
          
          if (user && message.content) {
            // Create and store the message
            const chatMessage = await storage.createMessage({
              userId: user.id,
              username: user.username,
              content: message.content
            });
            
            // Broadcast the message to all clients
            broadcastMessage(chatMessage);
          }
        }
        
        // Handle direct messages
        if (message.type === 'direct-message' && userId) {
          const { receiverId, content } = message;
          
          if (!receiverId || !content) {
            return;
          }
          
          const sender = await storage.getUser(userId);
          const receiver = await storage.getUser(receiverId);
          
          if (sender && receiver) {
            // Create and store the direct message
            const directMessage = await storage.createDirectMessage({
              senderId: sender.id,
              senderUsername: sender.username,
              receiverId: receiver.id,
              receiverUsername: receiver.username,
              content
            });
            
            // Send to sender
            const senderWs = clients.get(sender.id);
            if (senderWs && senderWs.readyState === WebSocket.OPEN) {
              senderWs.send(JSON.stringify(directMessage));
            }
            
            // Send to receiver if online
            const receiverWs = clients.get(receiver.id);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify(directMessage));
            }
          }
        }
        
        // Handle reading direct messages
        if (message.type === 'mark-read' && userId) {
          const { senderId } = message;
          
          if (!senderId) {
            return;
          }
          
          await storage.markDirectMessagesAsRead(senderId, userId);
          
          // Notify the sender that messages were read
          const senderWs = clients.get(senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({
              type: 'messages-read',
              senderId,
              receiverId: userId
            }));
          }
        }
      } catch (error) {
        log(`WebSocket message error: ${error}`, "server");
      }
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      if (userId) {
        // Remove from clients map
        clients.delete(userId);
        
        // Remove from connected users
        await storage.removeConnectedUser(userId);
        
        // Get user info before removing
        const user = await storage.getUser(userId);
        
        if (user) {
          // Create system message for user leaving
          const systemMessage = await storage.createSystemMessage(`${user.username} left the chat`);
          
          // Broadcast system message
          broadcastMessage(systemMessage);
          
          // Send updated user list
          const connectedUsers = await storage.getConnectedUsers();
          const userListMessage: UserListMessage = {
            type: 'userList',
            users: connectedUsers
          };
          broadcastMessage(userListMessage);
        }
      }
    });
  });
  
  // Function to broadcast messages to all connected clients
  function broadcastMessage(message: WebSocketMessage) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
