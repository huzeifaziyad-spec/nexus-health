import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Heart className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading NexusHealth...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/auth" replace />;
};

export default Index;
