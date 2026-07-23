import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({
  role: z.enum(["athlete", "coach"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Recruiting Hub" },
      { name: "description", content: "Sign in or create your Recruiting Hub account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role: roleParam } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"athlete" | "coach">(roleParam ?? "athlete");

  // Sign in state
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // Sign up state
  const [suFullName, setSuFullName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suCollege, setSuCollege] = useState("");
  const [suTitle, setSuTitle] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleGoogle() {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      if (res.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: siEmail.trim(),
        password: siPass,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: suEmail.trim(),
        password: suPass,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role_intent: role,
            full_name: suFullName,
            display_name: suFullName,
            college: suCollege || undefined,
            title: suTitle || undefined,
          },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (role === "coach") {
        toast.success("Account created. Your coach access is pending approval.");
      } else {
        toast.success("Account created.");
      }
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold">Welcome</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Athletes get seen. Coaches get scouting.
          </p>
        </div>


        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="mt-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("athlete")}
                  className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
                    role === "athlete"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  I'm an athlete
                </button>
                <button
                  type="button"
                  onClick={() => setRole("coach")}
                  className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
                    role === "coach"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  I'm a coach
                </button>
              </div>

              <div>
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" value={suFullName} onChange={(e) => setSuFullName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required maxLength={255} />
              </div>
              <div>
                <Label htmlFor="su-pass">Password</Label>
                <Input id="su-pass" type="password" value={suPass} onChange={(e) => setSuPass(e.target.value)} required minLength={8} />
              </div>

              {role === "coach" && (
                <>
                  <div>
                    <Label htmlFor="su-college">College / program</Label>
                    <Input id="su-college" value={suCollege} onChange={(e) => setSuCollege(e.target.value)} required maxLength={150} />
                  </div>
                  <div>
                    <Label htmlFor="su-title">Your title</Label>
                    <Input id="su-title" value={suTitle} onChange={(e) => setSuTitle(e.target.value)} placeholder="Assistant Coach" maxLength={100} />
                  </div>
                  <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    Coach accounts are approved by our team before you can browse athletes.
                  </p>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="si-pass">Password</Label>
                <Input id="si-pass" type="password" value={siPass} onChange={(e) => setSiPass(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm">
                <Link to="/reset-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
