<!--
  PetunjukPenggunaan.vue — halaman "Petunjuk Penggunaan" ASI DARA (Bapperida Kab. Cirebon)

  Gaya: tutorial visual bertahap (mirip wikiHow) — bilah pencarian di atas, lencana "Bagian",
  gambar besar di atas tiap langkah, nomor langkah besar, poin rincian, dan sidebar kanan
  (daftar isi + kartu informasi). Dibangun dengan Tailwind CSS (lihat tailwind.config.js:
  utilitas dibatasi di #petunjuk-root sehingga menu lain tidak terpengaruh).

  Pemakaian (App.vue, section tab 'petunjuk'):
    <PetunjukPenggunaan @navigate="currentTab = $event" />

  Event:
    navigate(tabId) → minta App pindah menu: 'dashboard' | 'agentic-ai' | 'analyzer' | 'faq' | 'report'

  Mengganti gambar ilustrasi dengan tangkapan layar asli:
    Simpan berkas di public/images/petunjuk/ lalu isi field `img` pada langkah terkait, mis.
      img: '/images/petunjuk/b1-langkah1.png'
    Bila `img` terisi, gambar itu tampil menggantikan ilustrasi buatan dan ikut masuk ke PDF.

  Isi panduan mengikuti perilaku aplikasi saat ini (lihat komentar "Sumber" pada tiap Bagian).
  Bila perilaku berubah (mis. batas ukuran), ubah di konstanta RAW_PARTS dan kartu "Format dan batas berkas".
-->
<template>
  <div class="pt-page">
    <PageHero icon="book-open" title="Petunjuk Penggunaan" subtitle="Panduan langkah demi langkah" style="margin-bottom: 16px;" />
  <div id="petunjuk-root">
    <div class="mx-auto w-full font-body text-ink">
      <!-- ══ BILAH ATAS: judul, pencarian cepat, navigasi bagian ═══════════════ -->
      <header class="overflow-hidden rounded-xl border border-line bg-surface">
        <div class="pt-bar flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">

          <div class="relative order-3 w-full lg:order-none lg:w-auto lg:min-w-[280px] lg:flex-1">
            <label for="pt-search" class="sr-only">Cari panduan penggunaan</label>
            <Ico name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -mt-[9px] text-[#5B6169]" />
            <input
              id="pt-search"
              ref="searchEl"
              v-model="query"
              type="search"
              autocomplete="off"
              placeholder="Cari panduan penggunaan..."
              class="pt-search w-full rounded-lg bg-white py-2.5 pl-10 pr-10 text-[20.3px] text-[#1A1D21] placeholder:text-[#5B6169]"
              @keydown.esc="clearSearch"
              @keydown.enter.prevent="jumpToFirstMatch"
            />
            <button
              v-if="query"
              type="button"
              class="pt-focus absolute right-2 top-1/2 -mt-4 grid h-8 w-8 place-items-center rounded-md text-[#5B6169] hover:bg-[#F1F3F5]"
              aria-label="Hapus pencarian"
              @click="clearSearch"
            >
              <Ico name="x" :size="16" />
            </button>
          </div>

          <nav class="order-4 flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto" aria-label="Loncat ke bagian">
            <button
              v-for="p in PARTS"
              :key="p.id"
              type="button"
              class="pt-focus-light shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold"
              :class="activePartId === p.id ? 'bg-white text-[#1B4D46]' : 'text-white/85 hover:bg-white/15'"
              :aria-current="activePartId === p.id ? 'true' : undefined"
              @click="goTo(p.id)"
            >
              Bagian {{ p.no }}
            </button>
          </nav>
        </div>
      </header>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm text-ink-2">
        <p class="m-0 flex items-center gap-2">
          <span class="pt-hl-key inline-block h-3.5 w-3.5 shrink-0 rounded-sm"></span>
          Kotak jingga pada gambar menandai bagian yang perlu Anda klik atau periksa.
        </p>
        <p class="m-0" role="status" aria-live="polite">
          <template v-if="hasQuery">
            <strong class="text-ink">{{ matchCount }}</strong> langkah cocok dengan “{{ query.trim() }}”
          </template>
          <template v-else>{{ totalSteps }} langkah dalam {{ PARTS.length }} bagian</template>
        </p>
      </div>

      <!-- ══ GRID: isi panduan + sidebar ═════════════════════════════════════ -->
      <div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- ── Kolom utama ─────────────────────────────────────────────── -->
        <main class="min-w-0 space-y-6">
          <section
            v-for="part in visibleParts"
            :id="part.id"
            :key="part.id"
            class="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface"
            :aria-labelledby="part.id + '-judul'"
          >
            <!-- Judul bagian: lencana + judul + Unduh PDF -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-4 sm:px-6">
              <div class="pt-badge flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg">
                <span class="text-[15.5px] font-semibold leading-none">Bagian</span>
                <span class="mt-1 font-heading text-[35.4px] font-extrabold leading-none">{{ part.no }}</span>
              </div>
              <div class="min-w-0 flex-1 basis-60">
                <h3 :id="part.id + '-judul'" class="m-0 font-heading text-xl font-extrabold leading-snug text-ink sm:text-2xl">
                  {{ part.title }}
                </h3>
                <p class="m-0 mt-1 max-w-[68ch] text-sm leading-6 text-ink-2">{{ part.lead }}</p>
              </div>
              <button
                type="button"
                class="pt-focus inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-inset px-4 py-2.5 text-sm font-semibold text-ink hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
                :disabled="!!pdfBusy"
                :title="'Unduh Bagian ' + part.no + ' sebagai PDF'"
                @click="downloadPdf(part)"
              >
                <Ico name="file" :size="18" class="text-accent" />
                {{ pdfBusy === part.id ? 'Menyiapkan PDF...' : 'Unduh PDF' }}
              </button>
            </div>

            <!-- Langkah-langkah -->
            <ol class="m-0 list-none p-0">
              <li
                v-for="(s, i) in part.steps"
                :id="s.id"
                :key="s.id"
                data-step
                class="scroll-mt-24"
                :class="i > 0 ? 'border-t border-line' : ''"
              >
                <!-- Gambar / ilustrasi langkah -->
                <figure class="pt-media relative m-0 flex min-h-[240px] items-center justify-center px-4 pb-9 pt-8 sm:px-8" :aria-label="s.alt">
                  <img
                    v-if="s.img"
                    :src="s.img"
                    :alt="s.alt"
                    loading="lazy"
                    class="max-h-[440px] w-full max-w-[720px] rounded-lg border border-line bg-surface object-contain"
                  />
                  <template v-else>
                    <span class="sr-only">{{ s.alt }}</span>
                    <div :aria-hidden="s.visual === 'modes' ? undefined : 'true'" class="flex w-full justify-center">
                      <!-- 1.1 Main Dashboard visual -->
                      <div v-if="s.visual === 'main-dash'" class="pt-mock w-full max-w-[580px] space-y-3 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <span class="flex items-center gap-1.5 font-heading text-[17.6px] font-bold text-brand">
                            <Ico name="chart" :size="16" />Dasbor Utama ASI DARA
                          </span>
                          <span class="rounded-full bg-ok-soft px-2.5 py-0.5 text-[15.5px] font-semibold text-ok-ink">Sistem Normal</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div class="rounded-lg border border-line bg-surface p-2.5">
                            <p class="m-0 text-[15.5px] font-semibold text-ink-3">Model Gemini 2.5 Flash</p>
                            <p class="m-0 mt-1 flex items-center gap-1.5 font-bold text-ok-ink"><span class="h-2 w-2 rounded-full bg-ok"></span>Siap Digunakan</p>
                          </div>
                          <div class="rounded-lg border border-line bg-surface p-2.5">
                            <p class="m-0 text-[15.5px] font-semibold text-ink-3">Arsip Dokumen RKA</p>
                            <p class="m-0 mt-1 font-bold text-ink">42 Dokumen Tersimpan</p>
                          </div>
                        </div>
                        <div class="pt-hl flex items-center justify-between rounded-lg bg-brand p-3 text-white">
                          <div>
                            <p class="m-0 text-[17.6px] font-bold">Mulai Analisis Dokumen RKA</p>
                            <p class="m-0 text-[15.5px] opacity-85">Unggah RKA PDF dan dapatkan hasil evaluasi SROI otomatis</p>
                          </div>
                          <span class="shrink-0 rounded-md bg-white px-3 py-1.5 text-[15.5px] font-bold text-brand">Buka Menu</span>
                        </div>
                      </div>

                      <!-- 1.2 Format berkas -->
                      <div v-else-if="s.visual === 'files'" class="pt-mock w-full max-w-[480px] space-y-2 p-3 text-[16.3px]">
                        <p class="m-0 px-1 font-heading text-[17.6px] font-bold">Berkas yang Anda siapkan</p>
                        <div class="pt-hl flex items-center gap-3 rounded-md border border-line bg-ok-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[15.5px] font-extrabold text-bad-ink">PDF</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">RKA_Dinas_Kesehatan_Subkegiatan.pdf</p>
                            <p class="m-0 text-ink-3">2,4 MB, teks dapat diseleksi</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-ok-ink"><Ico name="check" :size="14" />Diterima</span>
                        </div>
                        <div class="flex items-center gap-3 rounded-md border border-line bg-bad-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[15.5px] font-extrabold text-ok-ink">XLS</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">Rincian_Belanja.xlsx</p>
                            <p class="m-0 text-ink-3">Bukan PDF</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-bad-ink"><Ico name="x" :size="14" />Ditolak</span>
                        </div>
                        <div class="flex items-center gap-3 rounded-md border border-line bg-bad-soft px-3 py-2">
                          <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-white text-[15.5px] font-extrabold text-ink-2">JPG</span>
                          <div class="min-w-0 flex-1">
                            <p class="m-0 truncate font-semibold">Foto_halaman_RKA.jpg</p>
                            <p class="m-0 text-ink-3">Foto atau hasil pindai tidak terbaca</p>
                          </div>
                          <span class="inline-flex shrink-0 items-center gap-1 font-semibold text-bad-ink"><Ico name="x" :size="14" />Ditolak</span>
                        </div>
                        <p class="m-0 px-1 pt-1 text-ink-3">Maksimal 100 MB per berkas</p>
                      </div>

                      <!-- 1.3 Menu + kotak unggah -->
                      <div v-else-if="s.visual === 'dropzone'" class="pt-mock flex w-full max-w-[580px] overflow-hidden text-[16.3px]">
                        <div class="hidden w-[150px] shrink-0 space-y-1 border-r border-line bg-inset p-2 sm:block">
                          <p class="pt-hl m-0 rounded-md bg-brand px-2 py-1.5 font-semibold text-white">Unggah Berkas RKA</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Beranda</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Hasil Analisis</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Simulasi Percakapan Agen AI</p>
                          <p class="m-0 px-2 py-1.5 text-ink-2">Arsip Dokumen RKA</p>
                        </div>
                        <div class="min-w-0 flex-1 p-3">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Unggah Dokumen RKA (PDF)</p>
                          <p class="m-0 mb-2 text-[15.5px] text-ink-3">Mendukung format RKA Rencana Kerja &amp; Anggaran SKPD Kabupaten Cirebon</p>
                          <div class="rounded-lg border-2 border-dashed border-line-strong bg-inset px-4 py-5 text-center">
                            <Ico name="upload" :size="26" class="mx-auto text-brand" />
                            <p class="m-0 mt-1 text-[17.6px] font-semibold">Pilih atau Tarik Berkas RKA PDF di Sini</p>
                            <p class="m-0 mb-3 text-ink-3">Dokumen akan diproses langsung di browser secara aman</p>
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Pilih Dokumen RKA</span>
                          </div>
                        </div>
                      </div>

                      <!-- 1.4 Antrean -->
                      <div v-else-if="s.visual === 'queue'" class="pt-mock w-full max-w-[480px] p-3 text-[16.3px]">
                        <p class="m-0 mb-3 text-center font-heading text-[17.6px] font-bold">Memproses Antrean Dokumen...</p>
                        <div class="space-y-2">
                          <div v-for="q in QUEUE_MOCK" :key="q.name" class="rounded-md border border-line bg-inset p-2.5">
                            <div class="mb-1.5 flex items-center justify-between gap-3">
                              <span class="min-w-0 truncate font-semibold">{{ q.name }}</span>
                              <span class="flex shrink-0 items-center gap-2 text-ink-3">
                                {{ q.status }}
                                <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[15.5px] font-bold text-brand">{{ q.pct }}%</span>
                              </span>
                            </div>
                            <div class="h-2 overflow-hidden rounded-full bg-line">
                              <div class="h-full rounded-full" :class="q.pct === 100 ? 'bg-ok' : 'bg-brand'" :style="{ width: q.pct + '%' }"></div>
                            </div>
                          </div>
                        </div>
                        <p class="pt-hl m-0 mt-3 rounded-md bg-warn-soft px-3 py-2 text-ink">
                          <strong>Jangan tutup halaman</strong> sampai semua berkas selesai.
                        </p>
                      </div>

                      <!-- 1.5 Edit OPD -->
                      <div v-else-if="s.visual === 'opd'" class="pt-mock w-full max-w-[480px] overflow-hidden text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line px-3 py-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Edit Manual Hasil Analisis</p>
                          <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[15.5px] font-semibold text-brand">Identitas &amp; Pagu</span>
                        </div>
                        <div class="space-y-3 p-3">
                          <div>
                            <p class="m-0 font-heading text-[17.6px] font-bold">Identitas &amp; Pagu Anggaran</p>
                            <p class="m-0 text-ink-3">Data pada kartu header halaman analisis.</p>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Perangkat Daerah (OPD)</p>
                            <div class="pt-hl rounded-md border border-line-strong bg-surface px-2.5 py-2">Dinas Kesehatan</div>
                            <p class="m-0 mt-1 text-[15.5px] text-ink-3">Terbaca otomatis dari dokumen. Ubah di sini bila keliru.</p>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Pagu Anggaran (Rp)</p>
                            <div class="rounded-md border border-line-strong bg-surface px-2.5 py-2">250000000</div>
                          </div>
                        </div>
                        <div class="flex justify-end gap-2 border-t border-line bg-inset px-3 py-2">
                          <span class="rounded-md border border-line-strong px-3 py-1.5 font-semibold text-ink-2">Batal</span>
                          <span class="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Ringkasan &amp; Simpan</span>
                        </div>
                      </div>

                      <!-- 2.1 Integrasi Arsip Dokumen CBB Chatbot -->
                      <div v-else-if="s.visual === 'cbb-archive'" class="pt-mock w-full max-w-[600px] p-3 text-[16.3px] space-y-2.5">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                          <span class="flex items-center gap-1.5 font-heading text-[17.6px] font-bold text-brand">
                            <Ico name="chat" :size="15" />Simulasi Percakapan Agen AI
                          </span>
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 font-semibold text-ok-ink">
                            <span class="h-1.5 w-1.5 rounded-full bg-ok"></span>Asisten AI Siap
                          </span>
                        </div>
                        <div class="rounded-lg border border-line bg-inset p-2.5">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="font-bold text-ink">📁 Integrasi Arsip Analisis ASI DARA</span>
                            <span class="text-[15.5px] text-ink-3">Pilih dokumen arsip untuk ditanyakan</span>
                          </div>
                          <div class="pt-hl mt-2 flex items-center justify-between rounded-md border border-brand bg-surface px-3 py-1.5">
                            <span class="truncate font-semibold text-ink">Penyusunan Perencanaan RKA (Dinas Kesehatan) — Nilai Prakiraan Dampak: 1,24</span>
                            <span class="text-ink-3">▾</span>
                          </div>
                        </div>
                        <div class="rounded-lg border-l-4 border-l-brand bg-brand-soft p-2.5 space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-brand">📌 Arsip Ditanyakan: Dinas Kesehatan (Pagu: Rp 250 Jt)</span>
                            <span class="rounded bg-ok px-2 py-0.5 text-[15.5px] font-extrabold text-white">Layak (1,24 : 1)</span>
                          </div>
                          <div class="flex flex-wrap gap-1.5 pt-1">
                            <span class="pt-hl rounded-full border border-brand bg-surface px-2.5 py-1 text-[15.5px] font-semibold text-brand">💡 Mengapa Rasio 1,24?</span>
                            <span class="rounded-full border border-line bg-surface px-2.5 py-1 text-[15.5px] font-semibold text-ink-2">⚖️ Rincian 5 Faktor Penyesuaian</span>
                            <span class="rounded-full border border-line bg-surface px-2.5 py-1 text-[15.5px] font-semibold text-ink-2">📝 Rekomendasi Strategis AI</span>
                          </div>
                        </div>
                      </div>

                      <!-- 2.2 Kalkulasi Kinerja Real-time CBB Chatbot -->
                      <div v-else-if="s.visual === 'cbb-calc'" class="pt-mock w-full max-w-[580px] p-3 text-[16.3px] space-y-2.5">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Kalkulasi Anggaran &amp; Valuasi SROI</p>
                          <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[15.5px] font-bold text-brand">Perhitungan Otomatis</span>
                        </div>
                        <div class="space-y-2">
                          <div class="flex justify-end">
                            <div class="max-w-[85%] rounded-lg rounded-tr-none bg-brand px-3 py-2 text-white">
                              Hitung SROI investasi 250jt manfaat sosial 310jt
                            </div>
                          </div>
                          <div class="flex">
                            <div class="max-w-[90%] rounded-lg rounded-tl-none border border-line bg-surface p-3 space-y-2">
                              <div class="flex items-center justify-between gap-2">
                                <span class="font-bold text-brand">🏛️ Asisten Bapperida</span>
                                <span class="rounded-full bg-ok-soft px-2 py-0.5 text-[15.5px] font-extrabold text-ok-ink">Rasio SROI Layak 🎉</span>
                              </div>
                              <div class="pt-hl rounded-md bg-inset p-2 font-mono text-[15.5px] text-brand">
                                SROI = Nilai Sekarang Dampak Bersih / Nilai Input Pagu
                              </div>
                              <div class="grid grid-cols-3 gap-1.5 text-center">
                                <div class="rounded border border-line bg-inset p-1.5">
                                  <p class="m-0 text-[15.5px] text-ink-3">Input Pagu</p>
                                  <p class="m-0 font-bold">250 Jt</p>
                                </div>
                                <div class="rounded border border-line bg-inset p-1.5">
                                  <p class="m-0 text-[15.5px] text-ink-3">Dampak Bersih</p>
                                  <p class="m-0 font-bold">310 Jt</p>
                                </div>
                                <div class="rounded border border-line bg-ok-soft p-1.5">
                                  <p class="m-0 text-[15.5px] text-ok-ink font-semibold">Rasio SROI</p>
                                  <p class="m-0 font-extrabold text-ok-ink">1,24 : 1</p>
                                </div>
                              </div>
                              <p class="m-0 text-[15.5px] text-ink-2">Hasil: Setiap Rp1 alokasi APBD menghasilkan estimasi nilai kemanfaatan sosial sebesar Rp1,24.</p>
                            </div>
                          </div>
                        </div>
                      </div>



                      <!-- 2.3 Konsultasi Regulasi & Perencanaan Daerah CBB Chatbot -->
                      <div v-else-if="s.visual === 'cbb-chat'" class="pt-mock w-full max-w-[580px] overflow-hidden text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line bg-inset px-3 py-2">
                          <span class="font-heading text-[17.6px] font-bold">Konsultasi Regulasi &amp; Perencanaan Daerah</span>
                          <span class="inline-flex items-center gap-1 text-[15.5px] text-ink-3"><Ico name="trash" :size="12" />Bersihkan Chat</span>
                        </div>
                        <div class="space-y-2.5 bg-inset p-3">
                          <div class="flex justify-end">
                            <div class="max-w-[80%] rounded-lg rounded-tr-none bg-brand px-3 py-2 text-white">
                              Apa perbedaan mendasar dokumen RPJMD dengan RKPD?
                            </div>
                          </div>
                          <div class="flex">
                            <div class="max-w-[85%] rounded-lg rounded-tl-none border border-line bg-surface p-2.5 text-ink-2 space-y-1">
                              <p class="m-0 font-bold text-brand">🏛️ Asisten Bapperida</p>
                              <p class="m-0 leading-relaxed text-[15.5px]"><strong>RPJMD</strong> berjangka 5 tahunan memuat visi-misi Kepala Daerah, sedangkan <strong>RKPD</strong> adalah dokumen tahunan operasional yang menjadi dasar KUA-PPAS &amp; RKA SKPD.</p>
                              <div class="flex justify-end pt-1">
                                <span class="pt-hl inline-flex items-center gap-1 text-[15.5px] font-semibold text-ink-3"><Ico name="copy" :size="12" />Salin Jawaban</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="border-t border-line bg-inset px-3 py-2">
                          <p class="m-0 mb-1.5 text-[15.5px] font-bold uppercase text-ink-3">Pertanyaan Cepat:</p>
                          <div class="flex flex-wrap gap-1">
                            <span class="rounded-full border border-line bg-surface px-2 py-0.5 text-[15.5px] font-medium text-ink-2">Alur Musrenbang</span>
                            <span class="rounded-full border border-line bg-surface px-2 py-0.5 text-[15.5px] font-medium text-ink-2">Aturan SBM/SSH</span>
                            <span class="rounded-full border border-line bg-surface px-2 py-0.5 text-[15.5px] font-medium text-ink-2">Hitung Pertumbuhan PDRB</span>
                          </div>
                        </div>
                      </div>

                      <!-- 3.1 Bilah atas Hasil Analisis -->
                      <div v-else-if="s.visual === 'header'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[16.3px]">
                        <div class="flex flex-wrap items-center gap-2">
                          <Ico name="trend" :size="20" class="shrink-0 text-brand" />
                          <p class="m-0 font-heading text-[17.6px] font-bold">Analisis Valuasi Prakiraan Dampak Program</p>
                          <span class="pt-hl ml-auto inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1">
                            <span class="text-ink-3">Versi:</span><span class="font-semibold">Versi 2</span>
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-brand bg-brand-soft px-3 py-1.5 font-semibold text-brand"><Ico name="pencil" :size="13" />Edit Manual</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Edit dengan AI</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Unggah Ulang PDF</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2"><Ico name="download" :size="13" />Unduh Laporan</span>
                          <span class="inline-flex items-center gap-1.5 rounded-md bg-bad px-3 py-1.5 font-semibold text-white"><Ico name="trash" :size="13" />Hapus</span>
                        </div>
                      </div>

                      <!-- 3.2 Kartu identitas + pagu -->
                      <div v-else-if="s.visual === 'hero'" class="pt-mock w-full max-w-[600px] p-4 text-[16.3px]">
                        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                          <div class="sm:col-span-2">
                            <p class="pt-field-label m-0">Subkeg</p>
                            <p class="m-0 mt-0.5 font-semibold">Penyusunan Dokumen Perencanaan Perangkat Daerah</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Perangkat Daerah</p>
                            <p class="m-0 mt-0.5 font-semibold">Dinas Kesehatan</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Tahun Anggaran</p>
                            <p class="m-0 mt-0.5 font-semibold">
                              Tahun 2026
                              <span class="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-[15.5px] font-bold text-brand">Tahun berjalan</span>
                            </p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Program</p>
                            <p class="m-0 mt-0.5">Program Penunjang Urusan Pemerintahan Daerah Kabupaten/Kota</p>
                          </div>
                          <div>
                            <p class="pt-field-label m-0">Kegiatan</p>
                            <p class="m-0 mt-0.5">Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah</p>
                          </div>
                          <div class="pt-hl rounded-md bg-inset px-3 py-2 sm:col-span-2">
                            <p class="pt-field-label m-0">Pagu Anggaran</p>
                            <p class="m-0 mt-0.5 font-heading text-[25.3px] font-extrabold text-brand">Rp 250.000.000</p>
                          </div>
                        </div>
                      </div>

                      <!-- 3.3 Indikator + kesesuaian -->
                      <div v-else-if="s.visual === 'indikator'" class="pt-mock grid w-full max-w-[640px] gap-0 overflow-hidden text-[16.3px] sm:grid-cols-2">
                        <div class="space-y-2 border-b border-line p-3 sm:border-b-0 sm:border-r">
                          <p class="m-0 font-heading text-[16.3px] font-bold">Target Kinerja per Indikator</p>
                          <div v-for="k in INDIKATOR_MOCK" :key="k.nama" class="rounded-md border border-line bg-inset p-2">
                            <div class="flex items-center justify-between gap-2">
                              <span class="rounded bg-brand-soft px-1.5 py-0.5 text-[15.5px] font-bold text-brand">{{ k.level }}</span>
                              <span class="font-bold">{{ k.target }}</span>
                            </div>
                            <p class="m-0 mt-1 leading-snug text-ink-2">{{ k.nama }}</p>
                          </div>
                        </div>
                        <div class="space-y-2 p-3">
                          <p class="m-0 font-heading text-[16.3px] font-bold">Kesesuaian Anggaran Tahun 2026 dengan Target Kinerja</p>
                          <span class="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 font-semibold text-ok-ink"><Ico name="check" :size="12" />Sesuai</span>
                          <div class="pt-hl rounded-md border border-line bg-surface p-2">
                            <p class="m-0 font-semibold">Apakah anggaran ini akan menyentuh target?</p>
                            <p class="m-0 mt-1 text-ink-2">Ya. Pagu sebanding dengan target output yang dicanangkan.</p>
                          </div>
                        </div>
                      </div>

                      <!-- 3.4 Rasio Nilai Prakiraan Dampak -->
                      <div v-else-if="s.visual === 'sroi'" class="pt-mock w-full max-w-[560px] space-y-3 p-3 text-[16.3px]">
                        <div class="rounded-lg border border-line bg-ok-soft p-3">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="font-semibold text-ink-2">Rasio Nilai Prakiraan Dampak</span>
                            <span class="rounded-full bg-white px-2.5 py-0.5 text-[15.5px] font-bold text-ok-ink">Layak</span>
                          </div>
                          <p class="pt-hl m-0 mt-1.5 inline-block px-1.5 py-0.5 font-heading text-[43px] font-extrabold leading-none text-ink">1,24</p>
                          <p class="m-0 mt-1 text-ink-2">Setiap Rp1 investasi menghasilkan Rp1,24 nilai sosial.</p>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div v-for="c in SROI_CARDS" :key="c.label" class="rounded-md border border-line bg-inset px-2.5 py-2">
                            <p class="m-0 text-[15.5px] text-ink-3">{{ c.label }}</p>
                            <p class="m-0 font-bold">{{ c.value }}</p>
                          </div>
                        </div>
                        <div>
                          <div class="flex h-2.5 overflow-hidden rounded-full">
                            <span class="w-[30%] bg-bad"></span>
                            <span class="w-[30%] bg-warn"></span>
                            <span class="flex-1 bg-ok"></span>
                          </div>
                          <div class="mt-1 flex text-[15.5px] text-ink-2">
                            <span class="w-[30%]">Kurang (di bawah 0,6)</span>
                            <span class="w-[30%]">Cukup (0,6 sampai 0,99)</span>
                            <span class="flex-1 text-right">Layak (1,0 ke atas)</span>
                          </div>
                        </div>
                      </div>

                      <!-- 3.5 Komponen belanja -->
                      <div v-else-if="s.visual === 'belanja'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[16.3px]">
                        <div class="grid grid-cols-2 gap-3">
                          <div class="flex items-center gap-3 rounded-md border border-line bg-inset p-2.5">
                            <span class="pt-donut" style="background: conic-gradient(var(--primary-color) 0 46%, var(--info-color) 46% 72%, var(--accent-color) 72% 90%, var(--warning-color) 90% 100%)"></span>
                            <span class="font-semibold leading-snug">Komposisi belanja saat ini</span>
                          </div>
                          <div class="flex items-center gap-3 rounded-md border border-line bg-inset p-2.5">
                            <span class="pt-donut" style="background: conic-gradient(var(--primary-color) 0 34%, var(--info-color) 34% 68%, var(--accent-color) 68% 88%, var(--warning-color) 88% 100%)"></span>
                            <span class="font-semibold leading-snug">Setelah rekomendasi belanja</span>
                          </div>
                        </div>
                        <div class="overflow-hidden rounded-md border border-line">
                          <div class="grid grid-cols-[1fr_auto_auto] gap-x-3 bg-inset px-3 py-1.5 text-[15.5px] font-semibold text-ink-3">
                            <span>Rekening belanja</span><span class="text-right">Alokasi</span><span class="text-right">Dikurangi</span>
                          </div>
                          <div v-for="r in BELANJA_MOCK" :key="r.nama" class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-line px-3 py-2">
                            <span class="min-w-0">
                              <span class="block truncate font-semibold">{{ r.nama }}</span>
                              <span
                                class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[15.5px] font-bold"
                                :class="r.efisien ? 'bg-ok-soft text-ok-ink' : 'bg-bad-soft text-bad-ink'"
                              >{{ r.efisien ? 'Efisien' : 'Inefisien' }}</span>
                            </span>
                            <span class="text-right">{{ r.alokasi }}</span>
                            <span class="text-right font-semibold" :class="r.efisien ? 'text-ink-3' : 'text-bad-ink'">{{ r.kurang }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 3.6 Edit Modal & AI visual -->
                      <div v-else-if="s.visual === 'edit-modal'" class="pt-mock w-full max-w-[560px] overflow-hidden text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line bg-inset px-3 py-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Modal Perbaikan &amp; Edit Analysis</p>
                          <span class="rounded-md bg-brand-soft px-2 py-0.5 text-[15.5px] font-bold text-brand">Edit Manual / AI</span>
                        </div>
                        <div class="space-y-2.5 p-3">
                          <div class="flex flex-wrap gap-1.5">
                            <span class="pt-hl rounded-md bg-brand px-2.5 py-1 font-semibold text-white">Identitas &amp; Pagu</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Indikator Kinerja</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Komponen Belanja</span>
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Parameter SROI</span>
                          </div>
                          <div class="space-y-2 rounded-md border border-line bg-surface p-2.5">
                            <div>
                              <span class="block text-[15.5px] font-semibold text-ink-3">Nama Perangkat Daerah (OPD)</span>
                              <div class="pt-hl rounded border border-line bg-inset px-2 py-1 font-semibold text-ink">Dinas Kesehatan Kab. Cirebon</div>
                            </div>
                            <div>
                              <span class="block text-[15.5px] font-semibold text-ink-3">Pagu Anggaran Subkegiatan (Rp)</span>
                              <div class="rounded border border-line bg-inset px-2 py-1 font-semibold text-ink">250.000.000</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 3.7 Unduh & ekspor -->
                      <div v-else-if="s.visual === 'export'" class="pt-mock w-full max-w-[540px] space-y-3 p-3 text-[16.3px]">
                        <div>
                          <p class="m-0 mb-1.5 font-semibold text-ink-3">Di halaman Hasil Analisis</p>
                          <div class="flex flex-wrap items-center gap-3">
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold"><Ico name="download" :size="13" />Unduh Laporan</span>
                            <Ico name="arrow" :size="16" class="text-ink-3" />
                            <span class="inline-flex min-w-0 items-center gap-2 rounded-md border border-line bg-inset px-3 py-1.5">
                              <Ico name="file" :size="14" class="shrink-0 text-accent" />
                              <span class="truncate">Hasil_Analisis_SROI_Dinas_Kesehatan.html</span>
                            </span>
                          </div>
                        </div>
                        <div class="border-t border-line pt-3">
                          <p class="m-0 mb-1.5 font-semibold text-ink-3">Di halaman Arsip Dokumen RKA</p>
                          <div class="flex flex-wrap gap-2">
                            <span class="pt-hl inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-white"><Ico name="download" :size="13" />Ekspor Full Database (JSON)</span>
                            <span class="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 font-semibold text-ink-2">Backup &amp; Pemulihan</span>
                          </div>
                        </div>
                      </div>

                      <!-- 4.1 Visual Arsip Dokumen & Seleksi Massal -->
                      <div v-else-if="s.visual === 'archive'" class="pt-mock w-full max-w-[620px] overflow-hidden p-3 text-[16.3px] space-y-2.5">
                        <div class="flex items-center justify-between gap-2 border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Arsip Dokumen RKA SKPD</p>
                          <div class="flex items-center gap-2">
                            <span class="rounded bg-brand px-2 py-0.5 text-[15.5px] font-bold text-white">42 Dokumen</span>
                          </div>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <div class="pt-hl flex min-w-[200px] flex-1 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-ink-3">
                            <Ico name="search" :size="13" /><span>Cari dokumen, OPD, ID...</span>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <span class="pt-hl inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[15.5px] font-bold text-white"><Ico name="refresh" :size="12" />Muat Ulang Semua (42)</span>
                            <span class="rounded-md border border-bad bg-bad-soft px-2 py-1 text-[15.5px] font-bold text-bad-ink">Hapus Semua</span>
                          </div>
                        </div>
                        <div class="grid gap-2 sm:grid-cols-3">
                          <div v-for="f in [['OPD','Semua OPD'],['Tahun','Semua Tahun'],['Urutkan','Tanggal (terbaru)']]" :key="f[0]">
                            <p class="m-0 mb-0.5 text-[15.5px] font-bold uppercase text-ink-3">{{ f[0] }}</p>
                            <div class="flex items-center justify-between rounded-md border border-line bg-surface px-2 py-1 text-ink-2"><span class="truncate">{{ f[1] }}</span><span aria-hidden="true">▾</span></div>
                          </div>
                        </div>
                        <div class="overflow-hidden rounded-md border border-line">
                          <div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 bg-inset px-2.5 py-1.5 text-[15.5px] font-bold text-ink-3">
                            <input type="checkbox" checked class="h-3.5 w-3.5" />
                            <span>Nama Dokumen / Subkeg</span>
                            <span>OPD</span>
                            <span>SROI</span>
                            <span>Aksi</span>
                          </div>
                          <div class="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 border-t border-line bg-surface px-2.5 py-2">
                            <input type="checkbox" checked class="h-3.5 w-3.5" />
                            <div class="min-w-0">
                              <p class="m-0 truncate font-bold text-ink">Penyusunan RKA Diskes</p>
                              <p class="m-0 text-[15.5px] text-ink-3">Pagu: Rp 250 Jt • 2026</p>
                            </div>
                            <span class="truncate text-ink-2">Dinkes</span>
                            <span class="rounded bg-ok-soft px-1.5 py-0.5 font-bold text-ok-ink">1,24</span>
                            <div class="flex gap-1">
                              <span class="pt-hl rounded bg-brand px-2 py-0.5 text-[15.5px] font-bold text-white">Lihat</span>
                              <span class="rounded border border-line bg-inset px-1.5 py-0.5 text-[15.5px]"><Ico name="refresh" :size="10" /></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 4.2 Visual Tab Sampah (Trash) -->
                      <div v-else-if="s.visual === 'trash'" class="pt-mock w-full max-w-[600px] overflow-hidden p-3 text-[16.3px] space-y-2.5">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <div class="flex gap-1">
                            <span class="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">Arsip Aktif (42)</span>
                            <span class="pt-hl rounded-md bg-bad px-2.5 py-1 font-bold text-white">Sampah (3)</span>
                          </div>
                          <span class="rounded border border-bad bg-bad-soft px-2 py-0.5 text-[15.5px] font-bold text-bad-ink">Kosongkan Sampah</span>
                        </div>
                        <p class="m-0 text-[15.5px] text-ink-3">Dokumen yang dihapus tersimpan di sini dan dapat dipulihkan atau dihapus permanen.</p>
                        <div class="overflow-hidden rounded-md border border-line">
                          <div class="grid grid-cols-[1fr_auto_auto] items-center gap-2 bg-inset px-3 py-1.5 text-[15.5px] font-bold text-ink-3">
                            <span>Dokumen Dihapus</span><span>Dihapus Pada</span><span>Aksi</span>
                          </div>
                          <div class="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-line bg-surface px-3 py-2">
                            <div>
                              <p class="m-0 font-bold text-ink">RKA_Dinas_Pertanian_2026.pdf</p>
                              <p class="m-0 text-[15.5px] text-ink-3">Dinas Pertanian • Rp 180 Jt</p>
                            </div>
                            <span class="text-[15.5px] text-ink-3">15 Okt 2026</span>
                            <div class="flex gap-1.5">
                              <span class="pt-hl rounded bg-brand px-2 py-1 text-[15.5px] font-bold text-white">Pulihkan</span>
                              <span class="rounded bg-bad px-2 py-1 text-[15.5px] font-bold text-white">Hapus Permanen</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 4.2 Form Laporan -->
                      <div v-else-if="s.visual === 'report-form'" class="pt-mock w-full max-w-[520px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Formulir Laporan Kendala Pengguna</p>
                          <p class="m-0 text-[15.5px] text-ink-3">Kirim masukan atau bantuan jika menu tertentu nonaktif</p>
                        </div>
                        <div class="space-y-2">
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Subjek Kendala</p>
                            <div class="rounded border border-line bg-surface px-2.5 py-1.5 text-ink-2">Permohonan Pengaktifan Menu Unggah RKA</div>
                          </div>
                          <div>
                            <p class="m-0 mb-1 font-semibold text-ink-2">Rincian Laporan</p>
                            <div class="pt-hl rounded border border-line bg-surface px-2.5 py-2 text-ink-3">Mohon aktifkan kembali menu Unggah RKA untuk evaluasi RKA Diskes...</div>
                          </div>
                          <span class="pt-hl inline-block rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Kirim Laporan ke Admin</span>
                        </div>
                      </div>

                      <!-- 5.1 Admin Stats -->
                      <div v-else-if="s.visual === 'admin-stats'" class="pt-mock w-full max-w-[600px] space-y-3 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <span class="flex items-center gap-1.5 font-heading text-[17.6px] font-bold text-brand">
                            <Ico name="shield" :size="16" />Dasbor Admin &amp; Monitoring Server
                          </span>
                          <span class="rounded-full bg-brand-soft px-2.5 py-0.5 text-[15.5px] font-extrabold text-brand">Role: Admin</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[15.5px] font-semibold text-ink-3">Total User</p>
                            <p class="m-0 font-bold text-[19px]">18 User</p>
                          </div>
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[15.5px] font-semibold text-ink-3">Penyimpanan DB</p>
                            <p class="m-0 font-bold text-[19px] text-ok-ink">42% (Normal)</p>
                          </div>
                          <div class="rounded-md border border-line bg-surface p-2">
                            <p class="m-0 text-[15.5px] font-semibold text-ink-3">Ambang Rotasi</p>
                            <p class="m-0 font-bold text-[19px] text-warn-ink">85% Limit</p>
                          </div>
                        </div>
                        <div class="rounded-md border border-line bg-inset p-2">
                          <div class="mb-1 flex justify-between text-[15.5px] font-semibold">
                            <span>Status Kapasitas Storage Failover</span>
                            <span class="font-bold text-ok-ink">2.1 GB / 5.0 GB</span>
                          </div>
                          <div class="h-2 overflow-hidden rounded-full bg-line">
                            <div class="h-full w-[42%] bg-brand"></div>
                          </div>
                        </div>
                      </div>

                      <!-- 5.2 Admin Users -->
                      <div v-else-if="s.visual === 'admin-users'" class="pt-mock w-full max-w-[560px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Manajemen Akun &amp; Role Pengguna</p>
                          <span class="pt-hl rounded bg-brand px-2 py-1 text-[15.5px] font-semibold text-white">+ Tambah User</span>
                        </div>
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div>
                              <p class="m-0 font-bold">admin_bapperida <span class="rounded bg-brand-soft px-1.5 py-0.5 text-[15.5px] font-extrabold text-brand">Admin</span></p>
                              <p class="m-0 text-[15.5px] text-ink-3">Akses penuh sistem &amp; audit</p>
                            </div>
                            <span class="rounded-full bg-ok-soft px-2 py-0.5 text-[15.5px] font-bold text-ok-ink">Aktif</span>
                          </div>
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div>
                              <p class="m-0 font-bold">evaluator_diskes <span class="rounded border border-line bg-inset px-1.5 py-0.5 text-[15.5px] font-bold text-ink-2">User</span></p>
                              <p class="m-0 text-[15.5px] text-ink-3">Operator OPD Dinas Kesehatan</p>
                            </div>
                            <span class="rounded-full bg-ok-soft px-2 py-0.5 text-[15.5px] font-bold text-ok-ink">Aktif</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.3 Admin Menu Toggle -->
                      <div v-else-if="s.visual === 'admin-menu'" class="pt-mock w-full max-w-[540px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Kontrol Sakelar Akses Menu Global</p>
                          <p class="m-0 text-[15.5px] text-ink-3">Aktifkan atau batasi fitur aplikasi untuk role biasa</p>
                        </div>
                        <div class="space-y-2">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <span class="font-semibold">Unggah Berkas RKA</span>
                            <span class="pt-hl rounded-full bg-brand px-3 py-1 text-[15.5px] font-extrabold text-white">Aktif</span>
                          </div>
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <span class="font-semibold text-ink-3">Simulasi Percakapan Agen AI</span>
                            <span class="rounded-full bg-bad-soft px-3 py-1 text-[15.5px] font-extrabold text-bad-ink">Nonaktif</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.4 Admin API Pool -->
                      <div v-else-if="s.visual === 'admin-api' || s.visual === 'admin-config'" class="pt-mock w-full max-w-[580px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <div>
                            <p class="m-0 font-heading text-[17.6px] font-bold">Pool Manajemen Kunci API (Gemini &amp; OpenAI)</p>
                            <p class="m-0 text-[15.5px] text-ink-3">Rotasi otomatis antar-kunci untuk menghindari kuota habis (rate-limit)</p>
                          </div>
                          <div class="flex gap-1">
                            <span class="pt-hl rounded bg-brand px-2 py-0.5 text-[15.5px] font-bold text-white">+ Tambah</span>
                            <span class="rounded border border-line bg-inset px-2 py-0.5 text-[15.5px] font-semibold text-ink-2">Batch Import</span>
                          </div>
                        </div>
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div class="min-w-0">
                              <div class="flex items-center gap-1.5">
                                <span class="font-bold text-ink">Gemini 2.5 Flash Utama</span>
                                <span class="rounded bg-accent-soft px-1.5 py-0.2 text-[15.5px] font-bold text-accent-ink">Utama</span>
                                <span class="rounded bg-ok-soft px-1.5 py-0.2 text-[15.5px] font-bold text-ok-ink">Aktif</span>
                              </div>
                              <p class="m-0 font-mono text-[15.5px] text-ink-3 truncate">AIzaSyB3X...9Kq8P (Google AI Studio)</p>
                            </div>
                            <span class="rounded border border-line bg-inset px-2 py-1 text-[15.5px] text-ink-2">Salin</span>
                          </div>
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div class="min-w-0">
                              <div class="flex items-center gap-1.5">
                                <span class="font-bold text-ink">OpenAI GPT-4o Cadangan</span>
                                <span class="rounded bg-ok-soft px-1.5 py-0.2 text-[15.5px] font-bold text-ok-ink">Aktif</span>
                              </div>
                              <p class="m-0 font-mono text-[15.5px] text-ink-3 truncate">sk-proj-7mN...v8Xz1 (OpenAI Pool)</p>
                            </div>
                            <span class="rounded border border-line bg-inset px-2 py-1 text-[15.5px] text-ink-2">Jadikan Utama</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.5 Admin Logs SSE -->
                      <div v-else-if="s.visual === 'admin-logs'" class="pt-mock w-full max-w-[580px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <div class="flex items-center gap-2">
                            <span class="flex h-2 w-2 rounded-full bg-ok animate-pulse"></span>
                            <p class="m-0 font-heading text-[17.6px] font-bold">Log Aktivitas Server (SSE Real-time)</p>
                          </div>
                          <span class="text-[15.5px] text-ink-3">Live Stream Terhubung</span>
                        </div>
                        <div class="space-y-1 font-mono text-[15.5px]">
                          <div class="flex items-center justify-between rounded bg-surface p-1.5 border border-line">
                            <span class="text-ok-ink font-bold">[LOGIN] user 'evaluator_diskes'</span>
                            <span class="text-ink-3 text-[15.5px]">192.168.1.42 • 10:14:02</span>
                          </div>
                          <div class="flex items-center justify-between rounded bg-surface p-1.5 border border-line">
                            <span class="text-brand font-bold">[UPDATE] doc 'RKA_Diskes_2026' (Edit AI)</span>
                            <span class="text-ink-3 text-[15.5px]">admin • 10:12:15</span>
                          </div>
                          <div class="flex items-center justify-between rounded bg-surface p-1.5 border border-line">
                            <span class="text-warn-ink font-bold">[TRASH] doc 'RKA_Pertanian' dipindah</span>
                            <span class="text-ink-3 text-[15.5px]">admin • 09:58:30</span>
                          </div>
                        </div>
                      </div>

                      <!-- 5.6 Admin Backup & Snapshot -->
                      <div v-else-if="s.visual === 'admin-backup'" class="pt-mock w-full max-w-[580px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <p class="m-0 font-heading text-[17.6px] font-bold">Pencadangan, Snapshot &amp; Pemulihan</p>
                          <span class="pt-hl rounded bg-brand px-2.5 py-1 text-[15.5px] font-bold text-white">Buat Snapshot Manual</span>
                        </div>
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between rounded border border-line bg-surface p-2">
                            <div>
                              <p class="m-0 font-bold text-ink">Snapshot_Otomatis_Harian.json</p>
                              <p class="m-0 text-[15.5px] text-ink-3">Ukuran: 4.2 MB • 42 Dokumen RKA • 15 Okt 2026</p>
                            </div>
                            <div class="flex gap-1">
                              <span class="pt-hl rounded bg-ok px-2 py-0.5 text-[15.5px] font-bold text-white">Pulihkan</span>
                              <span class="rounded border border-line bg-inset px-2 py-0.5 text-[15.5px] text-ink-2">Unduh</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 5.7 Admin Reports Inbox -->
                      <div v-else-if="s.visual === 'admin-reports'" class="pt-mock w-full max-w-[580px] space-y-2.5 p-3 text-[16.3px]">
                        <div class="flex items-center justify-between border-b border-line pb-2">
                          <div>
                            <p class="m-0 font-heading text-[17.6px] font-bold">Kotak Masuk Laporan Kendala Pengguna</p>
                            <p class="m-0 text-[15.5px] text-ink-3">Tanggapi laporan langsung lewat tautan resmi WhatsApp</p>
                          </div>
                          <span class="rounded-full bg-warn-soft px-2 py-0.5 text-[15.5px] font-bold text-warn-ink">2 Laporan Baru</span>
                        </div>
                        <div class="rounded border border-line bg-surface p-2 space-y-1.5">
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-ink">Permohonan Pengaktifan Menu Unggah RKA</span>
                            <span class="rounded bg-accent-soft px-1.5 py-0.2 text-[15.5px] font-bold text-accent-ink">Kendala Fitur</span>
                          </div>
                          <p class="m-0 text-[15.5px] text-ink-2">Pelapor: Hj. Siti Nurjanah (Dinkes) • 0812-3456-7890</p>
                          <div class="flex items-center justify-between pt-1 border-t border-line">
                            <span class="text-[15.5px] text-ink-3">Lampiran: 1 Screenshot Bukti</span>
                            <span class="pt-hl inline-flex items-center gap-1 rounded bg-[#25D366] px-2.5 py-1 text-[15.5px] font-bold text-white">
                              Balas via WhatsApp
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <figcaption class="absolute bottom-2 right-3 text-[15.5px] font-semibold text-ink-3">{{ s.caption }}</figcaption>
                </figure>

                <!-- Nomor besar + judul langkah + rincian -->
                <div class="flex gap-3 px-4 py-6 sm:gap-5 sm:px-6">
                  <span class="w-10 shrink-0 font-heading text-[4.111rem] font-extrabold leading-[0.9] text-brand sm:w-14 sm:text-[4.743rem]" aria-hidden="true">{{ s.no }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="m-0 max-w-[68ch] text-[21.5px] font-normal leading-7 text-ink-2">
                      <strong class="font-bold text-ink" v-html="rich(s.title)"></strong>
                      <span v-html="' ' + rich(s.text)"></span>
                    </p>
                    <ul class="m-0 mt-3 max-w-[68ch] list-disc space-y-2 pl-5 text-[20.3px] leading-7 text-ink-2 marker:text-accent">
                      <li v-for="(b, bi) in s.bullets" :key="bi" class="pl-1" v-html="rich(b)"></li>
                    </ul>
                  </div>
                </div>
              </li>
            </ol>

            <!-- Penutup bagian -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-inset px-4 py-4 sm:px-6">
              <button
                type="button"
                class="pt-focus inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                @click="emit('navigate', part.cta.tab)"
              >
                {{ part.cta.label }}
              </button>
              <button
                v-if="part.next && !hasQuery"
                type="button"
                class="pt-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
                @click="goTo(part.next)"
              >
                Lanjut ke Bagian {{ part.no + 1 }}
                <Ico name="arrow" :size="16" />
              </button>
            </div>
          </section>

          <!-- Hasil pencarian kosong -->
          <section v-if="hasQuery && !visibleParts.length" class="rounded-xl border border-line bg-surface px-6 py-12 text-center">
            <Ico name="search" :size="32" class="mx-auto text-ink-3" />
            <h3 class="m-0 mt-3 font-heading text-xl font-extrabold">Tidak ada langkah yang cocok</h3>
            <p class="m-0 mx-auto mt-2 max-w-[46ch] text-[20.3px] leading-7 text-ink-2">
              Tidak ada panduan yang memuat “{{ query.trim() }}”. Coba kata lain, misalnya
              <template v-for="(k, ki) in SUGGESTIONS" :key="k"><button type="button" class="pt-focus rounded font-semibold text-brand underline" @click="query = k">{{ k }}</button><span v-if="ki < SUGGESTIONS.length - 1">, </span></template>.
            </p>
            <button type="button" class="pt-focus mt-5 rounded-lg border border-line-strong bg-inset px-4 py-2 text-sm font-semibold" @click="clearSearch">Hapus pencarian</button>
          </section>
        </main>

        <!-- ── Sidebar kanan ───────────────────────────────────────────── -->
        <aside class="space-y-4 p-1 lg:sticky lg:top-[86px] lg:max-h-[calc(100vh-102px)] lg:overflow-y-auto" aria-label="Informasi tambahan">
          <!-- Daftar isi -->
          <nav class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-toc-judul">
            <h3 id="pt-toc-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="list" :size="18" class="text-brand" />Daftar isi
            </h3>
            <p v-if="!visibleParts.length" class="m-0 mt-3 text-sm text-ink-3">Tidak ada langkah yang cocok.</p>
            <div v-for="part in visibleParts" :key="part.id" class="mt-3">
              <button
                type="button"
                class="pt-focus flex w-full items-start gap-2 rounded-md py-1 text-left text-sm font-bold"
                :class="activePartId === part.id ? 'text-brand' : 'text-ink'"
                @click="goTo(part.id)"
              >
                <span class="shrink-0">Bagian {{ part.no }}.</span>
                <span class="min-w-0">{{ part.title }}</span>
              </button>
              <ul v-show="hasQuery || activePartId === part.id" class="m-0 mt-1 list-none space-y-0.5 p-0">
                <li v-for="s in part.steps" :key="s.id">
                  <button
                    type="button"
                    class="pt-focus w-full rounded-r-md border-l-2 py-1 pl-3 pr-2 text-left text-[17.6px] leading-5"
                    :class="activeId === s.id ? 'border-brand bg-brand-soft font-semibold text-ink' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'"
                    :aria-current="activeId === s.id ? 'step' : undefined"
                    @click="goTo(s.id)"
                  >
                    {{ s.no }}. {{ s.short }}
                  </button>
                </li>
              </ul>
            </div>
            <button
              type="button"
              class="pt-focus mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-inset px-3 py-2.5 text-sm font-semibold hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
              :disabled="!!pdfBusy"
              @click="downloadPdf('all')"
            >
              <Ico name="file" :size="16" class="text-accent" />
              {{ pdfBusy === 'all' ? 'Menyiapkan PDF...' : 'Unduh panduan lengkap (PDF)' }}
            </button>
          </nav>

          <!-- Catatan penting -->
          <section class="rounded-xl border border-line border-l-4 border-l-accent bg-surface p-4" aria-labelledby="pt-catatan-judul">
            <h3 id="pt-catatan-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="info" :size="18" class="text-accent" />Catatan penting
            </h3>
            <ul class="m-0 mt-3 list-disc space-y-2 pl-5 text-[17.6px] leading-5 text-ink-2 marker:text-accent">
              <li v-for="n in CATATAN" :key="n">{{ n }}</li>
            </ul>
          </section>

          <!-- Format dan batas berkas -->
          <section class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-batas-judul">
            <h3 id="pt-batas-judul" class="m-0 flex items-center gap-2 font-heading text-base font-extrabold">
              <Ico name="file" :size="18" class="text-brand" />Format dan batas berkas
            </h3>
            <dl class="m-0 mt-3 space-y-3 text-[17.6px] leading-5">
              <div v-for="f in FORMAT_CARDS" :key="f.menu">
                <dt class="font-bold text-ink">{{ f.menu }}</dt>
                <dd class="m-0 mt-0.5 text-ink-2">{{ f.format }}</dd>
                <dd class="m-0 text-ink-2">{{ f.batas }}</dd>
              </div>
            </dl>
          </section>

          <!-- Bantuan lain -->
          <section class="rounded-xl border border-line bg-surface p-4" aria-labelledby="pt-bantuan-judul">
            <h3 id="pt-bantuan-judul" class="m-0 font-heading text-base font-extrabold">Belum menemukan jawabannya?</h3>
            <div class="mt-3 flex flex-col gap-2">
              <button type="button" class="pt-focus flex items-center justify-between rounded-lg border border-line bg-inset px-3 py-2.5 text-left text-sm font-semibold hover:border-line-strong" @click="emit('navigate', 'faq')">
                Bantuan &amp; Pertanyaan<Ico name="arrow" :size="16" class="text-ink-3" />
              </button>
              <button type="button" class="pt-focus flex items-center justify-between rounded-lg border border-line bg-inset px-3 py-2.5 text-left text-sm font-semibold hover:border-line-strong" @click="emit('navigate', 'report')">
                Kirim laporan ke admin<Ico name="arrow" :size="16" class="text-ink-3" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PageHero from './PageHero.vue';
import { useAnalysis } from '../composables/useAnalysis';

const emit = defineEmits(['navigate']);
const { showNotification } = useAnalysis();

/* ── Ikon (SVG inline bergaya Lucide; tanpa dependensi) ───────────────── */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  upload: '<path d="M12 13v8"/><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="m8 17 4-4 4 4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  chip: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>'
};
const Ico = (props) =>
  h('svg', {
    width: props.size || 16,
    height: props.size || 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    innerHTML: ICONS[props.name] || ''
  });
Ico.props = ['name', 'size'];

/* ── Isi panduan ──────────────────────────────────────────────────────────
   Teks: **tebal**. Tiap langkah: title (kalimat tebal), text (lanjutan), bullets (rincian),
   visual (kunci ilustrasi di template), caption/alt (teks gambar), img (opsional: tangkapan layar). */
const RAW_PARTS = [
  {
    id: 'bagian-1',
    title: 'Ringkasan Sistem & Unggah Dokumen RKA',
    lead: 'Dasbor Utama memberikan gambaran kesiapan sistem. Unggah berkas RKA berformat PDF untuk dianalisis oleh ASI DARA.',
    cta: { label: 'Buka Dasbor & Unggah Berkas RKA', tab: 'dashboard' },
    next: 'bagian-2',
    steps: [
      {
        id: 'b1-langkah-1',
        short: 'Periksa Dasbor Utama',
        title: 'Periksa status kesiapan sistem pada Dasbor Utama.',
        text: 'Buka menu **Dasbor Utama** untuk melihat indikator kesiapan model AI, total dokumen tersimpan, dan kecepatan analisis.',
        bullets: [
          'Kartu **Model Gemini 2.5 Flash** menandai status hijau bila server AI siap memproses.',
          'Kartu **Arsip Dokumen RKA** menampilkan jumlah dokumen RKA yang tersimpan di sistem.',
          'Kartu **Kecepatan Analisis AI** menginfokan waktu pemrosesan rata-rata per dokumen.',
          'Klik banner **Mulai Analisis** untuk langsung menuju halaman analisis.'
        ],
        visual: 'main-dash',
        caption: 'Dasbor Utama & Status Sistem',
        alt: 'Tampilan Dasbor Utama dengan kartu status Gemini 2.5 Flash, jumlah arsip dokumen, dan banner mulai analisis.',
        keywords: 'dasbor utama status gemini flash arsip dokumen kecepatan analisis siap banner',
        img: null
      },
      {
        id: 'b1-langkah-2',
        short: 'Siapkan berkas PDF',
        title: 'Siapkan berkas RKA berformat PDF.',
        text: 'Menu **Unggah Berkas RKA** hanya menerima dokumen RKA/DPA SKPD Kabupaten Cirebon dalam bentuk PDF.',
        bullets: [
          'Gunakan PDF digital asli yang teksnya bisa diseleksi, bukan foto atau hasil scan.',
          'Ukuran maksimal **100 MB** per berkas. Berkas kosong (0 byte) atau format XLSX/DOCX di menu ini akan ditolak.',
          'Untuk berkas Excel (XLSX) atau Word (DOCX), gunakan menu **Simulasi Percakapan Agen AI**.'
        ],
        visual: 'files',
        caption: 'Format berkas RKA',
        alt: 'Contoh daftar berkas: PDF RKA diterima, sedangkan berkas XLSX dan foto ditolak.',
        keywords: 'format pdf xlsx excel docx ukuran batas 100 mb persiapan siapkan berkas foto pindai scan',
        img: null
      },
      {
        id: 'b1-langkah-3',
        short: 'Pilih & unggah berkas',
        title: 'Buka menu Unggah Berkas RKA dan pantau pemrosesan.',
        text: 'Klik **Unggah Berkas RKA** di sidebar kiri. Klik **Pilih Dokumen RKA** atau tarik berkas PDF ke area unggah.',
        bullets: [
          'Beberapa berkas bisa dipilih sekaligus untuk diproses secara otomatis.',
          'Tunggu hingga status antrean mencapai 100% pada semua dokumen.',
          'Jangan menutup atau memuat ulang halaman selama antrean berjalan.'
        ],
        visual: 'dropzone',
        caption: 'Menu Unggah Berkas RKA',
        alt: 'Tampilan menu Unggah Berkas RKA dengan tombol Pilih Dokumen RKA di dalam kotak unggah.',
        keywords: 'unggah upload menu sidebar pilih dokumen tarik drop drag banyak berkas sekaligus nonaktif antrean',
        img: null
      },
      {
        id: 'b1-langkah-4',
        short: 'Verifikasi OPD & Pagu',
        title: 'Verifikasi nama Perangkat Daerah (OPD) dan Pagu.',
        text: 'ASI DARA membaca nama Perangkat Daerah dan Pagu Anggaran secara otomatis dari dokumen RKA.',
        bullets: [
          'Periksa nama OPD dan Pagu pada kartu header di halaman **Hasil Analisis**.',
          'Jika nama terbaca keliru, klik **Edit Manual**, buka bagian **Identitas & Pagu**, lalu sesuaikan kolom OPD.',
          'Anda juga dapat memilih **Unggah Ulang PDF** (maksimal 25 MB) untuk menganalisis ulang dokumen.'
        ],
        visual: 'opd',
        caption: 'Edit Manual, Identitas & Pagu',
        alt: 'Layar Edit Manual pada bagian Identitas dan Pagu, dengan kolom Perangkat Daerah (OPD) ditandai.',
        keywords: 'opd perangkat daerah skpd satuan kerja pilih ubah koreksi salah edit manual unggah ulang pagu',
        img: null
      }
    ]
  },
  {
    id: 'bagian-2',
    title: 'Simulasi Percakapan Agen AI (CBB Chatbot)',
    lead: 'Asisten AI Bapperida terintegrasi langsung dengan arsip dokumen RKA ASI DARA untuk analisis kausalitas SROI, kalkulasi anggaran interaktif, dan konsultasi regulasi perencanaan.',
    cta: { label: 'Buka CBB Chatbot', tab: 'agentic-ai' },
    next: 'bagian-3',
    steps: [
      {
        id: 'b2-langkah-1',
        short: 'Pilih Dokumen Arsip',
        title: 'Hubungkan percakapan langsung dengan dokumen RKA di arsip.',
        text: 'Pilih dokumen dari dropdown arsip untuk memuat konteks subkegiatan, total pagu, dan rasio SROI secara instan ke dalam sesi obrolan.',
        bullets: [
          'Dropdown memuat seluruh dokumen RKA yang tersimpan pada arsip ASI DARA secara otomatis.',
          'Lencana status langsung menampilkan nilai rasio SROI terkini (Layak, Cukup, atau Kurang).',
          'Tombol **Reset Konteks** memungkinkan Anda kembali ke mode konsultasi umum kapan saja.'
        ],
        visual: 'cbb-archive',
        caption: 'Integrasi Arsip & Badge SROI',
        alt: 'Dropdown pemilihan arsip RKA pada CBB Chatbot dengan badge rasio SROI dan tombol reset konteks.',
        keywords: 'cbb chatbot arsip rka pilih dokumen sroi badge konteks reset bapperida',
        img: null
      },
      {
        id: 'b2-langkah-2',
        short: 'Pertanyaan Cepat SROI',
        title: 'Analisis kausalitas SROI dan faktor penyesuaian dengan satu klik.',
        text: 'Setelah memilih dokumen arsip, gunakan 3 tombol pertanyaan cepat di atas kolom input.',
        bullets: [
          '**💡 Mengapa Rasio SROI bernilai demikian?:** Memberikan penjelasan naratif mendalam faktor pemicu nilai rasio SROI.',
          '**⚖️ Rincian 5 Faktor Penyesuaian:** Merinci bobot Deadweight, Attribution, Displacement, Drop-off, dan Unintended Outcomes.',
          '**📝 Rekomendasi Strategis AI:** Menyajikan saran realokasi pos belanja dan perbaikan indikator kinerja program.'
        ],
        visual: 'cbb-archive',
        caption: '3 Pertanyaan Cepat Analisis SROI',
        alt: 'Tombol pertanyaan cepat SROI, rincian 5 faktor penyesuaian, dan rekomendasi strategis AI.',
        keywords: 'pertanyaan cepat kausalitas sroi 5 faktor deadweight attribution displacement drop-off unintended rekomendasi strategis',
        img: null
      },
      {
        id: 'b2-langkah-3',
        short: 'Kalkulasi Anggaran',
        title: 'Lakukan perhitungan formula anggaran interaktif.',
        text: 'Ketik perintah kalkulasi seperti *"Hitung SROI pagu 250 jt dampak 420 jt"* atau evaluasi capaian realisasi anggaran.',
        bullets: [
          'AI menyajikan kartu kalkulasi visual berlatar khusus dengan formula matematika, substitusi variabel, dan metrik hasil.',
          'Animasi **konfeti perayaan** otomatis muncul jika hasil analisis bernilai **Layak** atau **Sangat Efektif**.',
          'Kartu kalkulasi memberikan status kelayakan dan catatan kritis efisiensi belanja.'
        ],
        visual: 'cbb-calc',
        caption: 'Kartu Kalkulasi Interaktif & Formula SROI',
        alt: 'Gelembung bot dengan kartu kalkulasi interaktif, metrik pagu, rasio SROI, dan indikator kelayakan.',
        keywords: 'kalkulasi hitung formula sroi kartu anggaran realisasi target konfeti kelayakan efektivitas matematika',
        img: null
      },
      {
        id: 'b2-langkah-4',
        short: 'Konsultasi Regulasi',
        title: 'Konsultasikan regulasi SIPD-RI, Permendagri, dan SSH.',
        text: 'Ketik pertanyaan seputar regulasi perencanaan daerah atau klik prompt chip rekomendasi.',
        bullets: [
          'Tersedia prompt chip cepat: **RPJMD vs RKPD**, **Aturan SBM/SSH**, **Geseran Belanja**, dan **KUA-PPAS**.',
          'Gunakan tombol **Salin** pada tiap pesan bot untuk menyalin narasi pertimbangan ke dokumen kerja Anda.',
          'AI menyajikan jawaban komprehensif berdasar Permendagri No. 77/2020 dan regulasi keuangan daerah terkini.'
        ],
        visual: 'cbb-chat',
        caption: 'Konsultasi Regulasi & Prompt Chips',
        alt: 'Percakapan konsultasi regulasi dengan chip pertanyaan cepat, respon terstruktur, dan tombol salin pesan.',
        keywords: 'konsultasi regulasi permendagri 77 sipd-ri ssh sbm rpjmd rkpd kua ppas chip salin copy markdown',
        img: null
      }
    ]
  },
  {
    id: 'bagian-3',
    title: 'Membaca & Mengedit Hasil Analisis',
    lead: 'Halaman Hasil Analisis menampilkan valuasi SROI, rasionalisasi belanja, serta fitur perbaikan manual/AI.',
    cta: { label: 'Buka Hasil Analisis', tab: 'analyzer' },
    next: 'bagian-4',
    steps: [
      {
        id: 'b3-langkah-1',
        short: 'Buka Hasil Analisis',
        title: 'Buka halaman Hasil Analisis & kelola versi.',
        text: 'Setelah antrean selesai, buka menu **Hasil Analisis** atau klik **Lihat Analisis** pada Arsip Dokumen RKA.',
        bullets: [
          'Pilih iterasi dokumen pada dropdown **Versi** bila memiliki beberapa draf revisi.',
          'Tombol aksi atas: **Edit Manual**, **Edit dengan AI**, **Unggah Ulang PDF**, **Unduh Laporan**, dan **Hapus**.'
        ],
        visual: 'header',
        caption: 'Bilah atas Hasil Analisis',
        alt: 'Bilah atas halaman Hasil Analisis dengan pilihan versi dan tombol Edit Manual, Edit dengan AI, Unggah Ulang PDF, Unduh Laporan, Hapus.',
        keywords: 'hasil analisis arsip lihat analisis versi tombol edit hapus buka dokumen',
        img: null
      },
      {
        id: 'b3-langkah-2',
        short: 'Identitas & Indikator',
        title: 'Periksa identitas, pagu, dan indikator kinerja.',
        text: 'Kartu header memuat rincian OPD, program, kegiatan, subkegiatan, dan total pagu.',
        bullets: [
          'Tinjau **Target Kinerja per Indikator** untuk melihat tolok ukur outcome dan output.',
          'Bagian **Kesesuaian Anggaran** menilai kecukupan pagu terhadap target output.'
        ],
        visual: 'hero',
        caption: 'Kartu identitas & pagu RKA',
        alt: 'Kartu identitas dokumen berisi subkegiatan, perangkat daerah, program, kegiatan, tahun anggaran, dan pagu anggaran.',
        keywords: 'pagu anggaran identitas subkeg program kegiatan tahun anggaran perangkat daerah indikator target',
        img: null
      },
      {
        id: 'b3-langkah-3',
        short: 'Pahami Nilai SROI',
        title: 'Pahami Rasio Nilai Prakiraan Dampak (SROI).',
        text: 'Rasio SROI mengukur perbandingan total dampak sosial bersih terhadap pagu anggaran.',
        bullets: [
          '**Layak (\u2265 1,0 - Hijau):** Dampak sosial bernilai lebih tinggi dari pagu anggaran.',
          '**Cukup (0,6 \u2013 0,99 - Kuning):** Dampak sosial sebanding dengan anggaran.',
          '**Kurang (< 0,6 - Merah):** Anggaran kurang efisien dalam menghasilkan dampak.',
          'Faktor penyesuaian: deadweight (maks 40%), attribution, displacement, drop-off, dan discount rate.'
        ],
        visual: 'sroi',
        caption: 'Rasio Nilai Prakiraan Dampak (SROI)',
        alt: 'Kartu rasio Nilai Prakiraan Dampak bernilai 1,24 berstatus Layak, empat kartu nilai rupiah, dan skala kurang, cukup, layak.',
        keywords: 'sroi nilai prakiraan dampak rasio layak cukup kurang deadweight attribution displacement drop-off discount rate',
        img: null
      },
      {
        id: 'b3-langkah-4',
        short: 'Rekomendasi Belanja',
        title: 'Tinjau rekomendasi komposisi belanja.',
        text: 'Diagram dan tabel belanja menampilkan usulan realokasi anggaran.',
        bullets: [
          'Diagram lingkaran membandingkan struktur belanja sebelum dan sesudah rekomendasi.',
          'Tabel rekening merinci status **Efisien** atau **Inefisien** serta besaran pengurangan.'
        ],
        visual: 'belanja',
        caption: 'Komponen & rekomendasi belanja',
        alt: 'Dua diagram lingkaran komposisi belanja dan tabel rekening dengan status efisien atau inefisien.',
        keywords: 'rekomendasi belanja komponen diagram pie rekening efisien inefisien alokasi dikurangi realokasi',
        img: null
      },
      {
        id: 'b3-langkah-5',
        short: '4 Metode Edit Analisis',
        title: 'Gunakan 4 metode pembaruan analisis dan multi-versi.',
        text: 'Perbarui hasil analisis dokumen dengan metode yang paling sesuai dengan kebutuhan revisi Anda.',
        bullets: [
          '**Edit Manual:** Membuka formulir untuk mengedit langsung Identitas, Target Indikator Kinerja, Komponen Belanja, dan Parameter SROI.',
          '**Edit dengan AI:** Ketikkan prompt revisi alami (misal: *"Kurangi belanja rapat 30% dan alihkan ke belanja modal"*).',
          '**Unggah Ulang PDF:** Unggah berkas PDF revisi baru (maks 25 MB) dari komputer Anda.',
          '**Muat Ulang PDF:** Memproses ulang berkas PDF yang sudah tersimpan di server menggunakan model AI terbaru.',
          'Setiap perubahan otomatis membentuk versi dokumen baru di pemilih **Versi**, tanpa menghapus versi sebelumnya.'
        ],
        visual: 'edit-modal',
        caption: 'Modal Edit Manual, Edit AI & Versi Baru',
        alt: 'Modal Edit Manual dengan tab form dan pemilih versi analisis.',
        keywords: 'edit manual edit ai prompt unggah ulang pdf muat ulang versi baru multi versi form parameter sroi belanja indikator',
        img: null
      },
      {
        id: 'b3-langkah-6',
        short: 'Unduh Laporan & Ekspor',
        title: 'Unduh laporan analisis interaktif atau cetak ke PDF resmi.',
        text: 'Simpan dokumen hasil evaluasi RKA untuk kebutuhan arsip dan pelaporan TAPD.',
        bullets: [
          'Klik **Unduh Laporan** untuk mendapatkan berkas laporan mandiri HTML interaktif.',
          'Berkas HTML dapat dibuka langsung secara offline di browser mana saja tanpa memerlukan instalasi aplikasi.',
          'Untuk mencetak atau menyimpan sebagai PDF resmi, buka berkas HTML lalu tekan pintasan keyboard **Ctrl+P** (Print) dan pilih **Simpan sebagai PDF**.'
        ],
        visual: 'export',
        caption: 'Unduh Laporan HTML & Cetak PDF',
        alt: 'Tombol unduh laporan menghasilkan HTML interaktif yang siap dicetak ke PDF.',
        keywords: 'unduh download laporan html pdf cetak print ekspor ctrl p offline simpan tapd',
        img: null
      }
    ]
  },
  {
    id: 'bagian-4',
    title: 'Pengelolaan Arsip Dokumen, Kotak Sampah & Formulir Laporan',
    lead: 'Kelola arsip RKA, lakukan pencarian & penyaringan data presisi, aksi massal, pemulihan dokumen di Kotak Sampah, serta pelaporan kendala.',
    cta: { label: 'Buka Arsip Dokumen RKA', tab: 'history' },
    next: 'bagian-5',
    steps: [
      {
        id: 'b4-langkah-1',
        short: 'Cari & Filter Arsip',
        title: 'Cari dan saring arsip dokumen RKA secara presisi.',
        text: 'Semua dokumen RKA yang pernah diolah tersimpan di menu **Arsip Dokumen RKA**.',
        bullets: [
          'Cari dokumen berdasarkan kata kunci nama OPD, nama Subkegiatan, atau Tahun Anggaran.',
          'Gunakan filter bertingkat **Perangkat Daerah (OPD)** dan **Tahun Anggaran** untuk mempersempit daftar.',
          'Atur urutan daftar lewat dropdown **Urutkan** (Terbaru, Terlama, OPD A–Z, OPD Z–A, Tahun). Klik **Reset Filter** untuk kembali ke tampilan awal.',
          'Tabel merinci Nama Subkegiatan, OPD, Pagu Anggaran, Rasio SROI, dan Jumlah Versi.'
        ],
        visual: 'archive',
        caption: 'Daftar Arsip Dokumen RKA & Filter',
        alt: 'Tampilan tabel arsip dokumen RKA dengan pencarian, filter OPD, Tahun, dan urutkan.',
        keywords: 'arsip dokumen rka pencarian filter opd subkegiatan tahun urutkan sortir reset tabel pagu sroi',
        img: null
      },
      {
        id: 'b4-langkah-2',
        short: 'Aksi Massal & Muat Ulang',
        title: 'Jalankan seleksi massal dan muat ulang analisis otomatis.',
        text: 'Gunakan kotak centang (checkbox) untuk memproses beberapa dokumen sekaligus secara efisien.',
        bullets: [
          'Centang kotak di header tabel untuk memilih seluruh dokumen, atau centang dokumen tertentu secara individual.',
          'Tombol otomatis menyesuaikan: **Muat Ulang Semua (N)** akan menganalisis ulang seluruh arsip, sedangkan **Muat Ulang Terpilih (N)** hanya memproses dokumen yang dicentang.',
          'Gunakan tombol **Hapus Terpilih** untuk memindahkan beberapa dokumen sekaligus ke Tab Sampah.',
          'Proses muat ulang berjalan otomatis berurutan di latar belakang; jangan menutup tab browser saat proses berlangsung.'
        ],
        visual: 'archive',
        caption: 'Seleksi Massal & Tombol Muat Ulang Terpilih',
        alt: 'Kotak centang seleksi massal dan tombol aksi dinamis muat ulang serta hapus dokumen.',
        keywords: 'seleksi massal checkbox muat ulang semua terpilih hapus terpilih batch antrean berurutan',
        img: null
      },
      {
        id: 'b4-langkah-3',
        short: 'Tab Sampah & Pemulihan',
        title: 'Kelola dokumen terhapus di Kotak Sampah (Trash).',
        text: 'Dokumen yang dihapus tidak langsung hilang permanen, melainkan dipindahkan ke **Tab Sampah** (soft delete).',
        bullets: [
          'Klik tab **Sampah** pada bilah atas Arsip Dokumen untuk melihat daftar berkas yang dihapus.',
          'Klik tombol **Pulihkan** untuk mengembalikan dokumen beserta seluruh riwayat versinya ke tab Arsip Aktif.',
          'Klik **Hapus Permanen** pada baris dokumen atau **Kosongkan Sampah** untuk menghapus berkas secara permanen dari server database.'
        ],
        visual: 'trash',
        caption: 'Tab Sampah (Trash) & Pemulihan',
        alt: 'Tab Sampah dengan tombol Pulihkan, Hapus Permanen, dan Kosongkan Sampah.',
        keywords: 'kotak sampah trash soft delete pulihkan restore hapus permanen kosongkan aman',
        img: null
      },
      {
        id: 'b4-langkah-4',
        short: 'Ekspor JSON & Cadangan',
        title: 'Ekspor database JSON dan lakukan pencadangan/penggabungan.',
        text: 'Amankan data perencanaan daerah dengan fitur ekspor dan pemulihan cadangan.',
        bullets: [
          'Klik **Ekspor Full Database (JSON)** untuk mengunduh seluruh data arsip ke berkas JSON.',
          'Gunakan modal **Backup & Pemulihan** untuk mengimpor berkas cadangan (format Zip, JSON, atau HTML).',
          'Tersedia fitur **Merge (Tambah ke Arsip)** yang menggabungkan dokumen dari file cadangan ke database tanpa menimpa dokumen yang sudah ada.'
        ],
        visual: 'export',
        caption: 'Ekspor Database JSON & Fitur Merge',
        alt: 'Tombol ekspor full database dan opsi merge penggabungan dokumen tanpa tumpang tindih.',
        keywords: 'ekspor database json backup restore cadangan pemulihan zip html merge gabung',
        img: null
      },
      {
        id: 'b4-langkah-5',
        short: 'Formulir Laporan Kendala',
        title: 'Laporkan kendala sistem dan lampirkan bukti tangkapan layar.',
        text: 'Jika Anda menemukan kendala teknis atau memerlukan pembukaan akses menu yang dinonaktifkan Admin, kirim laporan resmi.',
        bullets: [
          'Buka menu **Laporan** di navigasi utama atau klik tautan pada lencana **Nonaktif**.',
          'Pilih kategori laporan: Kendala Fitur, Permintaan Akses, Saran/Masukan, atau Lainnya.',
          'Unggah hingga **5 foto tangkapan layar** (format PNG, JPG, JPEG, WebP, GIF dengan batas total **5 MB**).',
          'Laporan akan masuk ke Dasbor Admin dan dapat ditanggapi langsung lewat WhatsApp resmi Bapperida.'
        ],
        visual: 'report-form',
        caption: 'Formulir Laporan Kendala Pengguna',
        alt: 'Formulir kirim laporan dengan isian kategori, deskripsi, lampiran gambar, dan kontak pelapor.',
        keywords: 'formulir laporan kendala tangkapan layar screenshot upload foto bantuan admin nonaktif whatsapp wa',
        img: null
      }
    ]
  },
  {
    id: 'bagian-5',
    title: 'Panduan Dasbor Admin, Manajemen User & Audit Sistem',
    lead: 'Dasbor khusus Administrator & Moderator untuk memantau kesehatan server, log SSE real-time, pencadangan snapshot, pool kunci API Gemini/OpenAI, kontrol menu, dan penanganan laporan via WhatsApp.',
    cta: { label: 'Buka Dasbor Admin', tab: 'admin-dashboard' },
    next: null,
    steps: [
      {
        id: 'b5-langkah-1',
        short: 'Statistik & Kuota Storage',
        title: 'Pantau kesehatan server, kuota storage, dan ambang rotasi 85%.',
        text: 'Dasbor Admin menyajikan metrik operasional dan kesehatan infrastruktur sistem ASI DARA.',
        bullets: [
          'Pantau total pengguna aktif (kapasitas hingga 60 akun), total dokumen RKA, dan total pagu terinput.',
          'Cek kapasitas **Storage Failover** (kuota 5.0 GB): Sistem memberlakukan ambang rotasi otomatis pada **85%** kapasitas.',
          'Indikator status koneksi memantau kesiapan Pool Kunci API Gemini, Database Neon Cloud, dan auto-snapshot harian.'
        ],
        visual: 'admin-stats',
        caption: 'Dasbor Statistik & Ambang Rotasi 85%',
        alt: 'Statistik pengguna, kapasitas kuota storage 5 GB dengan ambang rotasi 85%, dan indikator kesehatan server.',
        keywords: 'admin dasbor statistik storage failover rotasi 85 kuota 5 gb user limit 60 snapshot neon',
        img: null
      },
      {
        id: 'b5-langkah-2',
        short: 'Log Aktivitas SSE Real-Time',
        title: 'Pantau audit trail secara live dengan streaming Server-Sent Events.',
        text: 'Tab **Log Aktivitas** mencatat seluruh tindakan pengguna tanpa perlu memuat ulang halaman browser.',
        bullets: [
          'Menerima siaran aktivitas secara langsung (streaming SSE) saat terjadi aksi login, unggah berkas, pengeditan analisis, atau penghapusan data.',
          'Gunakan filter cepat berdasarkan jenis aksi (LOGIN, CREATE, UPDATE, DELETE, TRASH, RESTORE) dan status keberhasilan.',
          'Mencatat alamat IP pengguna, waktu presisi, dan nama pengguna untuk transparansi dan audit forensik.'
        ],
        visual: 'admin-logs',
        caption: 'Log Aktivitas Real-time (SSE Streaming)',
        alt: 'Tampilan tab Log Aktivitas dengan indikator live streaming, filter aksi, IP client, dan riwayat aktivitas.',
        keywords: 'log aktivitas sse server-sent events real-time audit trail ip user aksi status live',
        img: null
      },
      {
        id: 'b5-langkah-3',
        short: 'Backup & Auto-Snapshot',
        title: 'Lakukan pencadangan database penuh dan kelola snapshot otomatis.',
        text: 'Tab **Backup & Pemulihan** melindungi integritas seluruh dokumen dan hasil valuasi SROI.',
        bullets: [
          'Unduh salinan cadangan lengkap dalam format JSON terkompresi atau HTML mandiri.',
          'Klik **Buat Snapshot Sekarang** untuk membuat titik pemulihan instan sebelum pembaruan besar.',
          'Daftar snapshot otomatis harian tersimpan rapi dan dapat dipulihkan dengan **1-klik Pulihkan** kapan saja terjadi galat data.'
        ],
        visual: 'admin-backup',
        caption: 'Pencadangan, Restore & Snapshot Database',
        alt: 'Tab Backup dengan tombol buat snapshot, daftar snapshot harian, dan tombol pulihkan 1-klik.',
        keywords: 'backup restore snapshot database pemulihan auto-snapshot json html cadangan darurat',
        img: null
      },
      {
        id: 'b5-langkah-4',
        short: 'Manajemen User & Password',
        title: 'Atur akun, penugasan peran (role), dan reset kata sandi.',
        text: 'Tab **Manajemen User** memberikan kendali penuh terhadap otorisasi operator perangkat daerah.',
        bullets: [
          'Tambah akun operator baru dan tetapkan peran: **Admin** (akses penuh), **Moderator** (evaluasi & review), atau **User** (operator OPD).',
          'Gunakan sakelar untuk mengaktifkan atau menonaktifkan akses pengguna secara instan.',
          'Lakukan **Reset Password** aman untuk pengguna yang lupa kata sandi dengan modal konfirmasi kata sandi baru.'
        ],
        visual: 'admin-users',
        caption: 'Manajemen Pengguna & Penugasan Role',
        alt: 'Daftar pengguna dengan badge peran Admin, Moderator, User, sakelar status aktif, dan tombol reset password.',
        keywords: 'manajemen user role admin moderator operator opd reset password sakelar akun aktif nonaktif',
        img: null
      },
      {
        id: 'b5-langkah-5',
        short: 'Pool Kunci API Gemini',
        title: 'Kelola pool multi-kunci API Gemini & OpenAI dengan rotasi otomatis.',
        text: 'Tab **Kunci API** mencegah kegagalan analisis akibat batasan kuota (rate-limit) penyedia AI.',
        bullets: [
          'Dukung banyak kunci API sekaligus (Gemini 2.5 Flash dari Google AI Studio dan OpenAI).',
          'Tetapkan salah satu kunci sebagai **Utama (Primary)**, dengan kunci lain berstatus cadangan rotasi otomatis.',
          'Fitur **Batch Import (Impor Massal)** memudahkan admin memasukkan banyak token API sekaligus hanya dengan menempelkan daftar teks.',
          'Tombol sakelar aktif/nonaktif dan salin kunci memudahkan rotasi tanpa menyentuh konfigurasi server.'
        ],
        visual: 'admin-api',
        caption: 'Pool Manajemen Kunci API & Batch Import',
        alt: 'Tab Manajemen API dengan daftar multi-kunci, badge utama/aktif, tombol salin, dan impor massal.',
        keywords: 'kunci api api key pool gemini flash google ai studio openai rotasi kuota rate limit batch import utama',
        img: null
      },
      {
        id: 'b5-langkah-6',
        short: 'Kontrol Sakelar Menu Global',
        title: 'Atur ketersediaan menu aplikasi secara terpusat.',
        text: 'Tab **Kontrol Menu** memungkinkan Admin mengunci atau membuka akses fitur untuk peran pengguna biasa.',
        bullets: [
          'Sakelar toggle tersedia untuk menu: Unggah Berkas RKA, CBB Chatbot, Hasil Analisis, Arsip Dokumen, dan lainnya.',
          'Menu yang dinonaktifkan akan menampilkan lencana **Nonaktif** dan mengarahkan pengguna ke formulir laporan kendala.',
          'Sangat berguna saat server sedang dalam pemeliharaan berkala atau pembatasan periode evaluasi anggaran.'
        ],
        visual: 'admin-menu',
        caption: 'Kontrol Sakelar Akses Menu Global',
        alt: 'Sakelar sakelar toggle untuk mengaktifkan atau menonaktifkan menu aplikasi bagi pengguna biasa.',
        keywords: 'kontrol menu sakelar toggle global batasi akses nonaktif maintenance periode evaluasi',
        img: null
      },
      {
        id: 'b5-langkah-7',
        short: 'Laporan Masuk & Balas WA',
        title: 'Tindak lanjuti laporan kendala pengguna dan atur kontak WhatsApp.',
        text: 'Tab **Laporan Masuk** dan **Pengaturan WhatsApp** memastikan komunikasi efektif dengan pelapor.',
        bullets: [
          'Tinjau laporan kendala yang dikirim pengguna lengkap dengan waktu, kategori, nomor kontak, dan pratinjau foto tangkapan layar.',
          'Klik tombol **Balas via WhatsApp** untuk langsung membuka obrolan WhatsApp resmi (`wa.me/${nomor}`) dengan format template konfirmasi otomatis.',
          'Hapus laporan yang sudah selesai ditindaklanjuti untuk menjaga kebersihan kotak masuk.',
          'Konfigurasikan nomor WhatsApp Admin Bapperida pada tab **Pengaturan** agar nomor tujuan selalu akurat.'
        ],
        visual: 'admin-reports',
        caption: 'Kotak Masuk Laporan & Balas via WhatsApp',
        alt: 'Daftar laporan masuk dengan pratinjau screenshot, tombol balas via WhatsApp, dan konfigurasi kontak admin.',
        keywords: 'laporan masuk kotak masuk balas whatsapp wa me screenshot tangkapan layar pengaturan kontak admin',
        img: null
      }
    ]
  }
];

/* ── Data ilustrasi & kartu sidebar ─────────────────────────────────────── */
const QUEUE_MOCK = [
  { name: 'RKA_Dinas_Kesehatan.pdf', status: 'Selesai', pct: 100 },
  { name: 'RKA_Dinas_Pendidikan.pdf', status: 'Sedang diproses', pct: 64 },
  { name: 'RKA_Dinas_Pertanian.pdf', status: 'Menunggu antrean...', pct: 0 }
];
const INDIKATOR_MOCK = [
  { level: 'Output', target: '12 Dokumen', nama: 'Jumlah dokumen perencanaan yang disusun' },
  { level: 'Hasil', target: '100%', nama: 'Persentase dokumen tersusun tepat waktu' }
];
const SROI_CARDS = [
  { label: 'Nilai Input (Pagu)', value: 'Rp 250.000.000' },
  { label: 'Total Nilai Dampak Sosial', value: 'Rp 420.000.000' },
  { label: 'Total Dampak Bersih', value: 'Rp 335.000.000' },
  { label: 'Dampak Nilai Saat Ini', value: 'Rp 310.000.000' }
];
const BELANJA_MOCK = [
  { nama: 'Honorarium Tim Penyusun Dokumen', efisien: false, alokasi: 'Rp 85.000.000', kurang: 'Rp 45.000.000' },
  { nama: 'Belanja Alat Tulis Kantor', efisien: true, alokasi: 'Rp 20.000.000', kurang: '-' }
];
const FORMAT_CARDS = [
  { menu: 'Unggah Berkas RKA', format: 'Format: PDF Digital Asli', batas: 'Maksimal 100 MB per berkas, mendukung antrean batch banyak berkas sekaligus' },
  { menu: 'Simulasi Percakapan AI (CBB Chatbot)', format: 'Konteks: Dokumen Arsip RKA & Teks Bebas', batas: 'Terhubung langsung ke arsip RKA, perhitungan formula anggaran, dan prompt chips' },
  { menu: 'Edit & Unggah Ulang PDF', format: 'Format: PDF', batas: 'Maksimal 25 MB per berkas (membentuk versi iterasi baru)' },
  { menu: 'Unduh Laporan Analisis', format: 'Format: HTML Interaktif', batas: 'Dapat dibuka offline di peramban dan dicetak ke PDF resmi (Ctrl+P)' },
  { menu: 'Ekspor Arsip & Database', format: 'Format: JSON', batas: 'Ekspor seluruh riwayat analisis, multi-versi dokumen, dan parameter SROI' },
  { menu: 'Cadangan & Pemulihan (Backup/Merge)', format: 'Format: Zip / JSON / HTML Converter', batas: 'Pencadangan snapshot penuh dan fitur Merge (Tambah ke Arsip) tanpa menimpa' },
  { menu: 'Formulir Laporan Kendala Pengguna', format: 'Format Gambar: PNG, JPG, JPEG, WebP, GIF', batas: 'Hingga 5 berkas tangkapan layar, batas total 5 MB per kiriman' }
];
const CATATAN = [
  'Hasil analisis AI berupa usulan & rekomendasi valuasi SROI. Selalu verifikasi kesesuaian dengan dokumen RKA/DPA resmi sebelum penetapan anggaran.',
  'CBB Chatbot terintegrasi langsung dengan database arsip dokumen RKA. Gunakan tombol pertanyaan cepat untuk analisis kausalitas SROI dan faktor penyesuaian instan.',
  'Bila menu bertanda Nonaktif, fitur sedang dibatasi oleh Admin. Gunakan menu Laporan bila memerlukan pembukaan akses.',
  'Dokumen yang dihapus pada Arsip akan masuk ke Tab Sampah terlebih dahulu sehingga dapat dipulihkan kapan saja.',
  'Penyimpanan database memberlakukan ambang batas rotasi pada 85% kapasitas storage failover (kuota 5 GB).',
  'Dasbor Admin, Manajemen User, Log SSE Real-time, dan Pool Kunci API Gemini khusus untuk akun berkewenangan Admin atau Moderator.'
];
const SUGGESTIONS = ['unggah', 'chatbot', 'sroi', 'kalkulasi', 'arsip', 'sampah', 'revisi', 'admin', 'backup', 'api', 'laporan'];

/* ── Pencarian ─────────────────────────────────────────────────────────── */
const normalize = (t) =>
  String(t || '')
    .replace(/\*\*/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const PARTS = RAW_PARTS.map((p, pi) => ({
  ...p,
  no: pi + 1,
  steps: p.steps.map((s, si) => ({
    ...s,
    no: si + 1,
    part: p.id,
    hay: normalize([p.title, s.title, s.text, s.keywords, ...s.bullets].join(' '))
  }))
}));

const query = ref('');
const searchEl = ref(null);
const tokens = computed(() => normalize(query.value).split(/\s+/).filter(Boolean));
const hasQuery = computed(() => tokens.value.length > 0);

const visibleParts = computed(() => {
  if (!hasQuery.value) return PARTS;
  return PARTS.map((p) => ({ ...p, steps: p.steps.filter((s) => tokens.value.every((t) => s.hay.includes(t))) })).filter((p) => p.steps.length);
});
const matchCount = computed(() => visibleParts.value.reduce((n, p) => n + p.steps.length, 0));
const totalSteps = PARTS.reduce((n, p) => n + p.steps.length, 0);

function clearSearch() {
  query.value = '';
  searchEl.value?.focus();
}
function jumpToFirstMatch() {
  const first = visibleParts.value[0]?.steps[0];
  if (first) goTo(first.id);
}

/* Teks kaya: **tebal** + sorot kata pencarian. Semua teks di-escape lebih dulu. */
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function highlight(text) {
  if (!hasQuery.value) return esc(text);
  // Cocokkan versi asli teks (tanpa mengubah huruf) terhadap token yang sudah dinormalkan.
  const re = new RegExp('(' + tokens.value.map(reEsc).join('|') + ')', 'gi');
  return text
    .split(re)
    .map((seg, i) => (i % 2 === 1 ? '<mark>' + esc(seg) + '</mark>' : esc(seg)))
    .join('');
}
function rich(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/)
    .map((seg) => (seg.startsWith('**') && seg.endsWith('**') ? '<strong>' + highlight(seg.slice(2, -2)) + '</strong>' : highlight(seg)))
    .join('');
}

/* ── Interaksi ilustrasi Mode ─────────────────────────────────────────── */
const mockMode = ref('mode1');
const activeMode = computed(() => MODES.find((m) => m.id === mockMode.value) || MODES[0]);

/* ── Navigasi + penanda posisi (scrollspy) ────────────────────────────── */
const activeId = ref(PARTS[0].steps[0].id);
const activePartId = computed(() => PARTS.find((p) => p.steps.some((s) => s.id === activeId.value))?.id || PARTS[0].id);

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const step = PARTS.flatMap((p) => p.steps).find((s) => s.id === id);
  if (step) activeId.value = id;
  else {
    const part = PARTS.find((p) => p.id === id);
    if (part) activeId.value = part.steps[0].id;
  }
}

let observer = null;
const inView = new Set();
function setupSpy() {
  observer?.disconnect();
  inView.clear();
  if (typeof IntersectionObserver === 'undefined') return;
  const order = visibleParts.value.flatMap((p) => p.steps.map((s) => s.id));
  if (!order.length) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? inView.add(e.target.id) : inView.delete(e.target.id)));
      const first = order.find((id) => inView.has(id));
      if (first) activeId.value = first;
    },
    { rootMargin: '-100px 0px -55% 0px', threshold: 0 }
  );
  document.querySelectorAll('#petunjuk-root [data-step]').forEach((el) => observer.observe(el));
}
watch(visibleParts, () => nextTick(setupSpy));
onMounted(() => nextTick(setupSpy));
onBeforeUnmount(() => observer?.disconnect());

/* ── Unduh PDF (html2pdf.js sudah menjadi dependensi proyek) ───────────── */
const pdfBusy = ref('');

function buildPdfElement(parts, isAll) {
  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const inline = (t) => String(t).split(/(\*\*[^*]+\*\*)/).map((seg) => (seg.startsWith('**') && seg.endsWith('**') ? '<b>' + esc(seg.slice(2, -2)) + '</b>' : esc(seg))).join('');
  const stepHtml = (s) => `
        <div class="pdf-step" style="margin:0 0 14px;display:flex;gap:10px;page-break-inside:avoid;">
          <div style="width:34px;flex:none;font-size:26pt;font-weight:800;color:#1B4D46;line-height:1;">${s.no}</div>
          <div style="flex:1;">
            <p style="margin:0 0 4px;"><b>${inline(s.title)}</b> ${inline(s.text)}</p>
            ${s.img ? `<img src="${esc(s.img)}" style="width:100%;max-width:150mm;border:1px solid #E6E8EB;margin:4px 0;" />` : ''}
            <ul style="margin:4px 0 0 16px;padding:0;">${s.bullets.map((b) => `<li style="margin:0 0 3px;">${inline(b)}</li>`).join('')}</ul>
          </div>
        </div>`;
  // Judul bagian, ringkasan, dan langkah pertama dijadikan satu blok agar tidak terpisah di pergantian halaman.
  const body = parts
    .map(
      (p) => `
      <div class="pdf-h" style="margin:18px 0 0;page-break-inside:avoid;">
        <div style="margin:0 0 8px;padding:8px 12px;background:#1B4D46;color:#fff;border-radius:6px;">
          <span style="font-size:9pt;opacity:.8;">Bagian ${p.no}</span>
          <div style="font-size:14pt;font-weight:700;">${esc(p.title)}</div>
        </div>
        <p style="margin:0 0 10px;color:#5B6169;">${esc(p.lead)}</p>
        ${stepHtml(p.steps[0])}
      </div>
      ${p.steps.slice(1).map(stepHtml).join('')}`
    )
    .join('');

  // Pembungkus disembunyikan di luar layar; elemen dalamnya yang diklon html2pdf (tanpa gaya luar layar).
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-10000px;top:0;';
  const el = document.createElement('div');
  el.style.cssText = 'width:182mm;background:#fff;color:#1A1D21;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.5;';
  el.innerHTML = `
    <div style="border-bottom:3px solid #C97B3D;padding-bottom:8px;margin-bottom:6px;">
      <div style="font-size:9pt;color:#5B6169;">ASI DARA oleh Bapperida Kabupaten Cirebon</div>
      <div style="font-size:21pt;font-weight:800;color:#1B4D46;">Petunjuk Penggunaan${isAll ? '' : ' (Bagian ' + parts[0].no + ')'}</div>
      <div style="font-size:9pt;color:#5B6169;">Diunduh ${esc(tgl)}</div>
    </div>${body}`;
  wrap.appendChild(el);
  return { wrap, el };
}

async function downloadPdf(scope) {
  if (pdfBusy.value) return;
  const isAll = scope === 'all';
  const parts = isAll ? PARTS : [scope];
  pdfBusy.value = isAll ? 'all' : scope.id;
  const { wrap, el } = buildPdfElement(parts, isAll);
  document.body.appendChild(wrap);
  const filename = isAll ? 'Petunjuk-Penggunaan-ASI-DARA.pdf' : `Petunjuk-Penggunaan-ASI-DARA-Bagian-${scope.no}.pdf`;
  try {
    const { default: html2pdf } = await import('html2pdf.js');
    await html2pdf()
      .set({
        margin: [14, 14, 18, 14],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-step', '.pdf-h'] }
      })
      .from(el)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const total = pdf.internal.getNumberOfPages();
        const w = pdf.internal.pageSize.getWidth();
        const hgt = pdf.internal.pageSize.getHeight();
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(120);
          pdf.text(`ASI DARA - Petunjuk Penggunaan | Halaman ${i} dari ${total}`, w / 2, hgt - 8, { align: 'center' });
        }
      })
      .save();
    showNotification('PDF berhasil dibuat', `${filename} sedang diunduh.`, 'success');
  } catch (err) {
    console.error('Gagal membuat PDF petunjuk:', err);
    showNotification('Gagal membuat PDF', 'Terjadi kendala saat menyiapkan PDF. Muat ulang halaman lalu coba lagi.', 'danger');
  } finally {
    wrap.remove();
    pdfBusy.value = '';
  }
}
</script>

<style>
/* Gaya khusus halaman ini, dibatasi di #petunjuk-root agar tidak mengubah menu lain. */
#petunjuk-root *,
#petunjuk-root *::before,
#petunjuk-root *::after {
  border-width: 0;
  border-style: solid;
  border-color: var(--border-color);
}
#petunjuk-root button {
  font: inherit;
  cursor: pointer;
  background: none;
  color: inherit;
}
#petunjuk-root button:disabled { cursor: not-allowed; }

/* Bilah atas & lencana: teal tetap di terang maupun gelap agar teks putih selalu terbaca. */
#petunjuk-root .pt-bar,
#petunjuk-root .pt-badge { background: #1B4D46; color: #fff; }

/* Latar gambar langkah: teal sangat muda + pola titik ala "retro digital" aplikasi. */
#petunjuk-root .pt-media {
  background-color: rgba(var(--primary-rgb), 0.06);
  background-image: radial-gradient(var(--retro-dot-color, rgba(27, 77, 70, 0.12)) 1px, transparent 1.4px);
  background-size: var(--retro-grid-size, 22px) var(--retro-grid-size, 22px);
}

/* "Jendela" ilustrasi antarmuka */
#petunjuk-root .pt-mock {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  box-shadow: 0 12px 28px -14px rgba(17, 24, 39, 0.35), 0 2px 6px -2px rgba(17, 24, 39, 0.08);
}

/* Penanda "klik/periksa bagian ini" */
#petunjuk-root .pt-hl { outline: 2px solid var(--accent-color); outline-offset: 3px; border-radius: 6px; }
#petunjuk-root .pt-hl-key { outline: 2px solid var(--accent-color); outline-offset: 0; }

#petunjuk-root .pt-field-label {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
#petunjuk-root .pt-donut {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: 9999px;
}
#petunjuk-root .pt-donut::after {
  content: '';
  position: absolute;
  inset: 17px;
  border-radius: 9999px;
  background: var(--bg-tertiary);
}

#petunjuk-root mark {
  background: var(--accent-glow);
  color: inherit;
  border-radius: 3px;
  padding: 0 2px;
  box-shadow: inset 0 -2px 0 var(--accent-color);
}

/* Kolom pencarian & fokus keyboard */
#petunjuk-root .pt-search { border: 0; outline: none; }
#petunjuk-root .pt-search:focus-visible { outline: 3px solid var(--accent-color); outline-offset: 2px; }
#petunjuk-root .pt-focus:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }
#petunjuk-root .pt-focus-light:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
#petunjuk-root .pt-search::-webkit-search-cancel-button { display: none; }

@media (prefers-reduced-motion: reduce) {
  #petunjuk-root * { transition: none !important; animation: none !important; }
}
</style>
