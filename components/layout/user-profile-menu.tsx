"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ChevronDown, Loader2, Lock, PencilLine } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface ProfileRow {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

const imageUrlRegex = /^https?:\/\/\S+$/i;

function initialsFromName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "U";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function UserProfileMenu() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileNameInput, setProfileNameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const metadataAvatar = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";

      setAuthUserId(user.id);
      setEmail(user.email ?? "");
      setFullName(metadataName);
      setAvatarUrl(metadataAvatar);
      setProfileNameInput(metadataName);
      setAvatarInput(metadataAvatar);

      const { data: row } = await supabase
        .from("users")
        .select("full_name, avatar_url, email")
        .eq("auth_user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (!mounted) {
        return;
      }

      if (row) {
        const resolvedName = row.full_name ?? metadataName;
        const resolvedAvatar = row.avatar_url ?? metadataAvatar;
        const resolvedEmail = row.email ?? user.email ?? "";

        setFullName(resolvedName);
        setAvatarUrl(resolvedAvatar);
        setEmail(resolvedEmail);
        setProfileNameInput(resolvedName);
        setAvatarInput(resolvedAvatar);
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, []);

  const displayName = useMemo(() => {
    if (fullName.trim()) {
      return fullName;
    }

    if (email.includes("@")) {
      return email.split("@")[0] ?? "User";
    }

    return "User";
  }, [email, fullName]);

  const initials = useMemo(() => initialsFromName(displayName), [displayName]);

  async function persistProfile(nextName: string, nextAvatar: string) {
    if (!authUserId) {
      return false;
    }

    setSaving(true);
    const cleanName = nextName.trim();
    const cleanAvatar = nextAvatar.trim();

    try {
      const authUpdate = await supabase.auth.updateUser({
        data: {
          full_name: cleanName || null,
          avatar_url: cleanAvatar || null
        }
      });

      if (authUpdate.error) {
        toast({
          title: "Update failed",
          description: authUpdate.error.message,
          kind: "error"
        });
        return false;
      }

      const rowPayload = {
        auth_user_id: authUserId,
        email: email || authUpdate.data.user?.email || "",
        full_name: cleanName || null,
        avatar_url: cleanAvatar || null
      };

      // Keep UI in sync immediately once auth metadata is updated.
      setFullName(cleanName);
      setAvatarUrl(cleanAvatar);

      // Best-effort sync to public.users with safe fallbacks.
      const updateByAuth = await supabase
        .from("users")
        .update({
          email: rowPayload.email,
          full_name: rowPayload.full_name,
          avatar_url: rowPayload.avatar_url
        })
        .eq("auth_user_id", authUserId)
        .select("id")
        .maybeSingle();

      if (!updateByAuth.error && updateByAuth.data) {
        return true;
      }

      if (rowPayload.email) {
        const updateByEmail = await supabase
          .from("users")
          .update({
            auth_user_id: authUserId,
            full_name: rowPayload.full_name,
            avatar_url: rowPayload.avatar_url
          })
          .eq("email", rowPayload.email)
          .select("id")
          .maybeSingle();

        if (!updateByEmail.error && updateByEmail.data) {
          return true;
        }
      }

      const insertResult = await supabase.from("users").insert(rowPayload).select("id").maybeSingle();
      if (insertResult.error) {
        toast({
          title: "Profile table sync warning",
          description: "Profile updated in auth. Public users table could not be synced yet.",
          kind: "info"
        });
      }

      return true;
    } finally {
      setSaving(false);
    }
  }

  async function handleEditProfile(event: FormEvent) {
    event.preventDefault();
    const ok = await persistProfile(profileNameInput, avatarUrl);
    if (!ok) {
      return;
    }

    toast({
      title: "Profile updated",
      description: "Your name has been updated.",
      kind: "success"
    });
    setEditOpen(false);
  }

  async function handleChangeImage(event: FormEvent) {
    event.preventDefault();
    const hasUrl = avatarInput.trim().length > 0;
    const hasFile = Boolean(avatarFile);

    if (hasUrl && !imageUrlRegex.test(avatarInput.trim())) {
      toast({
        title: "Invalid image URL",
        description: "Use a valid http/https image URL.",
        kind: "error"
      });
      return;
    }

    if (!hasUrl && !hasFile) {
      toast({
        title: "No image selected",
        description: "Choose a file or paste an image URL.",
        kind: "error"
      });
      return;
    }

    let resolvedAvatarUrl = avatarInput.trim();
    if (hasFile && authUserId) {
      setSaving(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          toast({
            title: "Upload failed",
            description: "Session expired. Please log in again.",
            kind: "error"
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", avatarFile!);
        formData.append("userId", authUserId);
        formData.append("accessToken", session.access_token);

        const response = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData
        });

        const body = await response.json();
        if (!response.ok) {
          toast({
            title: "Upload failed",
            description: body.error ?? "Could not upload avatar.",
            kind: "error"
          });
          return;
        }

        resolvedAvatarUrl = body.publicUrl ?? "";
      } finally {
        setSaving(false);
      }
    }

    const ok = await persistProfile(fullName, resolvedAvatarUrl);
    if (!ok) {
      return;
    }

    toast({
      title: "Profile image updated",
      description: "Your avatar has been updated.",
      kind: "success"
    });
    setAvatarFile(null);
    setImageOpen(false);
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        kind: "error"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password in both fields.",
        kind: "error"
      });
      return;
    }

    setSaving(true);
    try {
      const result = await supabase.auth.updateUser({ password: newPassword });
      if (result.error) {
        toast({
          title: "Password change failed",
          description: result.error.message,
          kind: "error"
        });
        return;
      }

      toast({
        title: "Password changed",
        description: "Your password has been updated.",
        kind: "success"
      });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-[#0f1a2a] p-3 text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-[#0f1a2a] px-3 py-2 transition-colors hover:bg-slate-800/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              {initials}
            </span>
          )}
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-medium text-slate-100">{displayName}</span>
            <span className="block truncate text-[11px] text-slate-400">{email}</span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {dropdownOpen ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-lg border border-border bg-[#0b1322] p-1 shadow-xl md:bottom-14 md:top-auto md:mt-0">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/60"
            onClick={() => {
              setDropdownOpen(false);
              setProfileNameInput(fullName);
              setEditOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit Profile
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/60"
            onClick={() => {
              setDropdownOpen(false);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordOpen(true);
            }}
          >
            <Lock className="h-4 w-4" />
            Change Password
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/60"
            onClick={() => {
              setDropdownOpen(false);
              setAvatarInput(avatarUrl);
              setAvatarFile(null);
              setImageOpen(true);
            }}
          >
            <Camera className="h-4 w-4" />
            Change Profile Image
          </button>
        </div>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your name for dashboard display.</DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-3" onSubmit={handleEditProfile}>
            <Input
              value={profileNameInput}
              onChange={(event) => setProfileNameInput(event.target.value)}
              placeholder="Full name"
              required
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" />Save</span>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Choose a new password for your account.</DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-3" onSubmit={handleChangePassword}>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              minLength={6}
              required
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              minLength={6}
              required
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Profile Image</DialogTitle>
            <DialogDescription>Paste an image URL for your avatar.</DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-3" onSubmit={handleChangeImage}>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-slate-400">Upload an image file or provide a direct image URL.</p>
            <Input
              value={avatarInput}
              onChange={(event) => setAvatarInput(event.target.value)}
              placeholder="https://example.com/avatar.png"
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Update Image"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
