import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Login | Typing Test Skill", description: "Sign in to save your typing tests and certificates." };

import { Suspense } from "react";

export default function LoginPage() {
  return <div className="min-h-screen bg-[#080908] text-primary"><Navbar /><Suspense fallback={<div>Loading...</div>}><AuthForm mode="login" /></Suspense></div>;
}
