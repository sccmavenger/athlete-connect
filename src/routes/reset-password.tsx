import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Recruiting Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          {mode === "request" ? "Reset your password" : "Set a new password"}
        </h1>
        {mode === "request" ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="rp-email">Email</Label>
              <Input id="rp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="rp-pass">New password</Label>
              <Input id="rp-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
