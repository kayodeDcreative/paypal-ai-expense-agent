"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Lightbulb } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/insights", label: "Insights", icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col bg-paypal-darkblue text-white flex-shrink-0"
      style={{ width: 220 }}
    >
      {/* Logo / App name */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          {/* PayPal-style P logo */}
          <div className="w-8 h-8 rounded-full bg-paypal-gold flex items-center justify-center flex-shrink-0">
            <span className="text-paypal-darkblue font-black text-sm leading-none">P</span>
          </div>
          <span className="font-bold text-base leading-tight">
            PayPal AI
          </span>
        </div>
        <p className="text-xs text-blue-200/70 pl-10 leading-tight">Expense Agent</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${
                  active
                    ? "bg-paypal-blue text-white shadow-sm"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon size={18} className={active ? "text-white" : "text-blue-200"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom badge */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-blue-200/80 leading-snug font-medium">
            Built for
          </p>
          <p className="text-[11px] text-paypal-gold font-semibold leading-snug">
            PayPal Hackathon
          </p>
          <p className="text-[10px] text-blue-200/80 leading-snug">2026</p>
        </div>
      </div>
    </aside>
  );
}
