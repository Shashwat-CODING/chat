// Production server for running on Render

import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './dist/storage.js';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Set up WebSocket server
const wss = new WebSocketServer({ server });

// Map to store client connections
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'auth':
          // Handle authentication
          if (data.credentials) {
            const user = await storage.authenticateUser(data.credentials);
            if (user) {
              userId = user.id;
              clients.set(userId, ws);
              
              // Mark user as online
              await storage.updateUserOnlineStatus(userId, true);
              
              // Send auth success message
              ws.send(JSON.stringify({
                type: 'auth',
                status: 'success',
                userId: user.id,
                username: user.username
              }));
              
              // Send all previous messages
              const messages = await storage.getAllMessages();
              messages.forEach(msg => {
                ws.send(JSON.stringify(msg));
              });
              
              // Send user list
              const users = await storage.getConnectedUsers();
              ws.send(JSON.stringify({
                type: 'userList',
                users
              }));
              
              // Notify others that a new user has connected
              broadcastMessage({
                type: 'connection',
                status: 'connected',
                userId: user.id,
                username: user.username
              });
            } else {
              // Auth failed
              ws.send(JSON.stringify({
                type: 'auth',
                status: 'error',
                message: 'Authentication failed'
              }));
            }
          }
          break;
          
        case 'message':
          // Handle new message
          if (userId && data.content) {
            const message = await storage.createMessage({
              userId,
              username: data.username,
              content: data.content
            });
            
            // Broadcast message to all clients
            broadcastMessage(message);
          }
          break;
          
        case 'direct-message':
          // Handle direct message
          if (userId && data.receiverId && data.content) {
            const message = await storage.createDirectMessage({
              senderId: userId,
              receiverId: data.receiverId,
              content: data.content
            });
            
            // Send to sender
            ws.send(JSON.stringify(message));
            
            // Send to receiver
            const receiverWs = clients.get(data.receiverId);
            if (receiverWs) {
              receiverWs.send(JSON.stringify(message));
            }
          }
          break;
          
        case 'messages-read':
          // Handle marking messages as read
          if (userId && data.senderId) {
            await storage.markDirectMessagesAsRead(data.senderId, userId);
            
            // Notify sender that messages were read
            const senderWs = clients.get(data.senderId);
            if (senderWs) {
              senderWs.send(JSON.stringify({
                type: 'messages-read',
                senderId: data.senderId,
                receiverId: userId
              }));
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', async () => {
    if (userId) {
      // Remove client from map
      clients.delete(userId);
      
      // Mark user as offline
      await storage.updateUserOnlineStatus(userId, false);
      await storage.updateUserLastSeen(userId);
      
      // Notify others that user has disconnected
      broadcastMessage({
        type: 'connection',
        status: 'disconnected',
        userId,
      });
      
      // Update user list
      const users = await storage.getConnectedUsers();
      broadcastMessage({
        type: 'userList',
        users
      });
    }
  });
});

// Broadcast message to all connected clients
function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'dist', 'client')));

// API routes for user authentication
app.use(express.json());

app.post('/api/auth/signup', async (req, res) => {
  try {
    const user = await storage.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const user = await storage.authenticateUser(req.body);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});