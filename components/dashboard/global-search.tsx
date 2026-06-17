"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  FlaskConical,
  Loader2,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TierBadge } from "@/components/dashboard/badges";
import { NAV_ITEMS } from "@/lib/nav";
import { api, type GlobalSearchResults } from "@/lib/api";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchResults | null>(null);
  const [totalResults, setTotalResults] = React.useState(0);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(false);

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

  // Debounced search: fires 300ms after query settles, min 2 chars
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setTotalResults(0);
      setSearchError(false);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError(false);
      api.admin
        .search({ q: query.trim(), limit: 5 })
        .then((res) => {
          setResults(res.data);
          setTotalResults(res.totalResults);
        })
        .catch(() => setSearchError(true))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setQuery("");
      setResults(null);
      setTotalResults(0);
      setSearchError(false);
    }
  }

  function go(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  const shownCount = results
    ? results.users.length +
      results.documents.length +
      results.labResults.length +
      results.contacts.length +
      results.emergencyEvents.length
    : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent/40 sm:w-72"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search users, pages…</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogHeader className="sr-only">
          <DialogTitle>Global search</DialogTitle>
          <DialogDescription>
            Search across users, documents, labs, contacts and emergency events
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="overflow-hidden p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search users, documents, labs..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {/* Pages — static, always shown */}
              <CommandGroup heading="Pages">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`page-${item.href}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {/* Loading indicator */}
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error */}
              {searchError && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Search failed — try again
                </p>
              )}

              {/* No results */}
              {!searching &&
                !searchError &&
                query.trim().length >= 2 &&
                results &&
                totalResults === 0 && (
                  <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
                )}

              {/* Categorized API results */}
              {results && (
                <>
                  {results.users.length > 0 && (
                    <CommandGroup heading="Users">
                      {results.users.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={`user-${u.id}`}
                          onSelect={() => go(`/users/${u.id}`)}
                        >
                          <User />
                          <span className="flex-1 truncate">{u.email}</span>
                          {u.fullName && (
                            <span className="text-xs text-muted-foreground">
                              {u.fullName}
                            </span>
                          )}
                          {u.tier && <TierBadge tier={u.tier} />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.documents.length > 0 && (
                    <CommandGroup heading="Documents">
                      {results.documents.map((d) => (
                        <CommandItem
                          key={d.id}
                          value={`doc-${d.id}`}
                          onSelect={() => go(`/users/${d.userId}`)}
                        >
                          <FileText />
                          <span className="flex-1 truncate">
                            {d.originalFilename}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {d.userEmail}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.labResults.length > 0 && (
                    <CommandGroup heading="Lab results">
                      {results.labResults.map((l) => (
                        <CommandItem
                          key={l.id}
                          value={`lab-${l.id}`}
                          onSelect={() => go(`/users/${l.userId}`)}
                        >
                          <FlaskConical />
                          <span className="flex-1 truncate">{l.markerName}</span>
                          <span className="text-xs text-muted-foreground">
                            {l.value} {l.unit}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.contacts.length > 0 && (
                    <CommandGroup heading="Contacts">
                      {results.contacts.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`contact-${c.id}`}
                          onSelect={() => go(`/users/${c.userId}`)}
                        >
                          <Stethoscope />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.userEmail}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.emergencyEvents.length > 0 && (
                    <CommandGroup heading="Emergency events">
                      {results.emergencyEvents.map((e) => (
                        <CommandItem
                          key={e.id}
                          value={`emergency-${e.id}`}
                          onSelect={() => go(`/users/${e.userId}`)}
                        >
                          <AlertTriangle />
                          <span className="flex-1 truncate">
                            {e.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {e.userEmail}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}

              {/* Footer: result count */}
              {results && totalResults > 0 && (
                <>
                  <CommandSeparator />
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    {totalResults} result{totalResults !== 1 ? "s" : ""}
                    {totalResults > shownCount &&
                      " — Showing top results, refine your search for more"}
                  </p>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
