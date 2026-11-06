import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/studio");
  return (
    <div className="studio-login">
      <span className="eyebrow">Private</span>
      <h1 className="title-2">Studio sign-in</h1>
      <p className="muted">For the studio owner only.</p>
      <LoginForm />
    </div>
  );
}
