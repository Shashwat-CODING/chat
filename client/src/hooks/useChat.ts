import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { socketClient, ConnectionStatus } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import type { 
  ChatMessage, 
  SystemMessage, 
  WebSocketMessage, 
  UserListMessage
} from '@shared/schema';
import { useDirectChat } from './useDirectChat';

type UsesChatReturn = {
  username: string;
  setUsername: (name: string) => void;
  userId: number | null;
  connectionStatus: ConnectionStatus;
  showConnectionError: boolean;
  showUsernameModal: boolean;
  showLoginPrompt: boolean;
  messages: (ChatMessage | SystemMessage)[];
  connectedUsers: Array<{
    id: number;
    username: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  directChat: {
    selectedUser: { id: number; username: string } | null;
    directMessages: Record<number, any>;
    unreadCounts: Record<number, number>;
    selectUser: (userId: number, username: string) => void;
    clearSelectedUser: () => void;
  };
  handleSendMessage: (content: string) => void;
  handleSetUsername: (username: string) => Promise<boolean>;
  handleRetryConnection: () => void;
  handleSignOut: () => void;
};

export function useChat(): UsesChatReturn {
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | SystemMessage)[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Array<{
    id: number;
    username: string;
    isOnline: boolean;
    lastSeen?: string;
  }>>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Forward messages to the directChat hook
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
      case 'system':
        setMessages(prev => [...prev, message]);
        break;
      case 'connection':
        // Handle connection status updates
        if (message.status === 'connected') {
          toast({
            title: 'Connected',
            description: 'You are now connected to the chat server.',
          });
        }
        break;
      case 'userList':
        // Update the connected users list
        setConnectedUsers((message as UserListMessage).users);
        break;
      case 'auth':
        // Handle auth responses
        if (message.status === 'success' && message.userId && message.username) {
          setUserId(message.userId);
          setUsername(message.username);
          localStorage.setItem('userId', message.userId.toString());
          localStorage.setItem('username', message.username);
          setShowUsernameModal(false);
          setShowLoginPrompt(false);
        } else if (message.status === 'error' && message.message) {
          toast({
            title: 'Authentication Error',
            description: message.message,
            variant: 'destructive'
          });
          setShowLoginPrompt(true);
        }
        break;
    }
  }, [toast]);
  
  // Initialize the direct chat hook
  const directChat = useDirectChat({
    currentUserId: userId || 0,
    onMessage: handleMessage
  });
  
  // Check if there's a saved user session
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    
    if (savedUserId && savedUsername) {
      // Attempt to reconnect with saved credentials
      setUserId(Number(savedUserId));
      setUsername(savedUsername);
    } else {
      // No saved session, show login prompt
      setShowLoginPrompt(true);
      setLocation('/auth');
    }
  }, [setLocation]);
  
  // Initialize WebSocket when userId is set
  useEffect(() => {
    if (!userId) return;
    
    socketClient.init(userId, {
      onMessage: handleMessage,
      onStatusChange: handleStatusChange,
      onError: handleConnectionError
    });
    
    return () => {
      socketClient.disconnect();
    };
  }, [userId, handleMessage]);
  
  // Handle WebSocket connection status changes
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    if (status === 'disconnected') {
      toast({
        title: 'Disconnected',
        description: 'You have been disconnected from the chat server.',
        variant: 'destructive'
      });
    }
  }, [toast]);
  
  // Handle connection errors
  const handleConnectionError = useCallback(() => {
    setShowConnectionError(true);
  }, []);
  
  // Send a message
  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim() || !userId) return;
    
    socketClient.sendMessage(content);
  }, [userId]);
  
  // Set username
  const handleSetUsername = useCallback(async (name: string): Promise<boolean> => {
    // For the login flow, this is handled in the AuthPage component
    // This is kept for backward compatibility with the anonymous flow
    if (name.trim()) {
      setUsername(name);
      return true;
    }
    return false;
  }, []);
  
  // Retry connection
  const handleRetryConnection = useCallback(() => {
    if (userId) {
      socketClient.connect();
      setShowConnectionError(false);
    } else {
      setShowUsernameModal(true);
    }
  }, [userId]);
  
  // Sign out
  const handleSignOut = useCallback(() => {
    // Clear local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    // Disconnect socket
    socketClient.disconnect();
    
    // Reset states
    setUserId(null);
    setUsername('');
    setMessages([]);
    
    // Redirect to auth page
    setLocation('/auth');
  }, [setLocation]);
  
  return {
    username,
    setUsername,
    userId,
    connectionStatus,
    showConnectionError,
    showUsernameModal,
    showLoginPrompt,
    messages,
    connectedUsers,
    directChat: {
      selectedUser: directChat.selectedUser,
      directMessages: directChat.directMessages,
      unreadCounts: directChat.unreadCounts,
      selectUser: directChat.selectUser,
      clearSelectedUser: directChat.clearSelectedUser
    },
    handleSendMessage,
    handleSetUsername,
    handleRetryConnection,
    handleSignOut
  };
}