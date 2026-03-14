"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "signup";

interface AuthModalProps {
  triggerLabel: string;
  triggerClassName?: string;
  defaultMode?: Mode;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export function AuthModal({ triggerLabel, triggerClassName, defaultMode = "login" }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        kind: "error"
      });
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters and include letters, numbers, and a special character.",
        kind: "error"
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields are identical.",
        kind: "error"
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (response.error) {
        toast({ title: isLogin ? "Login failed" : "Sign up failed", description: response.error.message, kind: "error" });
        return;
      }

      toast({
        title: isLogin ? "Logged in successfully" : "Account created",
        description: isLogin ? "Redirecting to dashboard..." : "You can now access the dashboard.",
        kind: "success"
      });

      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLogin ? "Login" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {isLogin ? "Sign in to access your SmartFactory dashboard." : "Create your SmartFactory account."}
          </DialogDescription>
        </DialogHeader>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
          />
          {!isLogin ? (
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          ) : null}
          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>

        <p className="mt-3 text-xs text-slate-400">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => setMode(isLogin ? "signup" : "login")}
          >
            {isLogin ? "Switch to sign up" : "Switch to login"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
