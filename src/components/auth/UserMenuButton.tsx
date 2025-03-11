import { useState } from 'react';
import { useAuth, AuthContextType } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, LogOut } from 'lucide-react';
import { AuthForm } from './AuthForm';

export function UserMenuButton() {
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

  return (
    <>
      {currentUser ? (
        <div className="flex items-center">
          <div className="mr-2 text-sm">
            {currentUser.displayName || currentUser.email}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 rounded-full"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1"
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