import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Heart, ArrowLeft, Chrome } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"initial" | "otp">("initial");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("patient");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await account.createEmailToken({
        userId: userId || ID.unique(),
        email: email
      });
      setUserId(token.userId);
      setStep("otp");
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure any existing session is cleared first
      try {
        await account.deleteSession({ sessionId: 'current' });
      } catch (e) {
        // Ignore error if no session was active
      }

      await account.createSession({
        userId: userId,
        secret: otp
      });

      // SYNC NAME WITH AUTH SERVICE
      if (!isLogin && fullName) {
        try {
          await account.updateName(fullName);
        } catch (nameError) {
          console.error("Failed to update name in Auth service:", nameError);
        }
      }

      if (!isLogin) {
        // Create profile document with role for new users
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "";

        const permissions = [
          `read("user:${userId}")`,
          `update("user:${userId}")`,
          `delete("user:${userId}")`
        ];

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.profiles,
          userId,
          {
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: new Date("1900-01-01").toISOString(), // Required field
            role: role, // Save role directly in profile
          },
          permissions
        );
        toast.success("Account created successfully!");
      } else {
        toast.success("Welcome back!");
      }

      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await account.createOAuth2Session(
        'google',
        `${window.location.origin}/dashboard`,
        `${window.location.origin}/auth`
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">NexusHealth</span>
          </div>
          <p className="text-muted-foreground">Hospital Management System</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2">
              {step === "otp" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setStep("initial")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-2xl">
                {step === "otp" ? "Verify Email" : isLogin ? "Welcome back" : "Create account"}
              </CardTitle>
            </div>
            <CardDescription>
              {step === "otp"
                ? `Enter the 6-digit code sent to ${email}`
                : isLogin ? "Sign in to access your dashboard" : "Register to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "initial" ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "Send Verification Code" : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="h-4 w-4" />
                  Google
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2 flex flex-col items-center">
                  <Label htmlFor="otp" className="sr-only">Verification Code</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="text-sm text-primary hover:underline"
                  >
                    Didn't receive a code? Resend
                  </button>
                </div>
              </form>
            )}

            {step === "initial" && (
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
