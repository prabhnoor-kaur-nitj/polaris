// Password authentication provider. OTP and guest flows are retired:
// the master provisions crew credentials, crew sign in with email + password.

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      validatePasswordRequirements: (password: string) => {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
      },
    }),
  ],
});
