import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/inter";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: { default: "IntervU: practise any interview out loud", template: "%s · IntervU" },
  description:
    "Spoken mock interviews for government, campus and private-sector roles, with follow-up questions and feedback based on what you actually said.",
};

export const viewport: Viewport = {
  themeColor: "#f6f7fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
