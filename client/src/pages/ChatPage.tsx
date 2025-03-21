import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useChat } from "@/hooks/useChat";
import { DirectMessagePanel } from "@/components/chat/DirectMessagePanel";
import { UserList } from "@/components/chat/UserList";
import { MobileNav } from "@/components/chat/MobileNav";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { UsernameModal } from "@/components/chat/UsernameModal";
import { ConnectionErrorModal } from "@/components/chat/ConnectionErrorModal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { LogOut, MessageCircle, Users } from "lucide-react";
import { createUniqueMessageMap } from "@/useChat.fix";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChatPage() {
  const {
    username,
    userId,
    connectionStatus,
    showConnectionError,
    showUsernameModal,
    showLoginPrompt,
    messages,
    connectedUsers,
    directChat,
    handleSendMessage,
    handleSetUsername,
    handleRetryConnection,
    handleSignOut
  } = useChat();
  
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Redirect to login if needed
  useEffect(() => {
    if (showLoginPrompt) {
      setLocation('/auth');
    }
  }, [showLoginPrompt, setLocation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // If no user is authenticated, show nothing (will redirect)
  if (!userId) return null;
  
  const isConnected = connectionStatus === 'connected';
  
  // Selected user direct messages
  const selectedUserMessages = directChat.selectedUser 
    ? directChat.directMessages[directChat.selectedUser.id] || []
    : [];
    
  // Create a map of messages with unique keys to prevent React warnings
  const uniqueMessages = useMemo(() => {
    return createUniqueMessageMap(messages);
  }, [messages]);

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-background border-b px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">ChatterBox</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium mr-2">
              Signed in as: <span className="text-primary">{username}</span>
            </div>
            <ConnectionStatus status={connectionStatus} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="gap-1"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - User List */}
          <div className="w-64 border-r p-4 hidden md:block">
            <UserList
              users={connectedUsers}
              currentUserId={userId || 0}
              unreadCounts={directChat.unreadCounts}
              onSelectUser={directChat.selectUser}
            />
          </div>
          
          {/* Main chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {directChat.selectedUser ? (
              /* Direct messaging panel */
              <DirectMessagePanel
                selectedUserId={directChat.selectedUser.id}
                selectedUsername={directChat.selectedUser.username}
                currentUserId={userId}
                currentUsername={username}
                messages={selectedUserMessages}
                onClose={directChat.clearSelectedUser}
              />
            ) : (
              /* Public chat panel */
              <>
                <div className="p-3 bg-muted/20 border-b flex items-center gap-2">
                  <Users size={18} />
                  <h2 className="font-semibold">Public Chat</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {Object.entries(uniqueMessages).map(([uniqueId, message]) => (
                      <MessageBubble
                        key={uniqueId}
                        message={message}
                        isCurrentUser={
                          message.type === "message" && 
                          "username" in message && 
                          message.username === username
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message input */}
                <div className="border-t p-4">
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    isConnected={isConnected}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <UsernameModal
        isOpen={showUsernameModal}
        onSubmit={handleSetUsername}
      />
      
      <ConnectionErrorModal
        isOpen={showConnectionError}
        onRetry={handleRetryConnection}
      />
    </>
  );
}
