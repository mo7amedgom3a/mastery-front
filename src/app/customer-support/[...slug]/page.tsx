import type { Route } from "next";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect("/students/support" as Route);
  }
  // Maps /customer-support/tickets/new -> /students/support/new
  // Maps /customer-support/tickets/[id] -> /students/support/[id]
  const clean = slug.filter((s) => s !== "tickets");
  if (clean.length === 0) {
    redirect("/students/support" as Route);
  }
  redirect(`/students/support/${clean.join("/")}` as Route);
}
