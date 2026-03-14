import { ExternalLink, MapPin, Scissors, Search, Star } from "lucide-react";
import type { Salon } from "@/lib/types";

type Props = {
  selectedStyle: string | null;
  location: string;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string | null;
  salons: Salon[];
  hasSearched: boolean;
};

export default function SalonList({
  selectedStyle,
  location,
  onLocationChange,
  onSearch,
  loading,
  error,
  salons,
  hasSearched,
}: Props) {
  return (
    <section className="relative mt-12 overflow-hidden rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(160deg,rgba(6,10,17,0.96),rgba(10,16,28,0.9))] p-6 md:p-8">
      <div className="pointer-events-none absolute -right-10 top-0 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
            <MapPin className="h-3.5 w-3.5" />
            Curated Demo Matches
          </div>
          <h3 className="text-2xl font-medium text-white">Match your cut with a salon</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Pick one of your AI looks, enter the area you want to search, and we&apos;ll surface salons that fit the vibe and technical finish of that cut.
          </p>
        </div>
        {selectedStyle && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            Selected look: <span className="font-semibold">{selectedStyle}</span>
          </div>
        )}
      </div>

      <form
        className="relative mt-6 flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <label className="sr-only" htmlFor="salon-location">
          Search area
        </label>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="salon-location"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Enter city, neighborhood, or postal code"
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !selectedStyle}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "Matching salons..." : "Find salons"}
        </button>
      </form>

      {!selectedStyle && (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-slate-400">
          Choose a hairstyle card above first, then search by location.
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!error && hasSearched && salons.length === 0 && !loading && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-slate-400">
          No matches came back for that combination yet. Try a broader area or a different style.
        </div>
      )}

      {salons.length > 0 && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {salons.map((salon) => (
            <article
              key={salon.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(2,8,23,0.28)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-medium text-white">{salon.name}</h4>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 text-cyan-300" />
                    <span>{salon.address}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-amber-200">
                  <Star className="h-4 w-4 fill-current" />
                  {salon.rating.toFixed(1)}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-300">{salon.reason}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{salon.vibe}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {salon.matchedServices.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100"
                  >
                    <Scissors className="h-3 w-3" />
                    {service}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-400">{salon.priceBand}</span>
                <a
                  href={salon.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  Open profile
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500">
        Demo feature for the hackathon build: results are curated sample matches generated from your selected look, not a live maps integration yet.
      </p>
    </section>
  );
}
