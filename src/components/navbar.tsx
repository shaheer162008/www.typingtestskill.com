"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { navLinks } from "@/lib/constants";
import { useAuth } from "@/components/auth-provider";

function ProfileControl() {
  const { user, loading, logout, isAdmin } = useAuth();

  if (!loading && !user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-[15px] font-medium text-primary/60 transition hover:text-primary">
          Sign in
        </Link>
        <Link href="/signup" className="rounded-lg border border-primary/30 px-3 py-2 text-[15px] font-medium text-primary transition hover:border-primary/60 hover:text-primary">
          Sign up
        </Link>
      </div>
    );
  }

  const displayName = user?.displayName ?? user?.email ?? "Account";

  return (
    <div className="group relative">
      <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/15 text-primary/70 transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Open dashboard">
        {user?.photoURL ? <Image src={user.photoURL} alt="" width={40} height={40} className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
      </Link>
      {!loading && (
        <div className="pointer-events-none absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 translate-y-1 border border-primary/15 bg-[#111] p-4 opacity-0 shadow-2xl transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="mt-1 truncate text-xs text-primary/45">Typing Test Skill account</p>
          <div className="mt-4 space-y-2 border-b border-primary/10 pb-4">
            <Link href="/dashboard" className="flex text-xs text-primary underline decoration-primary/25 underline-offset-4 hover:text-primary/80">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex text-xs text-primary underline decoration-primary/25 underline-offset-4 hover:text-primary/80">
                Admin Dashboard
              </Link>
            )}
          </div>
          <button type="button" onClick={() => void logout()} className="mt-4 flex items-center gap-2 text-xs text-primary/60 hover:text-primary">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") closeMenu();
  };

  const handleLinkClick = () => closeMenu();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 text-primary backdrop-blur-md transition-all duration-300" role="navigation" aria-label="Main navigation">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3 rounded-lg border border-transparent py-1 pr-3 pl-1 transition-all hover:border-primary/20 hover:bg-white/[0.03]" aria-label="Typing Test Skill Home">
          <Image src="/icon.png" alt="" width={45} height={45} className="h-auto w-[45px] transition-transform group-hover:scale-105" aria-hidden="true" />
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-bold tracking-tight text-primary transition-colors group-hover:text-primary/90">Typing Test Skill</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 transition-colors group-hover:text-primary/80">Home</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 w-max" role="menubar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={`whitespace-nowrap text-[15px] transition-colors ${isActive ? "font-bold text-primary" : "font-medium text-primary/60 hover:text-primary"
                  }`}
                onClick={handleLinkClick}
              >
                {link.name}
              </Link>
            );
          })}
          {!loading && user && (
            <Link
              href="/dashboard"
              role="menuitem"
              className={`whitespace-nowrap text-[15px] transition-colors ${pathname === "/dashboard" ? "font-bold text-primary" : "font-medium text-primary/60 hover:text-primary"
                }`}
              onClick={handleLinkClick}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden items-center lg:flex">
          <ProfileControl />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ProfileControl />
          <button
            onClick={toggleMenu}
            onKeyDown={handleKeyDown}
            className="rounded-lg p-2 text-primary/70 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute left-0 top-full flex w-full flex-col gap-5 border-b border-white/10 bg-black/95 px-6 py-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 lg:hidden"
          role="menu"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={handleLinkClick}
                className={`text-[15px] transition-colors ${isActive ? "font-bold text-primary" : "font-medium text-primary/60 hover:text-primary"
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
          {!loading && user && (
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={handleLinkClick}
              className={`text-[15px] transition-colors ${pathname === "/dashboard" ? "font-bold text-primary" : "font-medium text-primary/60 hover:text-primary"
                }`}
            >
              Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}