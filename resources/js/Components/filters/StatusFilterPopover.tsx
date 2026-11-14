import { useEffect, useRef, useState } from 'react';

interface StatusFilterPopoverProps {
    id?: string;
    value: string;
    onChange: (nextStatus: string) => void;
}

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status', dotClass: 'status-dot--menunggu' },
    { value: 'aktif', label: 'Aktif', dotClass: 'status-dot--aktif' },
    { value: 'kurang-aktif', label: 'Kurang Aktif', dotClass: 'status-dot--kurang' },
    { value: 'tidak-aktif', label: 'Tidak Aktif', dotClass: 'status-dot--tidak' },
] as const;

/**
 * Pemilih filter Status Akhir Periode dengan indikator warna status dan
 * penanda panah yang seragam dengan InstansiKategoriPopover.
 */
export function StatusFilterPopover({ id, value, onChange }: StatusFilterPopoverProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
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
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [open]);

    const activeOption = STATUS_OPTIONS.find((opt) => opt.value === value) ?? STATUS_OPTIONS[0];

    return (
        <div ref={containerRef} className="relative">
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="input-control flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 text-left text-xs hover:border-accent"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <span className={`status-dot h-2 w-2 shrink-0 rounded-full ${activeOption.dotClass}`} />
                    <span className="truncate">{activeOption.label}</span>
                </span>
                <span
                    className={`shrink-0 text-xs text-ink-secondary transition-transform duration-150 ${
                        open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                >
                    ▾
                </span>
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Filter Status Akhir Periode"
                    className="surface-elevated animate-modal-pop absolute left-0 top-full z-50 mt-1 w-full min-w-[180px] space-y-0.5 rounded-xl border border-line-strong p-1.5 shadow-2xl"
                >
                    {STATUS_OPTIONS.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.label}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    setOpen(false);
                                    if (opt.value !== value) {
                                        onChange(opt.value);
                                    }
                                }}
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                                    isSelected
                                        ? 'bg-accent-soft font-semibold text-accent'
                                        : 'text-ink-primary hover:bg-surface-card'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className={`status-dot h-2 w-2 shrink-0 rounded-full ${opt.dotClass}`} />
                                    <span>{opt.label}</span>
                                </span>
                                {isSelected && (
                                    <span className="text-xs font-bold" aria-hidden="true">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
