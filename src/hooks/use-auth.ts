import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // isLoading from useConvexAuth already covers the session-resolution window;
  // currentUser returns undefined while loading and null when signed out.
  return {
    isLoading,
    isAuthenticated,
    user: user ?? null,
    isMaster: user?.role === "master",
    signIn,
    signOut,
  };
}
