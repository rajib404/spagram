import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      therapistProfileId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    therapistProfileId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    therapistProfileId?: string | null;
  }
}
