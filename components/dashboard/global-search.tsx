"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/lib/nav";
import { PATIENTS } from "@/lib/data";
import { initials } from "@/lib/utils";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent/40 sm:w-72"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search patients, pages…</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search patients, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`page ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Patients">
            {PATIENTS.filter((p) => p.role === "PATIENT").map((p) => (
              <CommandItem
                key={p.id}
                value={`patient ${p.name} ${p.email}`}
                onSelect={() => go(`/patients/${p.id}`)}
              >
                <span
                  className="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-semibold"
                  style={{ backgroundColor: `${p.avatarColor}1f`, color: p.avatarColor }}
                >
                  {initials(p.name)}
                </span>
                <span>{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.email}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
