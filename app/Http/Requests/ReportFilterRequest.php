<?php

namespace App\Http\Requests;

use App\Enums\Status;
use App\Models\Instansi;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $dari = $this->input('dari');
        $sampai = $this->input('sampai');

        $this->merge([
            'dari' => is_string($dari) && trim($dari) !== ''
                ? trim($dari)
                : now()->startOfMonth()->format('Y-m-d'),
            'sampai' => is_string($sampai) && trim($sampai) !== ''
                ? trim($sampai)
                : now()->endOfMonth()->format('Y-m-d'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'instansi' => ['nullable', 'array'],
            'instansi.*' => ['integer'],
            'kategori' => ['nullable', 'string'],
            'dari' => ['required', 'date', 'before_or_equal:sampai'],
            'sampai' => ['required', 'date'],
            'status' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dari.before_or_equal' => 'Tanggal awal harus sebelum tanggal akhir.',
        ];
    }

    /**
     * @return array<int, int>
     */
    public function instansiIds(): array
    {
        $raw = $this->input('instansi', []);
        if (! is_array($raw)) {
            return [];
        }

        return array_values(array_map('intval', array_filter($raw, fn ($v) => is_numeric($v))));
    }

    public function kategoriValue(): ?string
    {
        $raw = $this->input('kategori');

        return is_string($raw) && in_array($raw, Instansi::KATEGORI_KEYS, true)
            ? $raw
            : null;
    }

    public function dariDate(): CarbonImmutable
    {
        return CarbonImmutable::parse((string) $this->input('dari'))->startOfDay();
    }

    public function sampaiDate(): CarbonImmutable
    {
        return CarbonImmutable::parse((string) $this->input('sampai'))->endOfDay();
    }

    public function statusEnum(): ?Status
    {
        $raw = $this->input('status');

        return is_string($raw) ? Status::tryFrom($raw) : null;
    }

    /**
     * @return array{instansi: array<int, int>, kategori: ?string, dari: string, sampai: string, status: ?string}
     */
    public function filterPayload(): array
    {
        return [
            'instansi' => $this->instansiIds(),
            'kategori' => $this->kategoriValue(),
            'dari' => $this->dariDate()->format('Y-m-d'),
            'sampai' => $this->sampaiDate()->format('Y-m-d'),
            'status' => $this->statusEnum()?->value,
        ];
    }
}
