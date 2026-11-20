import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { gateEnabled } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Read the env at request time so turning the password on or off never needs a code change.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (!gateEnabled()) redirect("/");
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
