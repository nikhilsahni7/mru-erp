"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  rollNo: z.string().min(1, { message: "Teacher ID is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleError, setRoleError] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rollNo: "",
      password: "",
    },
  });

  // Check for error parameters from middleware redirects
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages = {
        "expired": "Your session has expired. Please sign in again.",
        "unauthorized": "You do not have permission to access the teacher portal. Please use the correct portal for your role.",
        "invalid": "Your session is invalid. Please sign in again.",
        "student_access": "Student accounts cannot access the teacher portal. Please use the student portal instead."
      };

      // Set specific student error status
      if (error === "unauthorized" || error === "student_access") {
        setRoleError(true);
      }

      setLoginError(errorMessages[error as keyof typeof errorMessages] || "An error occurred. Please sign in again.");
      form.setError("root", {
        type: "manual",
        message: errorMessages[error as keyof typeof errorMessages] || "An error occurred. Please sign in again."
      });
    }
  }, [searchParams, form]);

  // Reset the error when the form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (loginError) setLoginError(null);
      if (roleError) setRoleError(false);
      if (form.formState.errors.root) {
        form.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, loginError, roleError]);

  async function onSubmit(values: LoginValues) {
    setLoginError(null);
    setRoleError(false);
    setIsSubmitting(true);

    try {
      await login.mutateAsync(values);
    } catch (error: any) {
      console.error("Login error:", error);
      // Log the full error response if available
      if (error.response) {
        console.error("Backend Response Status:", error.response.status);
        console.error("Backend Response Data:", error.response.data);
      } else {
        console.error("Error details:", error.message);
      }

      // Get the error message from the response
      const errorMessage = error?.response?.data?.message || "An unknown error occurred";
      console.log("Extracted Backend error message:", errorMessage);

      let displayError = ""; // Error message to show the user

      // Check for specific backend messages
      if (errorMessage === "Unauthorized: Only teacher accounts can login through this portal") {
        console.log("Student attempted to log in to teacher portal");
        setRoleError(true);
        // Use a specific message for the student access denied alert
        displayError = "This portal is exclusively for faculty members. Students cannot access this portal.";
        // We'll rely on the roleError state to show the detailed alert
      } else if (errorMessage === "Invalid credentials") {
        displayError = "Invalid Teacher ID or Password. Please try again.";
      } else {
        // Fallback for other errors (including network issues, server errors, etc.)
        displayError = errorMessage || "Login failed due to an unexpected error.";
      }

      // Set the error state for the form (displayed if not a roleError)
      setLoginError(displayError);
      form.setError("root", {
        type: "manual",
        message: displayError
      });

    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {roleError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-lg font-semibold">Student Access Denied</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              <strong>This login is for faculty members only.</strong> It appears you're using a student account to access the teacher portal.
            </p>
            <p className="font-medium">Students must use the dedicated Student Portal instead:</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs">
                <Link href="https://student.manavrachna.edu.in">
                  Go to Student Portal
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild className="text-xs">
                <Link href="https://www.manavrachna.edu.in">
                  MRU Homepage
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              If you are a faculty member and see this message by mistake, please contact the IT department.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Show form-level error message */}
          {form.formState.errors.root && !roleError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="rollNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Teacher ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your teacher ID"
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
            disabled={isSubmitting || roleError}
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
    </>
  );
}
