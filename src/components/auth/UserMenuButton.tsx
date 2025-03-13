import { useState } from 'react';
import { useAuth, AuthContextType } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, LogOut, Mail } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserMenuButtonProps {
  className?: string;
}

export function UserMenuButton({ className }: UserMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const { currentUser, logout } = useAuth() as AuthContextType;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginSuccess = () => {
    setOpen(false);
  };

  // Get user initials for avatar fallback
  const getUserInitials = (): string => {
    if (!currentUser) return '';
    
    if (currentUser.displayName) {
      // Extract initials from display name
      return currentUser.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // If no display name, use first character of email
    if (currentUser.email) {
      return currentUser.email[0].toUpperCase();
    }
    
    return 'U'; // Default fallback
  };

  return (
    <>
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={`rounded-full bg-white border-gray-500 hover:bg-gray-500 hover:text-white text-gray-500 ${className} flex items-center gap-2`}
              size="sm"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage 
                  src={currentUser.photoURL || undefined} 
                  alt={currentUser.displayName || 'User avatar'} 
                />
                <AvatarFallback className="bg-gray-600 text-white text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span>My Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="truncate">{currentUser.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={`rounded-full bg-white border-gray-500 hover:bg-gray-500 hover:text-white text-gray-500 ${className} flex items-center gap-2`}
        >
          <User className="h-4 w-4" />
          <span>Login</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <AuthForm onSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
} 