"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
    { href: "/student", label: "Student" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-blue-600"
        >
          Placify
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium ${
                pathname === item.href ? "text-blue-600" : "text-gray-600"
              } hover:text-blue-600`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
