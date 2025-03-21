import { useEffect, useMemo, useState, useRef } from "react";
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
import { LogOut, MessageCircle, Users, Menu, X } from "lucide-react";
import { createUniqueMessageMap } from "@/useChat.fix";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChatPage() {
  // Hooks must be called in the same order on every render
  // 1. Call all React hooks first
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // 2. Then call custom hooks
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
  
  // Close mobile sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };
    
    // Close sidebar when user taps escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobileSidebar]);
  
  // Apply body class to prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (showMobileSidebar) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showMobileSidebar]);
  
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
      <div className="flex flex-col h-screen chat-container">
        {/* Header */}
        <header className="whatsapp-header px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-1"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                aria-label="Toggle sidebar"
              >
                {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold hidden xs:block">ChatterBox</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="text-sm font-medium mr-2 hidden sm:block">
              <span className="text-muted-foreground">Signed in as:</span> <span className="text-primary font-medium">{username}</span>
            </div>
            <ConnectionStatus status={connectionStatus} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="gap-1"
            >
              {isMobile ? <LogOut size={16} /> : (
                <>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex relative">
          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <div 
              className="fixed inset-0 bg-black/30 z-20 md:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
          
          {/* Sidebar - User List */}
          <div 
            className={`${
              showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 transition-transform duration-300 ease-in-out 
            absolute md:static inset-y-0 left-0 z-30 w-3/4 max-w-[280px] md:w-64 
            whatsapp-sidebar p-4 md:block`}
          >
            <h2 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <Users size={18} />
              <span>Users</span>
            </h2>
            <UserList
              users={connectedUsers}
              currentUserId={userId || 0}
              unreadCounts={directChat.unreadCounts}
              onSelectUser={(id, username) => {
                directChat.selectUser(id, username);
                if (isMobile) setShowMobileSidebar(false);
              }}
            />
          </div>
          
          {/* Main chat area */}
          <div className="flex-1 flex flex-col overflow-hidden whatsapp-bg">
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
                <div className="whatsapp-header p-3 border-b flex items-center gap-2">
                  <Users size={18} />
                  <h2 className="font-semibold">Public Chat</h2>
                </div>
                <ScrollArea className="flex-1 p-3 sm:p-4 scrollbar-thin">
                  <div className="space-y-3 sm:space-y-4 pb-2">
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
                <div className="message-input-area safe-bottom">
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
