import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
  onSuccess?: () => void;
  onPhoneAuth?: () => void;
}

export function LoginForm({ onToggleForm, onForgotPassword, onSuccess, onPhoneAuth }: LoginFormProps) {
  const auth = useAuth();
  if (!auth) throw new Error("Auth context is not available");
  const { login } = auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="bg-background border-input"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="flex flex-col space-y-2 text-center text-sm">
          <Button variant="link" onClick={onForgotPassword} type="button" className="text-primary">
            Forgot password?
          </Button>
          {onPhoneAuth && (
            <Button variant="link" onClick={onPhoneAuth} type="button" className="text-primary">
              Sign in with phone
            </Button>
          )}
          <Button variant="link" onClick={onToggleForm} type="button" className="text-primary">
            Don't have an account? Sign up
          </Button>
        </div>
      </CardContent>
    </div>
  );
} 