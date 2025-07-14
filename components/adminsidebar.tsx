// components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/admin" },
  { label: "Company View", href: "/company" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
      <div className="p-6 text-xl font-bold text-blue-600 border-b">
        Placify Admin
      </div>
      <nav className="flex flex-col p-4 gap-2">
        {links.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`block px-4 py-2 rounded text-gray-700 hover:bg-blue-100 transition ${
              pathname === href ? "bg-blue-100 text-blue-700 font-semibold" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
