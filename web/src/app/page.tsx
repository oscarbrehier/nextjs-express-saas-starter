import { redirect } from "next/navigation";

/** Root route — redirect to dashboard (middleware handles auth). */
export default function RootPage() {
  redirect("/dashboard");
}
