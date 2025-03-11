import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { Auth, RecaptchaVerifier } from "firebase/auth";
import { FormEvent, useState } from "react";

interface PhoneAuthProps {
  onBack: () => void;
  onSuccess?: () => void;
}

interface AuthContextType {
  verifyPhoneNumber: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
  confirmPhoneCode: (verificationId: string, code: string) => Promise<void>;
  auth: Auth;
}

export function PhoneAuth({ onBack, onSuccess }: PhoneAuthProps) {
  const { verifyPhoneNumber, confirmPhoneCode, auth } = useAuth() as AuthContextType;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const handleSendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      
      const verificationId = await verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      setVerificationId(verificationId);
      setStep('code');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await confirmPhoneCode(verificationId, verificationCode);
      if (onSuccess) onSuccess();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Phone Authentication</CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : 'Enter the verification code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                type="tel" 
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                required
                placeholder="+1 (555) 555-5555"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div id="recaptcha-container" />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input 
                id="code"
                type="text" 
                value={verificationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
                required
                placeholder="123456"
                maxLength={6}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {step === 'code' && (
          <Button 
            variant="outline" 
            onClick={() => setStep('phone')}
            className="w-full"
            type="button"
          >
            Change Phone Number
          </Button>
        )}
        <Button 
          variant="link" 
          onClick={onBack}
          className="w-full"
          type="button"
        >
          Back to Sign In
        </Button>
      </CardFooter>
    </div>
  );
} 