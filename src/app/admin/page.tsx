import type { Metadata } from "next";
import AdminDashboard from "@/components/admin-dashboard";

export const metadata: Metadata = { 
  title: "Admin Console | Typing Test Skill", 
  description: "Manage Typing Test Skill content, users, and messages." 
};

export default function AdminPage() {
  return <AdminDashboard />;
}
