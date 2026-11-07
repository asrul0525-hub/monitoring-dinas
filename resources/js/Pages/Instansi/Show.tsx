import { AppShell } from '@/Components/shell/AppShell';
import { InstansiRow, SharedProps } from '@/types/monitoring';

type ShowProps = SharedProps & {
    instansi: InstansiRow;
};

export default function InstansiShow({ instansi }: ShowProps) {
    return (
        <AppShell title={instansi.nama} subtitle={instansi.url}>
            <div className="surface-card p-6 text-xs text-ink-secondary">
                Detail riwayat pemantauan {instansi.nama}
            </div>
        </AppShell>
    );
}
