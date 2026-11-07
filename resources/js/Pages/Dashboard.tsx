import { AppShell } from '@/Components/shell/AppShell';

export default function Dashboard() {
    return (
        <AppShell
            title="Dashboard"
            subtitle="Ringkasan status website instansi daerah"
            showStatusTabs
        >
            <div className="surface-card p-6 text-sm text-ink-secondary">
                Memuat metrik pemantauan…
            </div>
        </AppShell>
    );
}
