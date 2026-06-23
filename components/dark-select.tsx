"use client";

import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type DarkSelectOption = {
  value: string;
  label: string;
};

type DarkSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: DarkSelectOption[];
  placeholder?: string;
  name?: string;
  className?: string;
  searchable?: boolean;
};

export function DarkSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  name,
  className,
  searchable = true,
}: DarkSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const selectedLabel = useMemo(() => options.find((option) => option.value === value)?.label ?? '', [options, value]);
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!searchable || !term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term));
  }, [options, query, searchable]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line/70 bg-panel/70 px-3 py-2.5 text-left text-sm text-text outline-none transition hover:border-accent/30 hover:bg-panel2/80 focus:border-accent/50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn('truncate', !selectedLabel && 'text-muted')}>{selectedLabel || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-line/70 bg-panel shadow-2xl shadow-black/20">
          {searchable ? (
            <div className="border-b border-line/70 p-2">
              <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-panel2/70 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type to search"
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted/70"
                />
              </div>
            </div>
          ) : null}
          <div className="max-h-64 overflow-auto p-1">
            {!filteredOptions.length ? (
              <div className="px-3 py-3 text-sm text-muted">No matches found</div>
            ) : null}
            {filteredOptions.map((option) => (
              <button
                key={option.value || '__empty__'}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
                  option.value === value ? 'bg-accent/15 text-text' : 'text-muted hover:bg-panel2/80 hover:text-text',
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value ? <Check className="h-4 w-4 shrink-0 text-accent" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
