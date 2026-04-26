import { useEffect, useState, useCallback, useRef } from "react";
import {
  ExternalLink, RefreshCw, Search, Clock, Rss,
  Globe, HeartPulse, Brain, Microscope, Pill,
  AlertCircle, Newspaper, Dna, Baby, BookOpen,
  TrendingUp, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Input }     from "@/components/ui/input";
import { Button }    from "@/components/ui/button";
import { Skeleton }  from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }     from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn }        from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Article {
  source:      { id: string | null; name: string };
  author:      string | null;
  title:       string;
  description: string | null;
  url:         string;
  urlToImage:  string | null;
  publishedAt: string;
  content:     string | null;
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "top",       label: "Top Health",    icon: HeartPulse, q: "health"                          },
  { key: "disease",   label: "Disease",       icon: Microscope, q: "disease outbreak virus infection" },
  { key: "mental",    label: "Mental Health", icon: Brain,      q: "mental health depression anxiety" },
  { key: "medicine",  label: "Medicine",      icon: Pill,       q: "medicine drug therapy treatment"  },
  { key: "research",  label: "Research",      icon: Dna,        q: "medical research clinical trial"  },
  { key: "nutrition", label: "Nutrition",     icon: BookOpen,   q: "nutrition diet food health"       },
  { key: "pediatric", label: "Pediatrics",    icon: Baby,       q: "child pediatric infant health"    },
  { key: "global",    label: "Global Health", icon: Globe,      q: "WHO pandemic global health"       },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = article.urlToImage && !imgErr;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="overflow-hidden border-border transition-all duration-200 hover:border-primary/40 hover:shadow-md rounded-xl">
        <CardContent className="p-0">
          <div className="flex min-h-[100px]">

            {/* ── Text ── */}
            <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-2">
              <div>
                {/* Meta row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 max-w-[160px] truncate">
                    {article.source.name}
                  </Badge>
                  <span className="text-muted-foreground text-xs flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {timeAgo(article.publishedAt)}
                  </span>
                  {article.author && (
                    <span className="text-muted-foreground/60 text-[10px] truncate max-w-[120px]">
                      by {article.author.split(",")[0]}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-foreground font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                  {article.title}
                </h2>

                {/* Description */}
                {article.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>

              {/* Read more */}
              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-3 w-3" /> Read full article
              </span>
            </div>

            {/* ── Thumbnail ── */}
            {hasImg && (
              <div className="shrink-0 w-28 sm:w-36 overflow-hidden">
                <img
                  src={article.urlToImage!}
                  alt={article.title}
                  onError={() => setImgErr(true)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <Card className="overflow-hidden border-border rounded-xl">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-28 w-32 rounded-lg shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function NewsFeed() {
  const [articles, setArticles]       = useState<Article[]>([]);
  const [totalResults, setTotal]      = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeKey, setActiveKey]     = useState<string>("top");
  const [search, setSearch]           = useState("");
  const [committed, setCommitted]     = useState("");  // confirmed query
  const [page, setPage]               = useState(1);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCat = CATEGORIES.find(c => c.key === activeKey)!;
  const totalPages = Math.min(Math.ceil(totalResults / PAGE_SIZE), 5); // NewsAPI caps at 100 results

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const q = committed || activeCat.q;
    const params = new URLSearchParams({ q, page: String(page) });

    try {
      const res  = await fetch(`/api/news?${params}`);
      const data = await res.json();

      if (data.status === "ok") {
        const clean = (data.articles as Article[]).filter(
          a => a.title && a.title !== "[Removed]" && a.url !== "https://removed.com"
        );
        setArticles(clean);
        setTotal(data.totalResults ?? 0);
      } else {
        setError(data.message ?? "Could not load news. Please try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [activeKey, committed, page, refreshSeed]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCommitted(search.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setCommitted("");
    setPage(1);
    inputRef.current?.focus();
  };

  const switchCategory = (key: string) => {
    setActiveKey(key);
    setSearch("");
    setCommitted("");
    setPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Rss className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Health News</h1>
            <p className="text-xs text-muted-foreground">
              Live articles · powered by NewsAPI
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setPage(1); setRefreshSeed(s => s + 1); }}
          disabled={loading}
          className="gap-2 text-xs shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search health news (press Enter)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold shrink-0">
          Search
        </Button>
      </form>

      {/* ── Category pills ─────────────────────────────────────────────── */}
      {!committed && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const Icon   = cat.icon;
            const active = activeKey === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => switchCategory(cat.key)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Active search banner ────────────────────────────────────────── */}
      {committed && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <span className="text-sm text-foreground">
            Results for <span className="font-semibold">"{committed}"</span>
            {totalResults > 0 && (
              <span className="text-muted-foreground font-normal"> · {totalResults.toLocaleString()} articles</span>
            )}
          </span>
          <button onClick={clearSearch} className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && !committed && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {totalResults.toLocaleString()} articles · page {page} of {totalPages}
          </span>
        </div>
      )}

      <Separator />

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => <ArticleSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Failed to load news</p>
            <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNews} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────────────────── */}
      {!loading && !error && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">No articles found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {committed
                ? `Nothing matched "${committed}" — try a different term.`
                : "Try refreshing or selecting a different category."}
            </p>
          </div>
          {committed && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="text-xs">
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* ── Article list ────────────────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && (
        <>
          <div className="space-y-3">
            {articles.map((article, i) => (
              <ArticleCard key={`${article.url}-${i}`} article={article} />
            ))}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Button
                  key={n}
                  variant={page === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(n)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {n}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
