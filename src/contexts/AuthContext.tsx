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
          console.log("AuthContext: Profile not found, creating one...");
          // Auto-create default profile for new/OAuth users
          const currentUser = await account.get();
          
          // Get name from Auth, fallback to email prefix if empty
          const rawName = currentUser.name || currentUser.email.split('@')[0] || "User";
          const nameParts = rawName.split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";

          try {
            profileRes = await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.profiles,
              userId,
              {
                firstName: firstName,
                lastName: lastName,
                dateOfBirth: new Date("1900-01-01").toISOString(),
                role: "patient"
              }
            );
            console.log("AuthContext: Profile successfully created");
          } catch (createErr: any) {
            console.error("AuthContext: Failed to create profile document:", createErr);
            // If it already exists (race condition), try to fetch it one last time
            if (createErr.code === 409) {
               profileRes = await databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.profiles,
                userId
              );
            }
          }
        } else {
          console.error("AuthContext: Error fetching document:", e);
          throw e;
        }
      }

      const currentUser = await account.get();
      const authName = currentUser.name || currentUser.email.split('@')[0] || "User";

      if (profileRes) {
        const dbName = (`${profileRes.firstName || ""} ${profileRes.lastName || ""}`).trim();
        
        // If DB name is empty or default, and we have a better name from Auth, update DB
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
          } catch (updateError) {
            console.error("AuthContext: Failed to sync name to profile:", updateError);
          }
        }

        const finalDbName = (`${profileRes.firstName || ""} ${profileRes.lastName || ""}`).trim();
        setProfile({
          ...profileRes,
          full_name: finalDbName || authName
        });
      } else {
        // Fallback if DB still missing
        setProfile({ full_name: authName });
      }

      // Determine role: Priority 1: Auth Labels, Priority 2: Database Field
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
    } catch (error) {
      console.error("AuthContext: Critical error in fetchUserData:", error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        console.log("AuthContext: Session found for", currentUser.email);
        setUser(currentUser);
        await fetchUserData(currentUser.$id, currentUser.labels);
      } catch (error: any) {
        if (error.code !== 401) {
          console.error("AuthContext: Session check failed:", error);
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
