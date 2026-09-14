import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/admin-data";

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/sign-in");
  }

  const snapshot = await getDashboardSnapshot();

  return <AdminDashboard snapshot={snapshot} admin={session} />;
}
