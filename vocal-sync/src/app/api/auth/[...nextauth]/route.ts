import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            id: "token-login",
            name: "Token",
            credentials: {
                token: { label: "Token", type: "text" }
            },
            async authorize(credentials) {
                try {
                    const response = await fetch("http://localhost:8000/auth/me", {
                        headers: {
                            "Authorization": `Bearer ${credentials?.token}`
                        }
                    });
                    if (response.ok) {
                        const user = await response.json();
                        return { id: user.username, name: user.username, email: user.username, role: "ADMIN" };
                    }
                } catch (error) {
                    console.error("Token verification failed:", error);
                }
                return null;
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const db = getDb();
                const user = db.users.find((u: any) => u.email === credentials?.username && u.password === credentials?.password);

                if (user) {
                    return { id: user.id, name: user.name, email: user.email, role: user.role };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
