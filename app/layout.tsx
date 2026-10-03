import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "PayPal AI Expense Agent",
  description:
    "AI-powered expense management and financial insights using PayPal — built for the PayPal AI Hackathon",
  keywords: ["paypal", "ai", "expense", "finance", "hackathon"],
  openGraph: {
    title: "PayPal AI Expense Agent",
    description: "Intelligent expense tracking and insights powered by AI + PayPal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
                  <span className="text-xs text-slate-500 font-medium">
                    PayPal Sandbox Connected
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  🤖 AI Agent Active
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-paypal-blue to-paypal-lightblue rounded-full flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <span className="text-sm font-medium text-slate-700">Sandbox User</span>
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
