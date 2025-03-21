import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

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
  // Sort users: online first, then by username
  const sortedUsers = [...users].sort((a, b) => {
    // Don't include current user
    if (a.id === currentUserId) return 1;
    if (b.id === currentUserId) return -1;
    
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
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };
  
  // Format last seen time
  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Never";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  return (
    <div className="border rounded-lg overflow-hidden h-full">
      <div className="p-3 bg-muted/50 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <User size={18} /> Users
        </h2>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {sortedUsers.map(user => {
            // Skip current user
            if (user.id === currentUserId) return null;
            
            const unreadCount = unreadCounts[user.id] || 0;
            
            return (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start p-2 h-auto mb-1"
                onClick={() => onSelectUser(user.id, user.username)}
              >
                <div className="flex items-center w-full">
                  <div className="relative mr-2">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 rounded-full w-3 h-3 bg-green-500 border-2 border-background"></span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.isOnline ? "Online" : `Last seen ${formatLastSeen(user.lastSeen)}`}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Badge className="ml-auto" variant="destructive">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}