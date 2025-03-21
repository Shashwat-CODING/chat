import { useState, useCallback, useEffect } from 'react';
import { socketClient } from '@/lib/socket';
import { DirectChatMessage, WebSocketMessage, MessagesReadMessage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface UseDirectChatProps {
  currentUserId: number;
  onMessage: (message: WebSocketMessage) => void;
}

export function useDirectChat({ currentUserId, onMessage }: UseDirectChatProps) {
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string } | null>(null);
  const [directMessages, setDirectMessages] = useState<Record<number, DirectChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  // Fetch unread message counts when user ID changes
  useEffect(() => {
    if (!currentUserId) return;

    const fetchUnreadCounts = async () => {
      try {
        const response = await apiRequest(`/api/messages/unread/${currentUserId}`);
        const data = await response.json();
        setUnreadCounts(data);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();
  }, [currentUserId]);

  // Select a user for direct messaging
  const selectUser = useCallback(async (userId: number, username: string) => {
    // Set the selected user
    setSelectedUser({ id: userId, username });

    // Fetch direct messages between users
    try {
      if (currentUserId) {
        // Fetch direct messages between current user and selected user
        const response = await apiRequest(`/api/messages/direct/${currentUserId}/${userId}`);
        const messages = await response.json();

        // Add messages to the direct messages state
        setDirectMessages(prev => ({
          ...prev,
          [userId]: messages
        }));

        // Mark messages as read
        socketClient.markMessagesAsRead(userId);

        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [userId]: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching direct messages:', error);
    }
  }, [currentUserId]);

  // Clear selected user
  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // Handle direct message
  const handleDirectMessage = useCallback((message: DirectChatMessage) => {
    // Add message to direct messages state
    setDirectMessages(prev => {
      const otherUserId = 
        message.senderId === currentUserId 
          ? message.receiverId 
          : message.senderId;
      
      // Get existing messages for this user or create empty array
      const existingMessages = prev[otherUserId] || [];
      
      // Add new message
      return {
        ...prev,
        [otherUserId]: [...existingMessages, message]
      };
    });
    
    // If the message is not from the current user and not read, update unread counts
    if (message.senderId !== currentUserId && !message.read) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.senderId]: (prev[message.senderId] || 0) + 1
      }));
    }
    
    // If this is a message from the currently selected user, mark it as read
    if (
      selectedUser && 
      message.senderId === selectedUser.id && 
      !message.read
    ) {
      socketClient.markMessagesAsRead(selectedUser.id);
    }
  }, [currentUserId, selectedUser]);

  // Handle messages read notification
  const handleMessagesRead = useCallback((senderId: number, receiverId: number) => {
    // If the current user is the sender and the receiver has read the messages
    if (currentUserId === senderId) {
      // Update the read status of messages
      setDirectMessages(prev => {
        const receiverMessages = prev[receiverId] || [];
        
        // Mark all messages to this receiver as read
        const updatedMessages = receiverMessages.map(msg => ({
          ...msg,
          read: true
        }));
        
        return {
          ...prev,
          [receiverId]: updatedMessages
        };
      });
    }
  }, [currentUserId]);

  // Set up message listener
  useEffect(() => {
    // Custom handler for direct chat related messages
    const handleIncomingMessage = (message: WebSocketMessage) => {
      // Handle direct messages
      if (message.type === 'direct-message') {
        handleDirectMessage(message);
      }
      // Handle messages read notification
      else if (message.type === 'messages-read') {
        const readMessage = message as MessagesReadMessage;
        handleMessagesRead(readMessage.senderId, readMessage.receiverId);
      }
    };
    
    // Subscribe to messages
    onMessage(handleIncomingMessage);
    
    return () => {
      // No cleanup needed
    };
  }, [handleDirectMessage, handleMessagesRead, onMessage]);

  return {
    selectedUser,
    directMessages,
    unreadCounts,
    selectUser,
    clearSelectedUser
  };
}