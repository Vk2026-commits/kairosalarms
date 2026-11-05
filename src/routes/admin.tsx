import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kairos Admin | Leads" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: AdminDashboard,
});
