import { redirect } from "next/navigation";

export default function SyncRedirectPage() {
  redirect("/admin/import-old-sheets");
}
