"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Factory, Layers3, Network, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";

type Hierarchy = {
  id: string;
  name: string;
  areas?: Array<{
    id: string;
    name: string;
    production_lines?: Array<{
      id: string;
      name: string;
      equipment?: Array<{ id: string; name: string }>;
    }>;
  }>;
};

export default function AssetsPage() {
  const [tree, setTree] = useState<Hierarchy[]>([]);
  const [type, setType] = useState("site");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { toast } = useToast();

  const loadTree = async (withLoader = false) => {
    if (withLoader) {
      setIsInitialLoading(true);
    }

    try {
      const res = await fetch("/api/assets");
      const json = await res.json();

      if (!res.ok) {
        toast({ title: "Failed to load assets", description: json.error ?? "Unknown error", kind: "error" });
        return;
      }

      setTree(json.data ?? []);
    } catch (error) {
      toast({ title: "Failed to load assets", description: String(error), kind: "error" });
    } finally {
      if (withLoader) {
        setIsInitialLoading(false);
      }
    }
  };

  const options = useMemo(() => {
    if (type === "area") {
      return tree.map((site) => ({ id: site.id, label: `Site: ${site.name}` }));
    }

    if (type === "line") {
      return tree.flatMap((site) =>
        (site.areas ?? []).map((area) => ({
          id: area.id,
          label: `Area: ${area.name} (${site.name})`
        }))
      );
    }

    if (type === "equipment") {
      return tree.flatMap((site) =>
        (site.areas ?? []).flatMap((area) =>
          (area.production_lines ?? []).map((line) => ({
            id: line.id,
            label: `Line: ${line.name} (${area.name})`
          }))
        )
      );
    }

    return [] as Array<{ id: string; label: string }>;
  }, [tree, type]);

  const stats = useMemo(() => {
    const sites = tree.length;
    const areas = tree.reduce((sum, site) => sum + (site.areas?.length ?? 0), 0);
    const lines = tree.reduce(
      (sum, site) => sum + (site.areas ?? []).reduce((inner, area) => inner + (area.production_lines?.length ?? 0), 0),
      0
    );
    const equipment = tree.reduce(
      (sum, site) =>
        sum +
        (site.areas ?? []).reduce(
          (areasSum, area) =>
            areasSum +
            (area.production_lines ?? []).reduce((lineSum, line) => lineSum + (line.equipment?.length ?? 0), 0),
          0
        ),
      0
    );

    return { sites, areas, lines, equipment };
  }, [tree]);

  const createNode = async () => {
    if (!name.trim()) {
      toast({ title: "Validation error", description: "Name is required.", kind: "error" });
      return;
    }

    const payloadMap: Record<string, Record<string, string>> = {
      site: { name: name.trim() },
      area: { name: name.trim(), site_id: parentId },
      line: { name: name.trim(), area_id: parentId },
      equipment: { name: name.trim(), production_line_id: parentId }
    };

    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload: payloadMap[type] })
    });

    const body = await res.json();
    if (!res.ok) {
      toast({ title: "Failed to create asset", description: body.error ?? "Unknown error", kind: "error" });
      return;
    }

    toast({ title: "Asset created", kind: "success" });
    setName("");
    setParentId("");
    await loadTree();
  };

  useEffect(() => {
    void loadTree(true);
  }, []);

  useEffect(() => {
    if (options.length > 0) {
      setParentId(options[0].id);
    } else {
      setParentId("");
    }
  }, [options]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Asset Hierarchy Command Center</h2>
        <p className="mt-1 text-sm text-muted">
          Build and monitor your plant structure from site level down to individual machines.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="border-sky-500/25 bg-sky-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-sky-500">Sites</p>
            {isInitialLoading ? <Skeleton className="mt-2 h-7 w-10 bg-sky-400/30" /> : <p className="mt-1 text-xl font-semibold text-sky-600 dark:text-sky-100">{stats.sites}</p>}
          </Card>
          <Card className="border-emerald-500/25 bg-emerald-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-emerald-500">Areas</p>
            {isInitialLoading ? <Skeleton className="mt-2 h-7 w-10 bg-emerald-400/30" /> : <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-100">{stats.areas}</p>}
          </Card>
          <Card className="border-amber-500/25 bg-amber-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-amber-500">Lines</p>
            {isInitialLoading ? <Skeleton className="mt-2 h-7 w-10 bg-amber-400/30" /> : <p className="mt-1 text-xl font-semibold text-amber-600 dark:text-amber-100">{stats.lines}</p>}
          </Card>
          <Card className="border-rose-500/25 bg-rose-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-rose-500">Equipment</p>
            {isInitialLoading ? <Skeleton className="mt-2 h-7 w-10 bg-rose-400/30" /> : <p className="mt-1 text-xl font-semibold text-rose-600 dark:text-rose-100">{stats.equipment}</p>}
          </Card>
        </div>
      </section>

      <Card className="space-y-3 border-border/80 bg-surface/90">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Network className="h-4 w-4 text-accent" />
          Add New Hierarchy Node
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="site">Site</option>
            <option value="area">Area</option>
            <option value="line">Production Line</option>
            <option value="equipment">Equipment</option>
          </select>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          {type === "site" ? (
            <Input disabled value="No parent required for site" />
          ) : (
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          <Button onClick={createNode}>Create Node</Button>
        </div>
      </Card>

      <section className="space-y-3">
        {isInitialLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={`tree-skeleton-${index}`} className="border-border/80 bg-card/85 p-4">
              <Skeleton className="mb-4 h-5 w-52" />
              <div className="grid min-w-[880px] grid-cols-4 gap-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </Card>
          ))
        ) : tree.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-surface/70 p-10 text-center text-sm text-muted">
            No assets yet. Create a Site to start building hierarchy.
          </Card>
        ) : (
          tree.map((site, siteIndex) => {
            const areas = site.areas ?? [];
            const lines = areas.flatMap((area) => area.production_lines ?? []);
            const equipment = lines.flatMap((line) => line.equipment ?? []);

            return (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: siteIndex * 0.04 }}
              >
                <Card className="relative overflow-hidden border-border/80 bg-card/85 p-0">
                  <div className="border-b border-border/70 bg-surface/90 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-sky-500" />
                        <p className="text-sm text-sky-500">Site</p>
                        <p className="text-base font-semibold text-foreground">{site.name}</p>
                      </div>
                      <p className="text-xs text-muted">
                        {areas.length} areas • {lines.length} lines • {equipment.length} equipment
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4">
                    <div className="grid min-w-[880px] grid-cols-4 gap-3">
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sky-500">Site</p>
                        <div className="rounded-md border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-sm text-sky-700 dark:text-sky-100">
                          {site.name}
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-500">Areas</p>
                        <div className="space-y-1">
                          {areas.length === 0 ? (
                            <p className="text-xs text-muted">No areas</p>
                          ) : (
                            areas.map((area) => (
                              <div
                                key={area.id}
                                className="rounded-md border border-emerald-500/25 bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-100"
                              >
                                {area.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-amber-500">
                          <Layers3 className="h-3.5 w-3.5" />
                          Production Lines
                        </p>
                        <div className="space-y-1">
                          {lines.length === 0 ? (
                            <p className="text-xs text-muted">No lines</p>
                          ) : (
                            lines.map((line) => (
                              <div
                                key={line.id}
                                className="rounded-md border border-amber-500/25 bg-amber-500/15 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-100"
                              >
                                {line.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-rose-500">
                          <Wrench className="h-3.5 w-3.5" />
                          Equipment
                        </p>
                        <div className="space-y-1">
                          {equipment.length === 0 ? (
                            <p className="text-xs text-muted">No equipment</p>
                          ) : (
                            equipment.map((eq) => (
                              <div
                                key={eq.id}
                                className="rounded-md border border-rose-500/25 bg-rose-500/15 px-3 py-1.5 text-sm text-rose-700 dark:text-rose-100"
                              >
                                {eq.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/70 bg-card px-4 py-2">
                    <p className="text-xs text-muted">Flow: Site → Area → Line → Equipment</p>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );
}
