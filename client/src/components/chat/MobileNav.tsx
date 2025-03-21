import { useState } from "react";
import { Users, MessageSquare, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserList } from "@/components/chat/UserList";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
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

export function MobileNav({ 
  users, 
  currentUserId, 
  unreadCounts, 
  onSelectUser 
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  
  const handleSelectUser = (userId: number, username: string) => {
    onSelectUser(userId, username);
    setOpen(false);
  };
  
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu size={22} />
            {totalUnreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-background text-xs rounded-full flex items-center justify-center">
                {totalUnreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 whatsapp-header">
              <h2 className="font-semibold text-lg">Contacts</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="flex flex-col flex-1">
              <UserList
                users={users}
                currentUserId={currentUserId}
                unreadCounts={unreadCounts}
                onSelectUser={handleSelectUser}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}