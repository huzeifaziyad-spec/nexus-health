import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { account, databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Models } from "appwrite";
import { Query } from "appwrite";

type AppRole = "admin" | "doctor" | "patient";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  role: AppRole | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, labels: string[] = []) => {
    try {
      let profileRes = null;

      try {
        profileRes = await databases.getDocument({
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.profiles,
          documentId: userId
        });
      } catch (e: any) {
        if (e.code === 404) {
          // Auto-create default profile for new/OAuth users
          const currentUser = await account.get();
          const nameParts = (currentUser.name || "").split(" ");
          profileRes = await databases.createDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: userId,
            data: {
              firstName: nameParts[0] || "User",
              lastName: nameParts.slice(1).join(" ") || "",
              dateOfBirth: new Date("1900-01-01").toISOString(), // Full ISO format for Datetime type
              role: "patient" // Default role
            }
          });
        } else {
          throw e;
        }
      }

      const currentUser = await account.get();
      const authName = currentUser.name || "";

      if (profileRes) {
        const dbName = (`${profileRes.firstName || ""} ${profileRes.lastName || ""}`).trim();
        setProfile({
          ...profileRes,
          full_name: dbName || authName || "User"
        });
      } else {
        setProfile({
          full_name: authName || "User"
        });
      }

      // Determine role: Priority 1: Auth Labels, Priority 2: Database Field
      let finalRole: AppRole = "patient";

      if (labels.includes("admin")) {
        finalRole = "admin";
      } else if (labels.includes("doctor")) {
        finalRole = "doctor";
      } else if (profileRes?.role) {
        // Support roles stored in the database profiles collection
        const dbRole = profileRes.role.toLowerCase();
        if (dbRole === "admin" || dbRole === "doctor" || dbRole === "patient") {
          finalRole = dbRole as AppRole;
        }
      }

      console.log("Calculated Role:", finalRole, "(from labels:", labels, "db:", profileRes?.role, ")");
      setRole(finalRole);
    } catch (error) {
      console.error("Error fetching user data from Appwrite:", error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        await fetchUserData(currentUser.$id, currentUser.labels);
      } catch (error) {
        setUser(null);
        setRole(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = async () => {
    try {
      await account.deleteSession({
        sessionId: 'current'
      });
      setUser(null);
      setRole(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out from Appwrite:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
