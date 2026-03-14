"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function SessionTimeoutGuard() {
  const router = useRouter();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOutRef = useRef(false);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (signingOutRef.current) {
      return;
    }

    signingOutRef.current = true;
    await supabase.auth.signOut();
    router.replace("/");
  }, [router]);

  const scheduleIdleTimeout = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      void signOut();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer, signOut]);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => {
      scheduleIdleTimeout();
    };

    for (const eventName of events) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onActivity();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    scheduleIdleTimeout();

    return () => {
      clearIdleTimer();
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [clearIdleTimer, scheduleIdleTimeout]);
  return null;
}
