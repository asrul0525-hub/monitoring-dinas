import { HighlightText } from '@/Components/ui/HighlightText';
import { KATEGORI_INSTANSI_LABELS, KategoriInstansiKey } from '@/types/monitoring';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface InstansiOptionItem {
    id: number;
    nama: string;
    kategori: KategoriInstansiKey;
}

const KATEGORI_OPTIONS: { key: KategoriInstansiKey | null; label: string }[] = [
    { key: null, label: 'Semua Instansi' },
    { key: 'vertikal', label: 'Instansi Vertikal' },
    { key: 'dinas', label: 'Dinas' },
    { key: 'kec_kel_pkm', label: 'Kec/Kel/PKM' },
    { key: 'layanan_pemerintah', label: 'Layanan Pemerintah' },
    { key: 'layanan_publik', label: 'Layanan Publik' },
];

type InstansiKategoriPopoverProps =
    | {
          mode: 'multiple';
          options: InstansiOptionItem[];
          kategori: KategoriInstansiKey | null;
          selectedIds: number[];
          onSelectKategori: (kategori: KategoriInstansiKey | null) => void;
          onToggleId: (id: number) => void;
          triggerLabel: string;
          buttonClassName?: string;
      }
    | {
          mode: 'single';
          options: InstansiOptionItem[];
          kategori: KategoriInstansiKey | null;
          selectedId: number | null;
          onSelectKategori: (kategori: KategoriInstansiKey | null) => void;
          onSelectId: (id: number | null) => void;
          triggerLabel: string;
          buttonClassName?: string;
      };

/**
 * Popover pemilih Kategori & Instansi dengan kotak pencarian instan,
 * penutup otomatis saat klik di luar atau menekan Escape.
 */
export function InstansiKategoriPopover(props: InstansiKategoriPopoverProps) {
    const {
        mode,
        options,
        kategori,
        onSelectKategori,
        triggerLabel,
        buttonClassName = 'input-control flex h-10 w-full cursor-pointer items-center justify-between px-3 text-left text-xs hover:border-accent',
    } = props;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setSearch('');
            return;
        }

        const focusTimer = window.setTimeout(() => {
            searchInputRef.current?.focus();
        }, 10);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [open]);

    const filteredOptions = useMemo(() => {
        const byKategori = kategori
            ? options.filter((opt) => opt.kategori === kategori)
            : options;

        const q = search.trim().toLowerCase();
        if (!q) return byKategori;
        return byKategori.filter((opt) => opt.nama.toLowerCase().includes(q));
    }, [options, kategori, search]);

    const isCategoryActive = (kat: KategoriInstansiKey | null) => {
        if (mode === 'multiple') {
            return kategori === kat && props.selectedIds.length === 0;
        }
        return kategori === kat && props.selectedId === null;
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={buttonClassName}
            >
                <span className="truncate">{triggerLabel}</span>
                <span
                    className={`ml-2 shrink-0 text-xs text-ink-secondary transition-transform duration-150 ${
                        open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                >
                    ▾
                </span>
            </button>

            {open && (
                <div className="surface-elevated animate-modal-pop absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-line-strong p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between border-b border-line-subtle pb-2 text-xs">
                        <span className="font-semibold text-ink-primary">
                            Pilih Kategori / Instansi
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-ink-secondary hover:text-ink-primary"
                        >
                            Tutup
                        </button>
                    </div>

                    <div className="mb-2.5 grid grid-cols-2 gap-1.5 border-b border-line-subtle pb-2.5">
                        {KATEGORI_OPTIONS.map((item) => {
                            const active = isCategoryActive(item.key);
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                        onSelectKategori(item.key);
                                        if (mode === 'single') {
                                            setOpen(false);
                                        }
                                    }}
                                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium ${
                                        active
                                            ? 'btn-primary-pill text-center'
                                            : 'surface-card text-ink-secondary hover:text-ink-primary'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mb-2">
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama instansi…"
                            className="input-control h-8 w-full px-2.5 text-xs"
                        />
                    </div>

                    <div className="max-h-52 overflow-y-auto pr-1">
                        {filteredOptions.length === 0 ? (
                            <p className="px-2 py-3 text-center text-xs text-ink-secondary">
                                Tidak ada instansi yang cocok.
                            </p>
                        ) : (
                            filteredOptions.map((opt) => {
                                if (mode === 'multiple') {
                                    return (
                                        <label
                                            key={opt.id}
                                            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-primary hover:bg-surface-card"
                                        >
                                            <span className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={props.selectedIds.includes(opt.id)}
                                                    onChange={() => props.onToggleId(opt.id)}
                                                    className="h-4 w-4 shrink-0 cursor-pointer rounded border border-line-strong bg-surface-elevated text-accent accent-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0"
                                                />
                                                <span className="truncate">
                                                    <HighlightText text={opt.nama} query={search} />
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-[10px] text-ink-secondary">
                                                {KATEGORI_INSTANSI_LABELS[opt.kategori]}
                                            </span>
                                        </label>
                                    );
                                }

                                const isSelected = props.selectedId === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            props.onSelectId(isSelected ? null : opt.id);
                                        }}
                                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs ${
                                            isSelected
                                                ? 'bg-accent-soft font-semibold text-accent'
                                                : 'text-ink-primary hover:bg-surface-card'
                                        }`}
                                    >
                                        <span className="truncate">
                                            <HighlightText text={opt.nama} query={search} />
                                        </span>
                                        <span className="shrink-0 text-[10px] text-ink-secondary">
                                            {KATEGORI_INSTANSI_LABELS[opt.kategori]}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
