"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface LoginLayoutProps {
  children: ReactNode;
}

export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="flex min-h-screen overflow-hidden">
      <div className="absolute right-4 top-4 z-30">
        <ThemeToggle />
      </div>

      {/* Left section with image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Color overlay at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/30 to-transparent z-10" />

        {/* Primary image */}
        <Image
          src="https://manavrachna.edu.in/assets/images/college-mru.webp"
          alt="Manav Rachna University"
          fill
          className="object-cover h-full w-full"
          quality={100}
          priority
        />

        {/* Blue overlay for brand color consistency */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        {/* Welcome text with underline */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-10 text-white">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome to Manav Rachna University</h2>
              <div className="w-20 h-1 bg-white/70 mt-4 rounded-full"></div>
            </div>
            <p className="text-white/90 text-lg max-w-md leading-relaxed">
              Faculty Portal - Access your teaching resources and manage student information
            </p>
            <div className="flex items-center space-x-3 text-sm text-white/80">
              <span>• Excellence</span>
              <span>• Innovation</span>
              <span>• Integrity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right section with login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        {/* Mobile logo - only visible on small screens */}
        <div className="lg:hidden absolute top-10 left-10 z-10 flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">MR</span>
          </div>
          <div className="font-semibold">Manav Rachna</div>
        </div>

        <div className="w-full max-w-md mt-16 lg:mt-0">
          <div className="mb-10 flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Image
                  src="/logo.svg"
                  alt="MRU ERP Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
              </div>
              <h1 className="text-2xl font-bold">Teacher Portal</h1>
            </div>
            <p className="text-muted-foreground text-sm">Access your teaching resources and manage classes</p>
          </div>

          <Card className="border-none shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-xl font-semibold">Sign in to your account</CardTitle>
              <CardDescription>Enter your faculty credentials to continue</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {children}
            </CardContent>
          </Card>

          <div className="mt-10 text-center">
            <div className="text-sm text-muted-foreground">
              Need technical support? <Link href="#" className="text-primary hover:underline font-medium">Contact IT help desk</Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Manav Rachna University. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
