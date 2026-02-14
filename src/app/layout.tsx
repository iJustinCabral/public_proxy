import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "democraic — AI-Powered Direct Democracy",
  description:
    "Your AI agent reads every bill, understands your values, and votes on your behalf. True direct democracy, powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <div className="container">
            <a href="/" className="logo">
              democraic
            </a>
            <div className="links">
              <a href="/bills">Bills</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/representatives">The People&apos;s Vote</a>
              <a href="/onboarding">Get Started</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
