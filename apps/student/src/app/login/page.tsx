"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  rollNo: z.string().min(1, { message: "Roll number is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rollNo: "",
      password: "",
    },
  });

  // Reset the error when the form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (loginError) setLoginError(null);
      if (form.formState.errors.root) {
        form.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, loginError]);

  async function onSubmit(values: LoginValues) {
    setLoginError(null);
    setIsSubmitting(true);

    try {
      await login.mutateAsync(values);
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error?.response?.data?.message || "Invalid credentials";
      setLoginError(errorMessage);
      form.setError("root", {
        type: "manual",
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
              Empowering students with knowledge, skills, and values to excel in a global environment
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
              <h1 className="text-2xl font-bold">Student Portal</h1>
            </div>
            <p className="text-muted-foreground text-sm">Access your academic resources and information</p>
          </div>

          <Card className="border-none shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-xl font-semibold">Sign in to your account</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Show form-level error message */}
                  {form.formState.errors.root && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="rollNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Roll Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter your roll number"
                              className="pl-10 h-11 rounded-lg"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <Link href="#" className="text-xs text-primary hover:underline font-medium">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 h-11 rounded-lg pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-medium mt-4 rounded-lg shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </Form>
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
