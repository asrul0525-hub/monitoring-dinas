import { PageProps } from './index';

export type StatusKey = 'aktif' | 'kurang-aktif' | 'tidak-aktif';

export type ContentSourceKey = 'sitemap' | 'rss' | 'dom';

export type KategoriInstansiKey =
    | 'vertikal'
    | 'dinas'
    | 'kec_kel_pkm'
    | 'layanan_pemerintah'
    | 'layanan_publik';

export const KATEGORI_INSTANSI_LABELS: Record<KategoriInstansiKey, string> = {
    vertikal: 'Instansi Vertikal',
    dinas: 'Dinas',
    kec_kel_pkm: 'Kec/Kel/PKM',
    layanan_pemerintah: 'Layanan Pemerintah',
    layanan_publik: 'Layanan Publik',
};

export interface InstansiRow {
    id: number;
    nama: string;
    kategori: KategoriInstansiKey;
    url: string;
    feedUrl: string | null;
    status: StatusKey | null;
    lastContentAt: string | null;
    lastCheckedAt: string | null;
    lastResponseMs: number | null;
    lastHttpCode: number | null;
    contentSource: ContentSourceKey | null;
    downSince: string | null;
}

export interface StatusCounts {
    aktif: number;
    'kurang-aktif': number;
    'tidak-aktif': number;
    menunggu: number;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface QuickSearchInstansiItem {
    id: number;
    nama: string;
    url: string;
    kategori: KategoriInstansiKey;
    status: StatusKey | null;
}

export type SharedProps = PageProps<{
    schedule: {
        lastCheckAt: string | null;
        nextCheckAt: string | null;
        intervalHours: number;
        schedulerActive?: boolean;
    };
    alerts: {
        count: number;
        items: Pick<InstansiRow, 'id' | 'nama' | 'downSince'>[];
    };
    isSampleData: boolean;
    statusCounts: StatusCounts;
    quickSearchItems?: QuickSearchInstansiItem[];
    flash?: {
        status?: string | null;
    };
}>;
