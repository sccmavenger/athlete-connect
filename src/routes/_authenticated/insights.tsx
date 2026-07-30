import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useManagedAthletes } from "@/lib/athlete-hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { CompletenessCard } from "@/components/CompletenessCard";
import { BarChart3, Eye, Bookmark, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Profile insights — Recruiting Hub" },
      { name: "description", content: "See who is viewing your recruiting profile and how strong it looks." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Insights;
});

function Insights() {
  return null;
}
