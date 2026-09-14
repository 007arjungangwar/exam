import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "University Coding Examination Platform",
  description: "Secure coding examination platform for supervised university labs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
