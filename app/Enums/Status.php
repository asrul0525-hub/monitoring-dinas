<?php

namespace App\Enums;

enum Status: string
{
    case Aktif = 'aktif';
    case KurangAktif = 'kurang-aktif';
    case TidakAktif = 'tidak-aktif';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::KurangAktif => 'Kurang Aktif',
            self::TidakAktif => 'Tidak Aktif',
        };
    }
}
