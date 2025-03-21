import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Search, MoreVertical, ArrowDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface UserListProps {
  users: Array<{
    id: number;
    username: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  currentUserId: number;
  unreadCounts: Record<number, number>;
  onSelectUser: (userId: number, username: string) => void;
}

export function UserList({ users, currentUserId, unreadCounts, onSelectUser }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.id !== currentUserId && 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort users: online first, then by username
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Online users first
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    
    // Sort by unread messages count (descending)
    const aUnread = unreadCounts[a.id] || 0;
    const bUnread = unreadCounts[b.id] || 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    
    // Then by username
    return a.username.localeCompare(b.username);
  });
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  // Format last seen time in WhatsApp style
  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const today = new Date();
    
    // If today, show time
    if (date.toDateString() === today.toDateString()) {
      return format(date, "h:mm a");
    }
    
    // If this week, show day
    const dayDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
      return format(date, "EEEE");
    }
    
    // Otherwise show date
    return format(date, "MM/dd/yyyy");
  };
  
  return (
    <div className="flex flex-col h-full border-r whatsapp-sidebar">
      {/* Header */}
      <div className="p-3 whatsapp-header flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials("Me")}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowDownLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="p-2 border-b whatsapp-header">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search or start new chat"
            className="pl-9 bg-muted/30 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* User List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/10">
          {sortedUsers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            sortedUsers.map(user => {
              const unreadCount = unreadCounts[user.id] || 0;
              
              return (
                <div
                  key={user.id}
                  className="hover:bg-muted/10 transition-colors cursor-pointer"
                  onClick={() => onSelectUser(user.id, user.username)}
                >
                  <div className="flex items-center p-3 gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 rounded-full w-3 h-3 bg-primary border-2 border-background"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">{user.username}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {user.lastSeen ? formatLastSeen(user.lastSeen) : ""}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground truncate">
                          {user.isOnline ? "online" : ""}
                        </span>
                        {unreadCount > 0 && (
                          <Badge className="bg-primary hover:bg-primary rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}