var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/db.ts
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  directMessages: () => directMessages,
  directMessagesRelations: () => directMessagesRelations,
  insertDirectMessageSchema: () => insertDirectMessageSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  signInSchema: () => signInSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Added fields for user authentication and profile
  email: text("email"),
  avatarUrl: text("avatar_url"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen")
});
var usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(directMessages, { relationName: "sender" }),
  receivedMessages: many(directMessages, { relationName: "receiver" }),
  publicMessages: many(messages)
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var signInSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username must be less than 50 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").default("message").notNull()
});
var messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id]
  })
}));
var insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  username: true,
  content: true,
  type: true
});
var directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").default(false)
});
var directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sender"
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
    relationName: "receiver"
  })
}));
var insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  senderId: true,
  receiverId: true,
  content: true
});

// server/db.ts
import { eq, and, or } from "drizzle-orm";
neonConfig.fetchConnectionCache = true;
var sql = neon(process.env.DATABASE_URL);
var db = drizzle(sql, { schema: schema_exports });
async function findUserById(id) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id)
  });
  return result;
}
async function findUserByUsername(username) {
  const result = await db.query.users.findFirst({
    where: eq(users.username, username)
  });
  return result;
}
async function createUser(user) {
  const result = await db.insert(users).values(user).returning();
  return result[0];
}
async function updateUserOnlineStatus(userId, isOnline) {
  await db.update(users).set({ isOnline }).where(eq(users.id, userId));
}
async function updateUserLastSeen(userId) {
  await db.update(users).set({ lastSeen: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getAllMessages() {
  const result = await db.query.messages.findMany({
    orderBy: (messages2) => [messages2.timestamp]
  });
  return result.map((msg) => {
    if (msg.type === "system") {
      return {
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        type: "system"
      };
    } else {
      return {
        id: msg.id,
        userId: msg.userId,
        username: msg.username,
        content: msg.content,
        timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        type: "message"
      };
    }
  });
}
async function createMessage(message) {
  const result = await db.insert(messages).values({
    userId: message.userId,
    username: message.username,
    content: message.content,
    type: message.type || "message"
  }).returning();
  const msg = result[0];
  return {
    id: msg.id,
    userId: msg.userId,
    username: msg.username,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
    type: "message"
  };
}
async function createSystemMessage(content) {
  const firstUser = await db.query.users.findFirst();
  if (!firstUser) {
    return {
      id: Date.now(),
      // Use current timestamp as a unique ID
      content,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "system"
    };
  }
  const result = await db.insert(messages).values({
    content,
    type: "system",
    userId: firstUser.id,
    // Use an existing user ID to satisfy the foreign key constraint
    username: "System"
  }).returning();
  const msg = result[0];
  return {
    id: msg.id,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
    type: "system"
  };
}
async function getDirectMessagesBetweenUsers(user1Id, user2Id) {
  const result = await db.query.directMessages.findMany({
    where: (directMessages2) => or(
      and(
        eq(directMessages2.senderId, user1Id),
        eq(directMessages2.receiverId, user2Id)
      ),
      and(
        eq(directMessages2.senderId, user2Id),
        eq(directMessages2.receiverId, user1Id)
      )
    ),
    orderBy: (directMessages2) => [directMessages2.timestamp],
    with: {
      sender: true,
      receiver: true
    }
  });
  return result.map((msg) => {
    if (!msg.sender || !msg.receiver) {
      throw new Error("User relation not found");
    }
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderUsername: msg.sender.username,
      receiverId: msg.receiverId,
      receiverUsername: msg.receiver.username,
      content: msg.content,
      timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
      read: msg.read || false,
      type: "direct-message"
    };
  });
}
async function getDirectMessagesByUser(userId) {
  const result = await db.query.directMessages.findMany({
    where: (directMessages2) => or(
      eq(directMessages2.senderId, userId),
      eq(directMessages2.receiverId, userId)
    ),
    orderBy: (directMessages2) => [directMessages2.timestamp],
    with: {
      sender: true,
      receiver: true
    }
  });
  return result.map((msg) => {
    if (!msg.sender || !msg.receiver) {
      throw new Error("User relation not found");
    }
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderUsername: msg.sender.username,
      receiverId: msg.receiverId,
      receiverUsername: msg.receiver.username,
      content: msg.content,
      timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
      read: msg.read || false,
      type: "direct-message"
    };
  });
}
async function createDirectMessage(message) {
  const result = await db.insert(directMessages).values({
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    read: false
  }).returning();
  const [sender, receiver] = await Promise.all([
    findUserById(message.senderId),
    findUserById(message.receiverId)
  ]);
  if (!sender || !receiver) {
    throw new Error("User not found");
  }
  const msg = result[0];
  return {
    id: msg.id,
    senderId: msg.senderId,
    senderUsername: sender.username,
    receiverId: msg.receiverId,
    receiverUsername: receiver.username,
    content: msg.content,
    timestamp: msg.timestamp?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
    read: msg.read || false,
    type: "direct-message"
  };
}
async function markDirectMessagesAsRead(senderId, receiverId) {
  await db.update(directMessages).set({ read: true }).where(
    and(
      eq(directMessages.senderId, senderId),
      eq(directMessages.receiverId, receiverId),
      eq(directMessages.read, false)
    )
  );
}
async function getUnreadMessageCount(userId) {
  const unreadMessages = await db.query.directMessages.findMany({
    where: (directMessages2) => and(
      eq(directMessages2.receiverId, userId),
      eq(directMessages2.read, false)
    )
  });
  const counts = {};
  unreadMessages.forEach((msg) => {
    if (!counts[msg.senderId]) {
      counts[msg.senderId] = 0;
    }
    counts[msg.senderId]++;
  });
  return counts;
}
async function authenticateUser(credentials) {
  const user = await findUserByUsername(credentials.username);
  if (!user) return null;
  if (user.password !== credentials.password) return null;
  return user;
}

// server/storage.ts
var DatabaseStorage = class {
  connectedUsers;
  constructor() {
    this.connectedUsers = /* @__PURE__ */ new Map();
  }
  // User Management Methods
  async getUser(id) {
    return findUserById(id);
  }
  async getUserByUsername(username) {
    return findUserByUsername(username);
  }
  async createUser(user) {
    return createUser(user);
  }
  async authenticateUser(credentials) {
    return authenticateUser(credentials);
  }
  async updateUserOnlineStatus(userId, isOnline) {
    await updateUserOnlineStatus(userId, isOnline);
  }
  async updateUserLastSeen(userId) {
    await updateUserLastSeen(userId);
  }
  // Public Message Methods
  async getAllMessages() {
    return getAllMessages();
  }
  async createMessage(message) {
    return createMessage(message);
  }
  async createSystemMessage(content) {
    return createSystemMessage(content);
  }
  // Direct Message Methods
  async getDirectMessagesBetweenUsers(user1Id, user2Id) {
    return getDirectMessagesBetweenUsers(user1Id, user2Id);
  }
  async getDirectMessagesByUser(userId) {
    return getDirectMessagesByUser(userId);
  }
  async createDirectMessage(message) {
    return createDirectMessage(message);
  }
  async markDirectMessagesAsRead(senderId, receiverId) {
    await markDirectMessagesAsRead(senderId, receiverId);
  }
  async getUnreadMessageCount(userId) {
    return getUnreadMessageCount(userId);
  }
  // Connected User Methods
  async getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
  async addConnectedUser(user) {
    await this.updateUserOnlineStatus(user.id, true);
    this.connectedUsers.set(user.id, {
      id: user.id,
      username: user.username,
      isOnline: true,
      lastSeen: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async removeConnectedUser(userId) {
    await this.updateUserOnlineStatus(userId, false);
    await this.updateUserLastSeen(userId);
    this.connectedUsers.delete(userId);
  }
};
var storage = new DatabaseStorage();

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/routes.ts
var clients = /* @__PURE__ */ new Map();
async function registerRoutes(app2) {
  app2.post("/api/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || typeof username !== "string" || username.length < 2 || username.length > 15) {
        return res.status(400).json({ message: "Invalid username. Must be 2-15 characters" });
      }
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Invalid password. Must be at least 6 characters" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
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
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const validation = signInSchema.safeParse({ username, password });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const user = await storage.authenticateUser({ username, password });
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
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
  app2.post("/api/users", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== "string" || username.length < 2 || username.length > 15) {
        return res.status(400).json({ message: "Invalid username. Must be 2-15 characters" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(200).json({ id: existingUser.id, username: existingUser.username });
      }
      const newUser = await storage.createUser({
        username,
        password: username,
        // Simple password same as username for testing
        email: null
      });
      res.status(201).json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      log(`Error creating user: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/messages", async (req, res) => {
    try {
      const messages2 = await storage.getAllMessages();
      res.json(messages2);
    } catch (error) {
      log(`Error fetching messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/messages/direct/:user1Id/:user2Id", async (req, res) => {
    try {
      const user1Id = parseInt(req.params.user1Id);
      const user2Id = parseInt(req.params.user2Id);
      if (isNaN(user1Id) || isNaN(user2Id)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      const messages2 = await storage.getDirectMessagesBetweenUsers(user1Id, user2Id);
      res.json(messages2);
    } catch (error) {
      log(`Error fetching direct messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/messages/direct/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const messages2 = await storage.getDirectMessagesByUser(userId);
      res.json(messages2);
    } catch (error) {
      log(`Error fetching user direct messages: ${error}`, "server");
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/messages/direct/read", async (req, res) => {
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
  app2.get("/api/messages/unread/:userId", async (req, res) => {
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
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", async (ws) => {
    let userId = null;
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "auth") {
          const { username, password } = message;
          const user = await storage.authenticateUser({ username, password });
          if (user) {
            userId = user.id;
            clients.set(userId, ws);
            await storage.updateUserOnlineStatus(userId, true);
            const authMessage = {
              type: "auth",
              status: "success",
              userId: user.id,
              username: user.username
            };
            ws.send(JSON.stringify(authMessage));
            const connectedUsers = await storage.getConnectedUsers();
            const userListMessage = {
              type: "userList",
              users: connectedUsers
            };
            broadcastMessage(userListMessage);
          } else {
            const authMessage = {
              type: "auth",
              status: "error",
              message: "Invalid username or password"
            };
            ws.send(JSON.stringify(authMessage));
          }
        }
        if (message.type === "connect" && message.userId) {
          userId = message.userId;
          if (typeof userId === "number") {
            const user = await storage.getUser(userId);
            if (user) {
              clients.set(userId, ws);
              await storage.addConnectedUser(user);
              const systemMessage = await storage.createSystemMessage(`${user.username} joined the chat`);
              const connectionMessage = {
                type: "connection",
                status: "connected",
                userId: user.id,
                username: user.username
              };
              ws.send(JSON.stringify(connectionMessage));
              broadcastMessage(systemMessage);
              const connectedUsers = await storage.getConnectedUsers();
              const userListMessage = {
                type: "userList",
                users: connectedUsers
              };
              broadcastMessage(userListMessage);
              const messageHistory = await storage.getAllMessages();
              messageHistory.forEach((msg) => {
                ws.send(JSON.stringify(msg));
              });
            }
          }
        }
        if (message.type === "message" && userId) {
          const user = await storage.getUser(userId);
          if (user && message.content) {
            const chatMessage = await storage.createMessage({
              userId: user.id,
              username: user.username,
              content: message.content
            });
            broadcastMessage(chatMessage);
          }
        }
        if (message.type === "direct-message" && userId) {
          const { receiverId, content } = message;
          if (!receiverId || !content) {
            return;
          }
          const sender = await storage.getUser(userId);
          const receiver = await storage.getUser(receiverId);
          if (sender && receiver) {
            const directMessage = await storage.createDirectMessage({
              senderId: sender.id,
              senderUsername: sender.username,
              receiverId: receiver.id,
              receiverUsername: receiver.username,
              content
            });
            const senderWs = clients.get(sender.id);
            if (senderWs && senderWs.readyState === WebSocket.OPEN) {
              senderWs.send(JSON.stringify(directMessage));
            }
            const receiverWs = clients.get(receiver.id);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify(directMessage));
            }
          }
        }
        if (message.type === "mark-read" && userId) {
          const { senderId } = message;
          if (!senderId) {
            return;
          }
          await storage.markDirectMessagesAsRead(senderId, userId);
          const senderWs = clients.get(senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({
              type: "messages-read",
              senderId,
              receiverId: userId
            }));
          }
        }
      } catch (error) {
        log(`WebSocket message error: ${error}`, "server");
      }
    });
    ws.on("close", async () => {
      if (userId) {
        clients.delete(userId);
        await storage.removeConnectedUser(userId);
        const user = await storage.getUser(userId);
        if (user) {
          const systemMessage = await storage.createSystemMessage(`${user.username} left the chat`);
          broadcastMessage(systemMessage);
          const connectedUsers = await storage.getConnectedUsers();
          const userListMessage = {
            type: "userList",
            users: connectedUsers
          };
          broadcastMessage(userListMessage);
        }
      }
    });
  });
  function broadcastMessage(message) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  return httpServer;
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
