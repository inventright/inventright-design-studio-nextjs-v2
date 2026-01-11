import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "client" | "designer" | "manager" | "admin";
      openId: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "client" | "designer" | "manager" | "admin";
    openId: string;
  }
}
