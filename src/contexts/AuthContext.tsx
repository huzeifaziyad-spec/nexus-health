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
      console.log("AuthContext: Fetching data for user", userId);
      let profileRes = null;

      try {
        profileRes = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.profiles,
          userId
        );
        console.log("AuthContext: Profile found in DB");
      } catch (e: any) {
        if (e.code === 404) {
          console.log("AuthContext: Profile not found, attempting creation...");
          const currentUser = await account.get();
          
          const rawName = currentUser.name || currentUser.email.split('@')[0] || "User";
          const nameParts = rawName.split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Explicit permissions for the user to manage their own document
          const permissions = [
            `read("user:${userId}")`,
            `update("user:${userId}")`,
            `delete("user:${userId}")`
          ];

          try {
            profileRes = await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.profiles,
              userId,
              {
                firstName,
                lastName,
                dateOfBirth: new Date("1900-01-01").toISOString(),
                role: "patient"
              },
              permissions
            );
            console.log("AuthContext: Profile successfully created with permissions");
          } catch (createErr: any) {
            console.error("AuthContext: createDocument FAILED:", createErr.message, createErr);
            // If it already exists (race condition), try to fetch it
            if (createErr.code === 409) {
               profileRes = await databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.profiles,
                userId
              );
            }
          }
        } else {
          console.error("AuthContext: getDocument FAILED:", e.message);
          throw e;
        }
      }

      const currentUser = await account.get();
      const authName = currentUser.name || currentUser.email.split('@')[0] || "User";

      if (profileRes) {
        const dbName = (`${profileRes.firstName || ""} ${profileRes.lastName || ""}`).trim();
        
        if ((!dbName || dbName === "User") && authName && authName !== "User") {
          const nameParts = authName.split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          try {
            await databases.updateDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.profiles,
              userId,
              { firstName, lastName }
            );
            profileRes.firstName = firstName;
            profileRes.lastName = lastName;
            console.log("AuthContext: Profile name synced from Auth");
          } catch (updateError) {
            console.error("AuthContext: updateDocument FAILED:", updateError);
          }
        }

        const finalDbName = (`${profileRes.firstName || ""} ${profileRes.lastName || ""}`).trim();
        setProfile({
          ...profileRes,
          full_name: finalDbName || authName
        });
      } else {
        console.warn("AuthContext: No profile document available, using Auth fallback");
        setProfile({ full_name: authName });
      }

      let finalRole: AppRole = "patient";
      if (labels.includes("admin")) {
        finalRole = "admin";
      } else if (labels.includes("doctor")) {
        finalRole = "doctor";
      } else if (profileRes?.role) {
        const dbRole = profileRes.role.toLowerCase();
        if (dbRole === "admin" || dbRole === "doctor" || dbRole === "patient") {
          finalRole = dbRole as AppRole;
        }
      }
      setRole(finalRole);
      console.log("AuthContext: Auth initialization complete. Role:", finalRole);
    } catch (error: any) {
      console.error("AuthContext: CRITICAL ERROR in fetchUserData:", error.message);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        console.log("AuthContext: Session verified for", currentUser.email);
        setUser(currentUser);
        await fetchUserData(currentUser.$id, currentUser.labels);
      } catch (error: any) {
        if (error.code !== 401) {
          console.error("AuthContext: Session verification FAILED:", error.message);
        }
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
      await account.deleteSession('current');
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
