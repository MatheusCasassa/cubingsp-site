import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-6xl items-center justify-center px-6 py-16">
      <AuthForm />
    </main>
  );
}
