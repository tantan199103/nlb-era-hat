import React from 'react';
import { BellRing, CalendarDays, CircleAlert, SearchX, ShieldCheck } from 'lucide-react';

/**
 * A deliberate empty state for the source-verification gate.
 *
 * The public catalog must never show an unverified product as purchasable.
 * This component makes that policy visible instead of looking like a broken
 * query or an empty storefront.
 */
export default function CatalogAvailabilityNotice({
  reason = 'verification',
  pendingCount = 0,
  onBrowseCalendar,
  onNotify,
  onClearFilters,
  compact = false,
}) {
  const isFiltered = reason === 'filtered';
  const isError = reason === 'error';
  const hasPendingCount = Number(pendingCount) > 0;

  if (isFiltered) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-lg border border-[#2b2b2b] bg-[#141414] text-center ${compact ? 'px-5 py-12' : 'px-6 py-16 sm:py-20'}`}
      >
        <SearchX className="mx-auto mb-4 text-zinc-500" size={30} aria-hidden="true" />
        <p className="mb-2 text-base font-bold text-gray-200">No hats match these filters.</p>
        <p className="mx-auto mb-6 max-w-md text-xs leading-5 text-gray-500">
          Try a broader team, league, size or price range. Only listings with a verified 1688 source are shown.
        </p>
        <button type="button" onClick={onClearFilters} className="btn-primary px-6 py-2 text-xs">
          Clear all filters
        </button>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="status" aria-live="polite" className={`rounded-lg border border-red-900/60 bg-red-950/20 text-center ${compact ? 'px-5 py-12' : 'px-6 py-16 sm:py-20'}`}>
        <CircleAlert className="mx-auto mb-4 text-red-300" size={30} aria-hidden="true" />
        <p className="mb-2 text-base font-bold text-gray-200">Live catalog unavailable</p>
        <p className="mx-auto mb-6 max-w-md text-xs leading-5 text-gray-500">
          We could not load the source-approved catalog right now. Please try again shortly; unverified listings remain hidden for safety.
        </p>
        {onNotify && <button type="button" onClick={onNotify} className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs"><BellRing size={14} aria-hidden="true" /> Notify me when live</button>}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border border-amber-900/60 bg-gradient-to-br from-[#1a1711] via-[#141414] to-[#111] ${compact ? 'px-5 py-10' : 'px-6 py-14 sm:px-10 sm:py-16'}`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-amber-700/60 bg-amber-950/40 text-amber-300">
          <ShieldCheck size={24} aria-hidden="true" />
        </div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
          1688 source verification
        </p>
        <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          New drops are being verified
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-zinc-400 sm:text-sm">
          We only sell a hat after an administrator confirms the matching listing on 1688. The catalog will open as soon as verified sources are ready.
        </p>
        {hasPendingCount && (
          <p className="mt-3 text-xs font-semibold text-amber-200">
            {Number(pendingCount).toLocaleString()} designs are waiting for source review.
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          {onBrowseCalendar && (
            <button type="button" onClick={onBrowseCalendar} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs">
              <CalendarDays size={14} aria-hidden="true" />
              View drop calendar
            </button>
          )}
          {onNotify && (
            <button type="button" onClick={onNotify} className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs">
              <BellRing size={14} aria-hidden="true" />
              Notify me when live
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
