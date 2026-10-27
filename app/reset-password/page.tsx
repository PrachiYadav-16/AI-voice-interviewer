import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return <NewPasswordForm />;
}
