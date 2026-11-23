<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aturan Projek

## Stack

- Next.js 16 (App Router), React 19
- Bahasa: JavaScript
- Runtime: Node.js v24.22.2
- Package manager: npm
- Testing: Vitest

## Struktur

app/ # route, layout, page, loading, error, not-found
app/api # api folder
components/ # komponen UI
lib/ # util, helper murni
hooks/ # custom hook
public/ # aset statis

## Gaya Kode

- Server Component default. `'use client'` hanya jika butuh state/event
- Formatter: Prettier, 2 spasi, single quote, trailing comma
- Lint: ESLint, zero warning
- Nama file: kebab-case. Nama fungsi: camelCase. Tipe/Class: PascalCase
- File maks 400 baris
- Jika 1 file punya potensi lebih dari 400 baris maka harus dibagi jadi beberapa file

## Dependensi

- Daftar dependensi di package.json
- Tanya dulu sebelum tambah dependency baru

## Keamanan

- Secret lewat env var, jangan hardcode
- Validasi semua input eksternal
- Jangan log data sensitif
- Jangan expose API key ke client

## Tugas utama

- Membuat kode sesuai perintah atau memeriksa kode

## Batasan

- Jangan menyerahkan apapun (saran, ide, rekomendasi)
- Jangan membuat style apapun
- Jangan membuat css custom
- Jangan menggunakan kelas tailwind
- Jangan menggunakan tag <table/>
- Tidak boleh buka file .env

## UI

- Mobile-first
- Gambar wajib menggunakan <Image .../> dari next/image dan punya `alt`
- Internal link wajib menggunakan <Link .../> dari next/link
- Eksternal link wajib menggunakan <a .../>
- Elemen interaktif wajib punya state focus dan disabled bila relevan
- Form wajib punya label yang terhubung
- Gaya breadcrumb harus mirip seperti ini <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / Edit Kelas

## Data

- Loading state + error state wajib ada
- Gunakan error boundary: app/error.js dan app/not-found.js

## Env

- File .env.example wajib ada, berisi nama variabel tanpa nilai
- .env.local tidak di-commit

## Git

- Saya (agent) hanya membuat laporan commit. User menangani branch/merge/release sendiri
- Laporan commit format: type(scope): ringkasan singkat

## Output

- Skrip harus exit code 0 saat sukses, non-zero saat gagal
- Error message jelas, tanpa stack trace ke user

## Penandaan Halaman

- Halaman tidak boleh ditandai selesai sebelum informasinya dimasukkan.
- Halaman kosong bukan berarti selesai dibuat.
