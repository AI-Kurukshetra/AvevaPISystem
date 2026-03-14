"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, BrainCircuit, ChartNoAxesCombined, Cpu, RadioTower, ShieldAlert } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

const features = [
  {
    title: "Real-time Monitoring",
    description: "Track live machine telemetry from sensor streams across your production floor.",
    icon: RadioTower
  },
  {
    title: "Predictive Alerts",
    description: "Configure threshold rules and trigger actionable alerts before failures escalate.",
    icon: ShieldAlert
  },
  {
    title: "AI Anomaly Detection",
    description: "Detect abnormal behavior from rolling averages and highlight outlier readings.",
    icon: BrainCircuit
  },
  {
    title: "Production Analytics",
    description: "Visualize trends for temperature, pressure, speed, and output in one dashboard.",
    icon: ChartNoAxesCombined
  }
];

const pipeline = ["Machines", "Sensors", "Data", "Analytics", "Insights"];

export default function Home() {
  return (
    <div className="min-h-screen px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent sm:text-base">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          SMARTFACTORY AI
        </div>
        <div className="flex items-center gap-2">
          <AuthModal defaultMode="signup" triggerLabel="Sign Up" triggerClassName="text-xs sm:text-sm" />
          <AuthModal
            defaultMode="login"
            triggerLabel="Login"
            triggerClassName="bg-card text-xs text-foreground border border-border hover:bg-surface sm:text-sm"
          />
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-surface/90 p-6 sm:p-10"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent/90">Industrial IoT Analytics</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold text-foreground sm:text-5xl">SmartFactory AI</h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/80 sm:text-lg">AI-Powered Industrial IoT Analytics</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AuthModal defaultMode="signup" triggerLabel="Get Started" triggerClassName="w-full sm:w-auto" />
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.12, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-xl border border-border bg-card/80 p-5"
            >
              <feature.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{feature.description}</p>
            </motion.article>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-surface/90 p-6">
          <h2 className="text-xl font-semibold text-foreground">Architecture</h2>
          <p className="mt-2 text-sm text-foreground/80">Machines -&gt; Sensors -&gt; Data -&gt; Analytics -&gt; Insights</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
            {pipeline.map((step) => (
              <div
                key={step}
                className="rounded-md border border-border bg-surface px-3 py-2 text-center text-xs text-foreground"
              >
                {step}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-accent/30 bg-accent/10 p-6">
          <h2 className="text-xl font-semibold text-foreground">Ready to modernize factory visibility?</h2>
          <p className="mt-2 text-sm text-foreground/80">Create your account and start monitoring assets in realtime.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <AuthModal defaultMode="signup" triggerLabel="Sign Up" triggerClassName="w-full sm:w-auto" />
            <AuthModal
              defaultMode="login"
              triggerLabel="Login"
              triggerClassName="w-full bg-card text-foreground border border-border hover:bg-surface sm:w-auto"
            />
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-8 flex w-full max-w-6xl flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface/70 p-4 text-xs text-muted sm:flex-row sm:items-center">
        <p>(c) SmartFactory AI</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Documentation
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </footer>

      <div className="pointer-events-none fixed bottom-[-120px] left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <Cpu className="pointer-events-none fixed right-4 top-28 hidden h-24 w-24 text-accent/20 xl:block" />
    </div>
  );
}
