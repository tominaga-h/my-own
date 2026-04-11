import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_LOGIN;
      if (!allowed) return false;
      return (profile as { login?: string })?.login === allowed;
    },
    async session({ session }) {
      if (session.user) {
        (session.user as { id?: string }).id = process.env.APP_USER_ID!;
      }
      return session;
    },
  },
};

export async function getAuthUser(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    throw new Error("Unauthorized");
  }
  return (session.user as { id: string }).id;
}
