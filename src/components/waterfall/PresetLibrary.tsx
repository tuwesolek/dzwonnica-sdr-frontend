import { AlertTriangle, Headphones, Search, Telescope } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  PRESET_CATEGORIES,
  PRESET_CATEGORY_LABELS,
  SIGNAL_PRESETS,
  formatPresetBandwidth,
  formatPresetFrequency,
  type PresetCapability,
  type PresetCategory,
  type SignalPreset,
} from '../../data/signalPresets';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

type Props = {
  onTune: (preset: SignalPreset) => void;
  compact?: boolean;
};

type CategoryFilter = 'all' | PresetCategory;
type CapabilityFilter = 'all' | PresetCapability;

function searchableText(preset: SignalPreset): string {
  return [
    preset.name,
    PRESET_CATEGORY_LABELS[preset.category],
    preset.modulation,
    preset.protocol,
    preset.region,
    preset.description,
    ...preset.tags,
  ].filter(Boolean).join(' ').toLocaleLowerCase('pl');
}

export function PresetLibrary({ onTune, compact = false }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [capability, setCapability] = useState<CapabilityFilter>('all');

  const categoryCounts = useMemo(() => {
    const counts = new Map<PresetCategory, number>();
    for (const item of SIGNAL_PRESETS) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('pl');
    const tokens = needle.split(/\s+/).filter(Boolean);
    return SIGNAL_PRESETS
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => capability === 'all' || item.capability === capability)
      .filter((item) => {
        if (tokens.length === 0) return true;
        const text = searchableText(item);
        return tokens.every((token) => text.includes(token));
      })
      .sort((a, b) => a.frequencyHz - b.frequencyHz);
  }, [capability, category, query]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="rounded-lg border border-amber-700/25 bg-amber-500/5 p-3 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Tylko odbiór. Przestrzegaj prawa i tajemnicy komunikowania; nie zakłócaj łączności. Dostrojenie poza bieżącym oknem przestraja wspólny odbiornik Pluto dla wszystkich użytkowników. Pozycja w bibliotece nie gwarantuje lokalnej aktywności.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          placeholder="Szukaj: FT8, PKP, ADS-B, Meshtastic, 121.5…"
          aria-label="Szukaj presetów"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant={category === 'all' ? 'default' : 'secondary'} className="h-7 px-2.5 text-xs" onClick={() => setCategory('all')}>
          Wszystkie <span className="opacity-70">{SIGNAL_PRESETS.length}</span>
        </Button>
        {PRESET_CATEGORIES.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={category === item ? 'default' : 'secondary'}
            className="h-7 px-2.5 text-xs"
            onClick={() => setCategory(item)}
          >
            {PRESET_CATEGORY_LABELS[item]} <span className="opacity-70">{categoryCounts.get(item) ?? 0}</span>
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant={capability === 'all' ? 'outline' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setCapability('all')}>Wszystko</Button>
          <Button type="button" size="sm" variant={capability === 'audio' ? 'outline' : 'ghost'} className="h-7 gap-1.5 px-2 text-xs" onClick={() => setCapability('audio')}>
            <Headphones className="h-3.5 w-3.5" /> Odsłuch
          </Button>
          <Button type="button" size="sm" variant={capability === 'spectrum' ? 'outline' : 'ghost'} className="h-7 gap-1.5 px-2 text-xs" onClick={() => setCapability('spectrum')}>
            <Telescope className="h-3.5 w-3.5" /> Widmo
          </Button>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{filtered.length} wyników</span>
      </div>

      <ScrollArea className={compact ? 'h-[52vh] pr-2' : 'h-[min(58vh,590px)] pr-3'}>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Brak presetów spełniających filtry.</div>
        ) : (
          <div className={compact ? 'grid gap-2' : 'grid gap-2 md:grid-cols-2'}>
            {filtered.map((item) => (
              <article key={item.id} className="group rounded-lg border bg-background/80 p-3 shadow-sm transition-colors hover:border-amber-600/45 hover:bg-amber-500/[0.035]">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-sm font-semibold leading-tight">{item.name}</h4>
                      {item.caution ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-label="Kanał chroniony lub bezpieczeństwa" /> : null}
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">{formatPresetFrequency(item.frequencyHz)}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{item.mode}</Badge>
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{formatPresetBandwidth(item.bandwidthHz)}</Badge>
                      <Badge className="px-1.5 py-0 text-[10px]">{item.protocol ?? item.modulation}</Badge>
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{item.region}</Badge>
                    </div>
                  </div>
                  <Button type="button" size="sm" className="h-8 shrink-0 px-3 text-xs" onClick={() => onTune(item)}>
                    Dostrój
                  </Button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                  {item.capability === 'audio' ? <Headphones className="h-3 w-3" /> : <Telescope className="h-3 w-3" />}
                  {item.capability === 'audio' ? 'odsłuch / sygnał audio' : 'podgląd widma'} · {item.modulation}
                </div>
              </article>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
