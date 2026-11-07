<?php

namespace App\Http\Controllers;

use App\Enums\Status;
use App\Http\Requests\InstansiRequest;
use App\Models\Instansi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstansiController extends Controller
{
    public function index(Request $request): Response
    {
        $rawStatus = (string) $request->query('status', '');
        $statusEnum = Status::tryFrom($rawStatus);
        $q = trim((string) $request->query('q', ''));

        $query = Instansi::query();

        if ($statusEnum !== null) {
            $query->where('status', $statusEnum->value);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'like', "%{$q}%")
                    ->orWhere('url', 'like', "%{$q}%");
            });
        }

        $paginator = $query
            ->orderBy('nama')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Instansi $i) => $i->toRow());

        return Inertia::render('Instansi/Index', [
            'rows' => $paginator,
            'filters' => [
                'status' => $statusEnum?->value,
                'q' => $q,
            ],
            'openTambah' => $request->boolean('tambah'),
        ]);
    }

    public function store(InstansiRequest $request): RedirectResponse
    {
        Instansi::query()->create([
            'nama' => $request->validated('nama'),
            'url' => $request->validated('url'),
            'feed_url' => $request->validated('feed_url'),
            'status' => null,
        ]);

        return redirect()->route('instansi.index')->with('status', 'Instansi berhasil ditambahkan.');
    }

    public function update(InstansiRequest $request, Instansi $instansi): RedirectResponse
    {
        $instansi->update([
            'nama' => $request->validated('nama'),
            'url' => $request->validated('url'),
            'feed_url' => $request->validated('feed_url'),
        ]);

        return redirect()->route('instansi.index')->with('status', 'Data instansi berhasil diperbarui.');
    }

    public function destroy(Instansi $instansi): RedirectResponse
    {
        $instansi->delete();

        return redirect()->route('instansi.index')->with('status', 'Instansi beserta riwayatnya telah dihapus.');
    }

    public function show(Instansi $instansi): Response
    {
        return Inertia::render('Instansi/Show', [
            'instansi' => $instansi->toRow(),
        ]);
    }
}
