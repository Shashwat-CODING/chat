import { WebSocketMessage, type SignInCredentials } from "@shared/schema";

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type SocketConfig = {
  onMessage: (message: WebSocketMessage) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: () => void;
  onAuthResult?: (success: boolean, userId?: number, username?: string, message?: string) => void;
};

class SocketClient {
  private socket: WebSocket | null = null;
  private config: SocketConfig | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private authenticatedCredentials: SignInCredentials | null = null;
  
  // Initialize with user ID (legacy support)
  init(userId: number, config: SocketConfig) {
    this.userId = userId;
    this.config = config;
    this.connect();
  }
  
  // Initialize with credentials (new auth flow)
  initWithCredentials(credentials: SignInCredentials, config: SocketConfig) {
    this.config = config;
    this.authenticatedCredentials = credentials;
    this.connect();
  }
  
  connect() {
    if ((!this.userId && !this.authenticatedCredentials) || !this.config) return;
    
    this.config.onStatusChange('connecting');
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      
      // If we have credentials, use auth approach
      if (this.authenticatedCredentials) {
        this.send({
          type: 'auth',
          username: this.authenticatedCredentials.username,
          password: this.authenticatedCredentials.password
        });
      } 
      // Otherwise, use the legacy approach
      else if (this.userId) {
        this.config?.onStatusChange('connected');
        
        // Send initial connection message with user ID
        this.send({
          type: 'connect',
          userId: this.userId
        });
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        // Handle auth response
        if (message.type === 'auth') {
          if (message.status === 'success' && message.userId) {
            this.userId = message.userId;
            this.config?.onStatusChange('connected');
            this.config?.onAuthResult?.(true, message.userId, message.username);
          } else {
            this.config?.onAuthResult?.(false, undefined, undefined, message.message);
            this.config?.onStatusChange('disconnected');
          }
        }
        
        this.config?.onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.socket.onclose = () => {
      this.config?.onStatusChange('disconnected');
      this.attemptReconnect();
    };
    
    this.socket.onerror = () => {
      this.config?.onError();
      this.socket?.close();
    };
  }
  
  send(message: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
  
  // Send public message
  sendMessage(content: string) {
    this.send({
      type: 'message',
      content
    });
  }
  
  // Send direct message
  sendDirectMessage(receiverId: number, content: string) {
    this.send({
      type: 'direct-message',
      receiverId,
      content
    });
  }
  
  // Mark messages as read
  markMessagesAsRead(senderId: number) {
    this.send({
      type: 'mark-read',
      senderId
    });
  }
  
  attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000 + Math.random() * 1000);
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear credentials
    this.userId = null;
    this.authenticatedCredentials = null;
  }
}

// Create a singleton instance
export const socketClient = new SocketClient();

export default socketClient;
