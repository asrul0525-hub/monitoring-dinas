<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstansiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $url = trim((string) $this->input('url', ''));
        $feedUrl = trim((string) $this->input('feed_url', ''));
        $kategori = trim((string) $this->input('kategori', ''));

        $this->merge([
            'nama' => trim((string) $this->input('nama', '')),
            'kategori' => $kategori !== '' ? $kategori : 'dinas',
            'url' => $url !== '' ? $this->normalizeUrl($url) : '',
            'feed_url' => $feedUrl !== '' ? $this->normalizeUrl($feedUrl) : null,
        ]);
    }

    private function normalizeUrl(string $raw): string
    {
        if (! preg_match('#^https?://#i', $raw)) {
            $raw = 'https://'.$raw;
        }

        return rtrim($raw, '/');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $instansi = $this->route('instansi');
        $ignoreId = is_object($instansi) ? $instansi->id : $instansi;

        return [
            'nama' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'string', Rule::in(['vertikal', 'dinas', 'kec_kel_pkm'])],
            'url' => [
                'required',
                'string',
                'url:http,https',
                'max:255',
                Rule::unique('instansi', 'url')->ignore($ignoreId),
            ],
            'feed_url' => ['nullable', 'string', 'url:http,https', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama.required' => 'Nama instansi wajib diisi.',
            'kategori.required' => 'Kategori instansi wajib dipilih.',
            'kategori.in' => 'Kategori instansi tidak valid.',
            'url.required' => 'URL website wajib diisi.',
            'url.url' => 'Format URL website tidak valid.',
            'url.unique' => 'URL ini sudah terdaftar.',
            'feed_url.url' => 'Format URL Sitemap atau RSS tidak valid.',
        ];
    }
}
