<!--
  BantuanPertanyaan.vue — halaman "Bantuan & Pertanyaan" ASI DARA (Bapperida Kab. Cirebon)

  Pola tampilan mengikuti pusat bantuan Google: header + pencarian besar, tab, banner
  peringatan, artikel (kiri) dengan akordeon langkah, dan daftar artikel populer (kanan).
  Warna & font memakai token global di assets/style.css (--primary-color, --info-color, dst.)
  sehingga tema terang/gelap ikut bekerja. Tidak butuh dependensi tambahan.

  Pemakaian (App.vue, section tab 'faq'):
    <BantuanPertanyaan @navigate="currentTab = $event" />

  Event:
    navigate(tabId) → minta App pindah menu: 'dashboard' | 'analyzer' | 'agentic-ai' |
                      'history' | 'report' (id yang sama dengan currentTab di App.vue).
-->
<template>
  <div>
  <PageHero icon="help-circle" title="Bantuan &amp; Pertanyaan" subtitle="Cari jawaban atau kirim laporan" style="margin-bottom: 16px;" />
  <div class="bp">
    <!-- ══ HEADER + PENCARIAN ══════════════════════════════════════════ -->
    <header class="bp-head">

      <div ref="searchWrap" class="bp-search">
        <div class="bp-search-box">
          <Ico name="search" :size="22" class="bp-search-ico" />
          <input
            v-model="query"
            type="search"
            class="bp-search-input"
            placeholder="Cari bantuan..."
            aria-label="Cari topik bantuan"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            aria-controls="bp-results"
            :aria-expanded="showResults ? 'true' : 'false'"
            :aria-activedescendant="hi >= 0 ? 'bp-opt-' + hi : undefined"
            @input="onSearchInput"
            @focus="resultsOpen = query.trim().length >= 2"
            @keydown.down.prevent="moveHi(1)"
            @keydown.up.prevent="moveHi(-1)"
            @keydown.enter.prevent="pickHighlighted"
            @keydown.esc="resultsOpen = false"
          />
          <button v-if="query" type="button" class="bp-icon-btn bp-search-clear" aria-label="Hapus pencarian" @click="clearSearch">
            <Ico name="x" :size="20" />
          </button>
        </div>

        <div v-if="showResults" id="bp-results" class="bp-results">
          <ul v-if="results.length" role="listbox" aria-label="Hasil pencarian">
            <li
              v-for="(r, i) in results"
              :id="'bp-opt-' + i"
              :key="r.a.id"
              role="option"
              class="bp-res"
              :class="{ 'is-hi': hi === i }"
              :aria-selected="hi === i"
              @mousedown.prevent="pick(r)"
              @mousemove="hi = i"
            >
              <Ico name="file" :size="20" class="bp-res-ico" />
              <div class="bp-res-text">
                <div class="bp-res-title">{{ r.a.sidebar }}</div>
                <div class="bp-res-desc">{{ r.snippet }}</div>
              </div>
            </li>
          </ul>
          <div v-else class="bp-noresult">
            <p class="bp-noresult-title">Tidak ada topik yang cocok dengan “{{ query.trim() }}”</p>
            <p class="bp-noresult-text">Coba kata kunci yang lebih singkat, misalnya “unggah”, “edit”, atau “menu nonaktif”. Jika masalah Anda belum terjawab, kirim laporan ke admin.</p>
            <button type="button" class="bp-btn bp-btn-primary" @mousedown.prevent="go('report')">Kirim laporan</button>
          </div>
        </div>
      </div>
    </header>

    <!-- ══ TAB + NOTIFIKASI ════════════════════════════════════════════ -->
    <div class="bp-navrow">
      <nav class="bp-tabs" role="tablist" aria-label="Bagian bantuan">
        <button
          v-for="(t, i) in TABS"
          :id="'bp-tab-' + t.id"
          :key="t.id"
          type="button"
          role="tab"
          class="bp-tab"
          :class="{ 'is-active': activeTab === t.id }"
          :aria-selected="activeTab === t.id"
          :aria-controls="'bp-panel-' + t.id"
          :tabindex="activeTab === t.id ? 0 : -1"
          @click="activeTab = t.id"
          @keydown="onTabKey($event, i)"
        >
          {{ t.label }}
        </button>
      </nav>

    </div>

    <!-- ══ PANEL: PUSAT BANTUAN ════════════════════════════════════════ -->
    <section v-if="activeTab === 'pusat'" id="bp-panel-pusat" role="tabpanel" aria-labelledby="bp-tab-pusat" class="bp-panel">
      <div class="bp-grid">
        <div class="bp-main">
      <!-- Banner peringatan sistem -->
      <div v-if="bannerVisible" class="bp-banner" role="status">
        <Ico name="alert" :size="24" class="bp-banner-ico" />
        <p class="bp-banner-text">{{ BANNER.text }}</p>
        <button type="button" class="bp-banner-link" @click="openArticle(BANNER.article)">{{ BANNER.linkLabel }}</button>
        <button type="button" class="bp-icon-btn bp-banner-x" aria-label="Tutup pemberitahuan" @click="bannerVisible = false">
          <Ico name="x" :size="20" />
        </button>
      </div>

        <!-- Artikel yang sedang dibuka -->
        <article ref="articleEl" class="bp-article" aria-labelledby="bp-article-title" @click="onArticleClick">
          <h2 id="bp-article-title" class="bp-h1">{{ article.title }}</h2>

          <p v-for="(p, i) in article.intro" :key="'i' + i" class="bp-p" v-html="fmt(p)"></p>

          <p v-if="article.note" class="bp-p">
            <strong>Penting:</strong>{{ ' ' }}<span v-html="fmt(article.note.text)"></span>
            <template v-if="article.note.link">{{ ' ' }}<a href="#" class="bp-link" @click.prevent="openArticle(article.note.link.article)">{{ article.note.link.label }}</a>.</template>
          </p>

          <div class="bp-acc">
            <div v-for="(s, i) in article.sections" :key="article.id + i" class="bp-acc-item">
              <h3 class="bp-acc-h">
                <button
                  :id="'bp-acc-btn-' + i"
                  type="button"
                  class="bp-acc-btn"
                  :aria-expanded="isOpen(i) ? 'true' : 'false'"
                  :aria-controls="'bp-acc-panel-' + i"
                  @click="toggle(i)"
                >
                  <span>{{ s.title }}</span>
                  <Ico name="chevron" :size="24" class="bp-acc-chev" :class="{ 'is-open': isOpen(i) }" />
                </button>
              </h3>
              <div
                :id="'bp-acc-panel-' + i"
                class="bp-acc-panel"
                :class="{ 'is-open': isOpen(i) }"
                role="region"
                :aria-labelledby="'bp-acc-btn-' + i"
              >
                <div class="bp-acc-inner">
                  <div class="bp-acc-body">
                    <p v-for="(b, j) in s.body || []" :key="'b' + j" class="bp-p" v-html="fmt(b)"></p>
                    <ol v-if="s.steps" class="bp-steps">
                      <li v-for="(st, j) in s.steps" :key="'s' + j" v-html="fmt(st)"></li>
                    </ol>
                    <ul v-if="s.bullets" class="bp-bullets">
                      <li v-for="(bl, j) in s.bullets" :key="'l' + j" v-html="fmt(bl)"></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="bp-article-foot">
            <div v-if="article.actions?.length" class="bp-actions">
              <button
                v-for="(ac, i) in article.actions"
                :key="ac.label"
                type="button"
                class="bp-btn"
                :class="i === 0 ? 'bp-btn-primary' : 'bp-btn-ghost'"
                @click="go(ac.tab)"
              >
                {{ ac.label }}
              </button>
            </div>
            <p class="bp-foot-help">
              Masalah Anda belum terjawab?
              <a href="#" class="bp-link" @click.prevent="go('report')">Kirim laporan ke admin</a>.
            </p>
          </footer>
        </article>
        </div>

        <!-- Sidebar: artikel populer -->
        <aside class="bp-side" aria-labelledby="bp-side-title">
          <h2 id="bp-side-title" class="bp-side-h">Artikel populer</h2>
          <ul class="bp-side-list">
            <li v-for="a in ARTICLES" :key="a.id">
              <a
                href="#"
                class="bp-side-link"
                :class="{ 'is-current': a.id === articleId }"
                :aria-current="a.id === articleId ? 'page' : undefined"
                @click.prevent="openArticle(a.id)"
              >
                <Ico name="file" :size="24" class="bp-side-ico" />
                <span>{{ a.sidebar }}</span>
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <!-- ══ PANEL: KOMUNITAS / FORUM ════════════════════════════════════ -->
    <section v-else-if="activeTab === 'forum'" id="bp-panel-forum" role="tabpanel" aria-labelledby="bp-tab-forum" class="bp-panel bp-simple">
      <h2 class="bp-h1">Forum diskusi belum tersedia</h2>
      <p class="bp-p">
        Sampai forum dibuka, sampaikan pertanyaan, kendala, atau saran Anda lewat menu <strong>Laporan</strong>. Laporan langsung masuk ke aplikasi admin dan ditindaklanjuti lewat WhatsApp atau email yang Anda isi.
      </p>
      <dl class="bp-defs">
        <div v-for="c in REPORT_KINDS" :key="c.name" class="bp-def">
          <dt>{{ c.name }}</dt>
          <dd>{{ c.desc }}</dd>
        </div>
      </dl>
      <div class="bp-actions">
        <button type="button" class="bp-btn bp-btn-primary" @click="go('report')">Buka formulir Laporan</button>
        <button type="button" class="bp-btn bp-btn-ghost" @click="activeTab = 'pusat'">Kembali ke Pusat Bantuan</button>
      </div>
    </section>

    <!-- ══ PANEL: PANDUAN MULAI ════════════════════════════════════════ -->
    <section v-else id="bp-panel-panduan" role="tabpanel" aria-labelledby="bp-tab-panduan" class="bp-panel bp-simple">
      <h2 class="bp-h1">Panduan mulai</h2>
      <p class="bp-p">Empat langkah dari dokumen RKA sampai laporan hasil analisis.</p>
      <ol class="bp-quick">
        <li v-for="(q, i) in QUICK" :key="q.title" class="bp-quick-item">
          <span class="bp-quick-n" aria-hidden="true">{{ i + 1 }}</span>
          <div class="bp-quick-text">
            <h3 class="bp-quick-title">{{ q.title }}</h3>
            <p class="bp-quick-desc">{{ q.desc }}</p>
          </div>
          <div class="bp-quick-cta">
            <button v-if="q.tab" type="button" class="bp-btn bp-btn-ghost" @click="go(q.tab)">{{ q.cta }}</button>
            <button v-else type="button" class="bp-btn bp-btn-ghost" @click="openArticle(q.article)">{{ q.cta }}</button>
          </div>
        </li>
      </ol>
    </section>
  </div>
  </div>
</template>

<script setup>
import { h, ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import PageHero from './PageHero.vue';

const emit = defineEmits(['navigate']);
const go = (tab) => emit('navigate', tab);

/* ── Ikon inline (tanpa dependensi; gaya garis 24px) ─────────────────── */
const ICONS = {
  search: [['circle', { cx: 11, cy: 11, r: 7.5 }], ['path', { d: 'm21 21-4.3-4.3' }]],
  bell: [['path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }], ['path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }]],
  x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
  alert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4' }], ['path', { d: 'M12 17h.01' }]],
  file: [['rect', { x: 4, y: 3, width: 16, height: 18, rx: 2.5 }], ['path', { d: 'M8 8h8' }], ['path', { d: 'M8 12h8' }], ['path', { d: 'M8 16h5' }]],
  chevron: [['path', { d: 'm6 9 6 6 6-6' }]]
};
const Ico = (props) =>
  h(
    'svg',
    {
      width: props.size || 20,
      height: props.size || 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false'
    },
    (ICONS[props.name] || []).map(([tag, attrs]) => h(tag, attrs))
  );
Ico.props = ['name', 'size'];

/* ── Konten ──────────────────────────────────────────────────────────────
   Sintaks teks:  **tebal**   dan   [[id-artikel|teks tautan]]
   Semua isi di bawah mengacu pada menu & tombol yang benar-benar ada di aplikasi. */
const TABS = [
  { id: 'pusat', label: 'Pusat Bantuan' },
  { id: 'forum', label: 'Komunitas / Forum' },
  { id: 'panduan', label: 'Panduan Mulai' }
];

// Banner sistem. Ganti teks/tautan sesuai kebutuhan, mis. pengumuman pemeliharaan:
//   text: 'Sistem ASI DARA sedang dalam pemeliharaan rutin. Sebagian menu mungkin tidak dapat diakses.'
const BANNER = {
  text: 'Pastikan berkas RKA berformat PDF sebelum diunggah ke menu Unggah Berkas RKA. Simulasi Percakapan Agen AI (CBB Chatbot) kini terhubung langsung dengan dokumen arsip untuk analisis kausalitas SROI, evaluasi formula, dan regulasi.',
  linkLabel: 'Lihat panduan chatbot',
  article: 'chatbot'
};

const REPORT_KINDS = [
  { name: 'Kendala Teknis', desc: 'Berkas gagal diunggah, halaman macet, atau data tidak muncul.' },
  { name: 'Bug Aplikasi', desc: 'Tombol, perhitungan, atau tampilan yang tidak bekerja sebagaimana mestinya.' },
  { name: 'Masukan & Saran', desc: 'Usulan fitur baru atau perbaikan antarmuka pengguna.' },
  { name: 'Permintaan Bantuan', desc: 'Meminta pengaktifan menu nonaktif atau bimbingan penggunaan.' },
  { name: 'Lainnya', desc: 'Pertanyaan atau laporan umum lainnya seputar sistem ASI DARA.' }
];

const QUICK = [
  { title: 'Periksa Dasbor Utama', desc: 'Lihat status kesiapan Gemini 2.5 Flash, jumlah arsip dokumen tersimpan, dan rata-rata kecepatan analisis.', cta: 'Buka Dasbor Utama', tab: 'main-dashboard' },
  { title: 'Unggah Dokumen RKA', desc: 'Pilih berkas PDF digital (maks 100 MB) di menu Unggah Berkas RKA dan pantau antrean pemrosesan otomatis.', cta: 'Buka Unggah Berkas RKA', tab: 'dashboard' },
  { title: 'CBB Chatbot & Integrasi Arsip', desc: 'Pilih dokumen dari arsip untuk analisis kausalitas SROI, kalkulasi anggaran interaktif, dan prompt chips regulasi.', cta: 'Buka CBB Chatbot', tab: 'agentic-ai' },
  { title: 'Baca Hasil SROI & Indikator', desc: 'Tinjau valuasi SROI, 5 faktor penyesuaian, kesesuaian target kinerja, serta rekomendasi efisiensi belanja.', cta: 'Buka Hasil Analisis', tab: 'analyzer' },
  { title: '4 Metode Edit & Multi-Versi', desc: 'Gunakan Edit Manual, Edit dengan AI, Unggah Ulang PDF, atau Muat Ulang PDF untuk membentuk versi baru.', cta: 'Baca panduan edit', article: 'ubah' },
  { title: 'Kelola Arsip & Tab Sampah', desc: 'Saring OPD/Tahun, seleksi massal (Muat Ulang Semua/Terpilih), pulihkan dokumen dari Kotak Sampah, dan ekspor database.', cta: 'Buka Arsip Dokumen RKA', tab: 'history' },
  { title: 'Dasbor Admin & Audit Sistem', desc: 'Bagi Admin/Moderator: pantau kuota storage 85%, SSE log real-time, pool kunci API Gemini, dan tindak lanjuti laporan via WhatsApp.', cta: 'Buka Dasbor Admin', tab: 'admin-dashboard' }
];

const ARTICLES = [
  {
    id: 'chatbot',
    sidebar: 'Mempelajari Fitur CBB Chatbot Bapperida & Integrasi Arsip',
    title: 'Mempelajari Fitur Simulasi Percakapan Agen AI (CBB Chatbot Bapperida)',
    keywords: 'cbb chatbot ai agen bot tanya jawab sroi arsip rka 5 faktor deadweight formula kalkulasi konfeti regulasi permendagri 77 ssh sbm rpjmd rkpd chip salin',
    intro: [
      '**Simulasi Percakapan Agen AI (CBB Chatbot)** adalah asisten AI interaktif Bapperida Kabupaten Cirebon yang terintegrasi langsung dengan database arsip dokumen RKA ASI DARA.',
      'Chatbot ini dirancang untuk menjawab pertanyaan kausalitas SROI secara mendalam, melakukan perhitungan formula anggaran interaktif dengan kartu metrik khusus, serta memberikan konsultasi regulasi perencanaan dan keuangan daerah.'
    ],
    note: { text: 'Pilih dokumen dari dropdown arsip untuk memuat konteks subkegiatan dan rasio SROI secara instan. Hasil analisis AI berupa rekomendasi yang perlu diverifikasi dengan dokumen perencanaan resmi.' },
    sections: [
      {
        title: 'Integrasi Arsip Dokumen RKA & Lencana SROI',
        body: ['Chatbot dapat langsung membaca konteks dokumen perencanaan yang sudah pernah dianalisis tanpa perlu mengunggah ulang berkas.'],
        steps: [
          'Buka menu **Simulasi Percakapan Agen AI** di navigasi utama.',
          'Klik dropdown **Pilih Dokumen Arsip** pada bilah atas percakapan dan pilih subkegiatan yang ingin dibahas.',
          'Lencana status otomatis menampilkan nilai rasio SROI terkini (**Layak**, **Cukup**, atau **Kurang**).',
          'Gunakan tombol **Reset Konteks** jika ingin kembali ke mode percakapan konsultasi umum.'
        ]
      },
      {
        title: '3 Tombol Pertanyaan Cepat Analisis SROI',
        body: ['Saat dokumen arsip dipilih, tiga tombol pertanyaan analisis cepat otomatis muncul di atas kolom ketik pesan:'],
        bullets: [
          '**💡 Mengapa Rasio SROI bernilai demikian?:** Memberikan penjelasan naratif mendalam mengenai faktor pemicu nilai rasio SROI terhadap pagu anggaran.',
          '**⚖️ Rincian 5 Faktor Penyesuaian:** Membedah persentase bobot Deadweight, Attribution, Displacement, Drop-off, dan Unintended Outcomes.',
          '**📝 Rekomendasi Strategis AI:** Memberikan usulan konkret perbaikan efisiensi pos belanja dan penguatan indikator outcome program.'
        ]
      },
      {
        title: 'Kalkulasi Anggaran Interaktif & Animasi Konfeti',
        body: ['Anda dapat meminta AI melakukan perhitungan formula anggaran secara dinamis (misal: *"Hitung rasio SROI jika pagu 250 jt dan dampak sosial 420 jt"* atau evaluasi realisasi belanja).'],
        bullets: [
          'AI menyajikan **Kartu Kalkulasi** interaktif dengan latar khusus, menampilkan formula matematika, substitusi angka, dan metrik hasil kalkulasi.',
          'Efek animasi **konfeti perayaan** otomatis memeriahkan layar apabila rasio bernilai **Layak** (\u2265 1,0) atau capaian dinilai **Sangat Efektif**.',
          'Kartu kalkulasi dilengkapi catatan kritis evaluasi dan rekomendasi penyesuaian belanja.'
        ]
      },
      {
        title: 'Konsultasi Regulasi & Prompt Chips Cepat',
        body: ['Ajukan pertanyaan seputar regulasi perencanaan dan tata kelola anggaran daerah (Permendagri 77/2020, SIPD-RI, SSH, SBM, Musrenbang).'],
        bullets: [
          'Manfaatkan **Prompt Chips** sekali-klik: **RPJMD vs RKPD**, **Aturan SBM/SSH**, **Geseran Belanja**, dan **KUA-PPAS**.',
          'Gunakan tombol **Salin** pada gelembung jawaban untuk menyalin narasi pertimbangan AI ke dokumen laporan Anda.',
          'Gunakan tombol **Bersihkan / Hapus Histori** jika ingin memulai sesi konsultasi baru dari awal.'
        ]
      }
    ],
    actions: [{ label: 'Buka CBB Chatbot', tab: 'agentic-ai' }]
  },
  {
    id: 'unggah',
    sidebar: 'Cara mengunggah dan memproses dokumen RKA',
    title: 'Cara Mengunggah & Menganalisis Dokumen RKA di ASI DARA',
    keywords: 'unggah upload pdf berkas dokumen rka analisis antrean proses hasil mulai opd pagu otomatis render cold start',
    intro: [
      'Anda mengunggah dokumen RKA berformat PDF lewat menu **Unggah Berkas RKA**. ASI DARA mengekstrak teks dokumen di browser, kemudian model AI menyusun Analisis Valuasi Prakiraan Dampak Program (SROI). Beberapa berkas dapat dipilih sekaligus untuk diproses berurutan.',
      'Nama Perangkat Daerah (OPD) dan Pagu Anggaran terdeteksi secara otomatis dari isi dokumen RKA.'
    ],
    note: {
      text: 'Jika server baru saja dinyalakan dari mode tidur (sleep/Render cold-start), tunggu 30–60 detik hingga lencana menunjukkan server siap.',
      link: { label: 'Pelajari kendala teknis & penanganan', article: 'gagal' }
    },
    sections: [
      {
        title: 'Menyiapkan dokumen RKA',
        steps: [
          'Siapkan dokumen RKA/DPA SKPD Kabupaten Cirebon dalam format **PDF** digital asli (maksimal **100 MB** per berkas).',
          'Pastikan teks pada PDF dapat diseleksi (bukan hasil scan foto atau gambar yang tidak terbaca).',
          'Beberapa dokumen RKA dapat diunggah sekaligus secara batch.'
        ]
      },
      {
        title: 'Mengunggah & memantau antrean batch',
        steps: [
          'Buka menu **Unggah Berkas RKA** di navigasi sidebar kiri.',
          'Klik tombol **Pilih Dokumen RKA** atau seret dan lepas berkas PDF ke kotak area unggah.',
          'Setiap berkas menampilkan nama dokumen, persentase kemajuan (0%–100%), dan status antrean.',
          'Jangan menutup atau menyegarkan (refresh) tab peramban selama antrean masih berjalan.'
        ]
      },
      {
        title: 'Membuka hasil analisis',
        steps: [
          'Setelah antrean selesai, klik **Lihat Hasil** atau buka menu **Hasil Analisis**.',
          'Halaman analisis memuat rincian Rasio SROI, 5 faktor penyesuaian, indikator capaian, kesesuaian anggaran, dan rekomendasi pos belanja.'
        ]
      }
    ],
    actions: [
      { label: 'Buka Unggah Berkas RKA', tab: 'dashboard' },
      { label: 'Buka Hasil Analisis', tab: 'analyzer' }
    ]
  },
  {
    id: 'sroi',
    sidebar: 'Memahami Rasio Nilai Prakiraan Dampak (SROI) & Rekomendasi Belanja',
    title: 'Memahami Rasio Nilai Prakiraan Dampak (SROI) & Rekomendasi Belanja',
    keywords: 'sroi nilai prakiraan dampak rasio layak cukup kurang deadweight attribution displacement drop off unintended outcomes discount rate rekomendasi belanja efisien inefisien',
    intro: [
      '**Rasio Nilai Prakiraan Dampak (SROI)** mengukur perbandingan antara total nilai dampak sosial bersih yang dihasilkan dengan nilai pagu anggaran yang diinvestasikan pada subkegiatan tersebut.'
    ],
    note: { text: 'Angka rasio SROI memberikan gambaran efektivitas sosial anggaran untuk membantu pengambilan keputusan TAPD.' },
    sections: [
      {
        title: 'Kriteria Status Rasio SROI',
        bullets: [
          '**Layak (\u2265 1,0 - Hijau):** Nilai dampak sosial yang dihasilkan melampaui besaran pagu anggaran input.',
          '**Cukup (0,6 \u2013 0,99 - Kuning):** Nilai dampak sosial mendekati atau sebanding dengan nilai pagu anggaran.',
          '**Kurang (< 0,6 - Merah):** Alokasi anggaran dinilai kurang efisien dalam menghasilkan dampak sosial terukur.'
        ]
      },
      {
        title: '5 Faktor Penyesuaian Dampak Sosial',
        bullets: [
          '**Deadweight (Maks. 40%):** Persentase dampak yang akan tetap terjadi secara alami sekalipun kegiatan tidak dilaksanakan.',
          '**Attribution:** Persentase dampak yang dihasilkan oleh kontribusi pihak, program, atau instansi lain.',
          '**Displacement:** Persentase dampak yang menggeser atau menggantikan manfaat positif di sektor lain.',
          '**Drop-off:** Persentase penurunan nilai manfaat dari waktu ke waktu seiring berjalannya tahun anggaran.',
          '**Unintended Outcomes:** Dampak sampingan (positif maupun negatif) yang tidak diperhitungkan sebelumnya.'
        ]
      },
      {
        title: 'Rekomendasi Komposisi Belanja',
        body: ['Diagram lingkaran membandingkan struktur belanja sebelum dan sesudah rekomendasi AI. Tabel rincian rekening menandai pos belanja **Efisien** atau **Inefisien** beserta nominal usulan pengurangannya.']
      }
    ],
    actions: [{ label: 'Buka Hasil Analisis', tab: 'analyzer' }]
  },
  {
    id: 'ubah',
    sidebar: '4 metode mengedit hasil analisis evaluasi RKA & kelola versi',
    title: '4 Metode Mengubah Hasil Analisis Evaluasi RKA & Kelola Multi-Versi',
    keywords: 'edit ubah revisi manual ai versi unggah ulang muat ulang analisis ulang deadweight parameter sroi disahkan perbaiki koreksi',
    intro: [
      'Terdapat **4 metode** untuk memperbarui data analisis: **Edit Manual**, **Edit dengan AI**, **Unggah Ulang PDF**, dan **Muat Ulang PDF**. Keempat fitur dapat diakses lewat bilah tombol di bagian atas halaman Hasil Analisis.',
      'Setiap pembaruan otomatis disimpan sebagai **versi baru** pada riwayat dokumen, sehingga draf analisis sebelumnya tetap tersimpan utuh dan aman.'
    ],
    note: {
      text: 'Dokumen yang diedit akan memperbarui angka SROI dan pagu pada seluruh tampilan. Jika dokumen belum tersimpan di arsip, buka terlebih dahulu lewat menu **Arsip Dokumen RKA**.'
    },
    sections: [
      {
        title: '1. Edit Manual',
        steps: [
          'Buka dokumen dari **Arsip Dokumen RKA** lalu klik **Lihat Analisis**.',
          'Klik tombol **Edit Manual** di bilah atas.',
          'Pilih bagian formulir: **Identitas & Pagu**, **Indikator Kinerja**, **Komponen Belanja**, atau **Parameter SROI**.',
          'Tinjau tab **Ringkasan & Simpan** untuk memverifikasi perbedaan angka, lalu simpan sebagai versi baru.'
        ]
      },
      {
        title: '2. Edit dengan AI (Prompt Reviu)',
        steps: [
          'Klik tombol **Edit dengan AI** pada bilah atas.',
          'Ketik instruksi perbaikan dalam bahasa alami (maks. 2.000 karakter), misal: *"Kurangi belanja konsumsi rapat 30% dan alihkan ke belanja modal sarana"*.',
          'Tentukan bagian mana saja yang diizinkan untuk diubah oleh AI.',
          'Tinjau perbandingan hasil sebelum dan sesudah, lalu klik simpan hasil revisi.'
        ]
      },
      {
        title: '3. Unggah Ulang PDF (Revisi Baru)',
        steps: [
          'Klik **Unggah Ulang PDF** untuk menganalisis ulang dokumen menggunakan berkas PDF revisi baru dari komputer Anda (maksimal 25 MB).',
          'Sangat ideal jika SKPD telah menerbitkan berkas PDF RKA pergeseran atau perubahan.'
        ]
      },
      {
        title: '4. Muat Ulang PDF (Re-analisis Server)',
        steps: [
          'Klik **Muat Ulang PDF** untuk memproses ulang berkas PDF yang sudah tersimpan di server menggunakan model AI terbaru.',
          'Fitur ini memperbarui analisis lama tanpa perlu mencari dan mengunggah kembali berkas PDF asli.'
        ]
      },
      {
        title: 'Pengelolaan & Perbandingan Multi-Versi',
        body: ['Gunakan menu dropdown **Versi** di samping judul subkegiatan untuk berpindah antar-versi analisis kapan saja guna meninjau evolusi perbaikan anggaran.']
      }
    ],
    actions: [{ label: 'Buka Arsip Dokumen RKA', tab: 'history' }]
  },
  {
    id: 'arsip-sampah',
    sidebar: 'Pencarian arsip, aksi massal & Tab Sampah (Trash)',
    title: 'Pencarian Arsip Dokumen RKA, Aksi Massal & Kotak Sampah (Trash)',
    keywords: 'arsip dokumen rka pencarian filter opd tahun urutkan sortir reset muat ulang semua terpilih hapus terpilih kotak sampah trash soft delete pulihkan restore hapus permanen kosongkan',
    intro: [
      'Menu **Arsip Dokumen RKA** menyimpan seluruh dokumen perencanaan yang pernah diunggah dan dianalisis.',
      'Sistem dilengkapi fitur pencarian presisi, filter ganda, seleksi massal, dan **Kotak Sampah (Trash)** yang melindungi dokumen dari penghapusan tidak disengaja.'
    ],
    note: { text: 'Dokumen yang dihapus dari arsip aktif tidak langsung hilang permanen, melainkan masuk ke Tab Sampah terlebih dahulu.' },
    sections: [
      {
        title: 'Pencarian Presisi & Filter Ganda',
        bullets: [
          'Ketik kata kunci nama OPD, nama Subkegiatan, atau Tahun Anggaran pada kolom pencarian.',
          'Gunakan filter dropdown **Perangkat Daerah (OPD)** dan **Tahun Anggaran** untuk mempersempit daftar.',
          'Atur urutan daftar lewat menu **Urutkan** (Terbaru, Terlama, OPD A–Z, OPD Z–A, atau Tahun).',
          'Klik tombol **Reset Filter** untuk mengembalikan tampilan ke daftar seluruh dokumen.'
        ]
      },
      {
        title: 'Seleksi Massal & Tombol Muat Ulang Terpilih',
        bullets: [
          'Gunakan kotak centang (checkbox) pada baris tabel untuk memilih satu atau beberapa dokumen sekaligus.',
          'Tombol aksi atas otomatis menyesuaikan: jika tidak ada centang tampil **Muat Ulang Semua (N)**, dan jika dicentang berubah menjadi **Muat Ulang Terpilih (N)**.',
          'Gunakan tombol **Hapus Terpilih** untuk memindahkan seluruh dokumen yang dicentang ke Kotak Sampah sekaligus.'
        ]
      },
      {
        title: 'Kotak Sampah (Trash) & Pemulihan Dokumen',
        bullets: [
          'Klik tab **Sampah** di bilah atas halaman Arsip Dokumen untuk melihat dokumen yang telah dihapus.',
          'Klik tombol **Pulihkan** pada baris dokumen untuk mengembalikannya ke tab Arsip Aktif lengkap dengan seluruh riwayat versinya.',
          'Klik **Hapus Permanen** atau **Kosongkan Sampah** untuk menghapus dokumen secara permanen dari server database.'
        ]
      }
    ],
    actions: [{ label: 'Buka Arsip Dokumen RKA', tab: 'history' }]
  },
  {
    id: 'unduh',
    sidebar: 'Mengunduh laporan analisis, ekspor JSON & backup',
    title: 'Mengunduh Laporan Analisis, Ekspor Database JSON & Backup/Merge',
    keywords: 'unduh download laporan html json backup cadangan ekspor zip pemulihan arsip simpan merge tambah',
    intro: [
      'Dokumen hasil analisis dapat diunduh sebagai berkas **HTML** mandiri interaktif, sedangkan data arsip dapat diekspor ke format **JSON** atau dicadangkan penuh (Zip/JSON).'
    ],
    note: { text: 'Berkas laporan HTML dan JSON memuat data perencanaan daerah. Simpan dan distribusikan hanya kepada pihak yang berwenang.' },
    sections: [
      {
        title: 'Mengunduh laporan satu dokumen (HTML & Cetak PDF)',
        steps: [
          'Buka dokumen dari **Arsip Dokumen RKA** dan klik **Lihat Analisis**.',
          'Klik tombol **Unduh Laporan** pada bilah atas.',
          'Berkas laporan disimpan dalam format **HTML** mandiri interaktif yang dapat dibuka langsung tanpa sambungan internet.',
          'Untuk mencetak atau menyimpan sebagai PDF resmi, buka berkas HTML tersebut di peramban, tekan **Ctrl+P**, lalu pilih **Simpan sebagai PDF**.'
        ]
      },
      {
        title: 'Mengekspor database ke JSON',
        steps: [
          'Buka menu **Arsip Dokumen RKA**.',
          'Klik tombol **Ekspor Full Database (JSON)**.',
          'Seluruh dokumen beserta parameter SROI, riwayat versi, dan komponen belanja akan terunduh dalam satu berkas JSON.'
        ]
      },
      {
        title: 'Backup & Pemulihan (Fitur Merge Tanpa Menimpa)',
        steps: [
          'Pada menu **Arsip Dokumen RKA**, klik tombol **Backup & Pemulihan**.',
          'Pilih berkas cadangan (Zip, JSON, atau HTML Converter) dari komputer Anda.',
          'Gunakan opsi **Merge (Tambah ke Arsip)** untuk menambahkan dokumen dari file cadangan ke sistem tanpa menimpa data yang sudah ada.'
        ]
      }
    ],
    actions: [{ label: 'Buka Arsip Dokumen RKA', tab: 'history' }]
  },
  {
    id: 'gagal',
    sidebar: 'Solusi jika dokumen RKA gagal diunggah atau dianalisis',
    title: 'Solusi Jika Dokumen RKA Gagal Diunggah, Dianalisis, atau Server Tertidur',
    keywords: 'gagal error tidak bisa macet lama loading server render sleep cold start pdf ditolak memproses menyimpan api key gemini rusak kosong nonaktif',
    intro: [
      'Jika sebuah berkas gagal diunggah atau dianalisis, antrean akan menampilkan status kesalahan disertai petunjuk penanganan. Simak solusi kendala umum berikut ini.'
    ],
    note: {
      text: 'Catat nama berkas dan rincian notifikasi kesalahan sebelum melapor ke Admin.',
      link: { label: 'Pelajari cara menghubungi admin', article: 'admin' }
    },
    sections: [
      {
        title: 'Layar "Menyiapkan Server…" (Server Sleep / Render Cold Start)',
        bullets: [
          'Server backend ASI DARA berjalan di infrastruktur cloud yang dapat memasuki mode tidur otomatis saat tidak ada aktivitas.',
          'Bila muncul indikator persiapan server, tunggu **30–60 detik** tanpa memuat ulang halaman browser agar proses cold-start selesai.',
          'Setelah indikator berubah menjadi hijau (**Server & AI Online**), dokumen dapat diproses secara normal.'
        ]
      },
      {
        title: 'Berkas tidak bisa dipilih, ditolak, atau format tidak didukung',
        bullets: [
          'Pastikan berkas berformat **.pdf** pada menu Unggah Berkas RKA dengan ukuran maksimal **100 MB**.',
          'Gunakan PDF digital asli dari SIPD-RI atau sistem perencanaan yang teksnya dapat diseleksi (bukan hasil foto kamera atau scan gambar buram).',
          'Untuk Unggah Ulang PDF pada halaman Hasil Analisis, batas ukuran berkas maksimal **25 MB**.'
        ]
      },
      {
        title: 'Pesan kesalahan kuota API Key Gemini atau Rate-Limit',
        bullets: [
          'Jika muncul pesan mengenai kuota API Key Gemini habis, hubungi Administrator.',
          'Administrator dapat menambahkan kunci baru atau mengaktifkan rotasi multi-kunci pada tab **Kunci API** di Dasbor Admin.'
        ]
      },
      {
        title: 'Data indikator kinerja atau SROI belum terisi',
        body: ['Jika dokumen dianalisis sebelum pembaruan sistem dan data tampak kosong, buka dokumen dari Arsip Dokumen RKA lalu gunakan tombol **Muat Ulang PDF** atau sesuaikan lewat **Edit Manual**.']
      },
      {
        title: 'Menu terkunci atau bertanda lencana Nonaktif',
        body: ['Jika menu yang ingin Anda gunakan bertanda **Nonaktif**, fitur tersebut sedang dibatasi sementara oleh Administrator. Klik menu **Laporan** untuk mengajukan permohonan pembukaan akses.']
      }
    ],
    actions: [{ label: 'Kirim laporan ke admin', tab: 'report' }]
  },
  {
    id: 'indikator',
    sidebar: 'Memahami indikator dan target kinerja pada hasil analisis',
    title: 'Memahami Indikator Capaian dan Target Kinerja pada Hasil Analisis',
    keywords: 'indikator target kinerja tolok ukur kesesuaian anggaran outcome output capaian level sasaran tujuan',
    intro: [
      'Bagian **Indikator & Target Kinerja** pada halaman hasil analisis menampilkan tolok ukur dan target capaian dari dokumen RKA/DPA, disusul penilaian kecukupan anggaran secara objektif.'
    ],
    sections: [
      {
        title: 'Membaca Target Kinerja per Indikator',
        body: ['Setiap kartu merinci hierarki level perencanaan (**Tujuan**, **Sasaran**, **Program**, **Kegiatan**), nilai **target** capaian kuantitatif/kualitatif, serta **tolok ukur** indikator outcome dan output.']
      },
      {
        title: 'Membaca Kesesuaian Anggaran & Proporsionalitas Pagu',
        body: ['Sistem menyajikan analisis kecukupan anggaran tahun berjalan terhadap target output, mencakup penjelasan proporsionalitas alokasi belanja serta potensi risiko kekurangan anggaran.']
      },
      {
        title: 'Memperbaiki indikator yang keliru',
        steps: [
          'Klik tombol **Edit Manual** pada bilah atas halaman Hasil Analisis.',
          'Buka tab **Indikator Kinerja**, sesuaikan tolok ukur atau target capaian yang diinginkan.',
          'Buka tab **Ringkasan & Simpan** lalu simpan sebagai versi dokumen baru.'
        ]
      }
    ],
    actions: [{ label: 'Buka Hasil Analisis', tab: 'analyzer' }]
  },
  {
    id: 'admin-menu',
    sidebar: 'Panduan 8 Tab Dasbor Admin, Manajemen User & Audit Sistem',
    title: 'Panduan Lengkap 8 Fitur Dasbor Admin, Manajemen User & Audit Sistem',
    keywords: 'admin dasbor audit storage failover rotasi 85 percent gemini api key openai pool neon postgresql user role password toggle menu sakelar sse live logs backup snapshot laporan whatsapp wa me setting',
    intro: [
      '**Dasbor Admin** khusus diakses oleh pengguna berkewenangan **Admin** atau **Moderator** untuk memantau kesehatan server, audit aktivitas real-time SSE, manajemen akun, rotasi pool kunci API, kontrol sakelar menu, dan penanganan laporan kendala pengguna via WhatsApp.'
    ],
    note: { text: 'Perubahan konfigurasi di Dasbor Admin berdampak secara global ke seluruh pengguna aplikasi.' },
    sections: [
      {
        title: '1. Tab Statistik & Audit Storage (Ambang Rotasi 85%)',
        bullets: [
          'Pantau statistik Total Pengguna Aktif (batas hingga 60 akun), Total Dokumen RKA, dan Total Pagu Anggaran.',
          'Grafik **Kapasitas Storage Failover** (kuota 5.0 GB): Sistem memberlakukan ambang rotasi otomatis pada **85%** kapasitas.',
          'Indikator status memantau kesiapan Pool Kunci API Gemini, Database Neon PostgreSQL Cloud, dan auto-snapshot harian.'
        ]
      },
      {
        title: '2. Tab Log Aktivitas Server (SSE Real-time)',
        bullets: [
          'Menerima siaran aktivitas secara langsung (streaming SSE) saat terjadi aksi login, unggah berkas, pengeditan analisis, atau pemindahan ke sampah.',
          'Gunakan filter cepat berdasarkan jenis aksi (LOGIN, CREATE, UPDATE, DELETE, TRASH, RESTORE) dan status.',
          'Mencatat alamat IP pengguna, waktu presisi, dan nama pengguna untuk transparansi dan audit trail forensik.'
        ]
      },
      {
        title: '3. Tab Backup, Restore & Auto-Snapshot Database',
        bullets: [
          'Unduh salinan cadangan lengkap dalam format JSON terkompresi atau HTML mandiri.',
          'Klik **Buat Snapshot Sekarang** untuk membuat titik pemulihan instan sebelum pembaruan data besar.',
          'Daftar snapshot otomatis harian tersimpan rapi dan dapat dipulihkan dengan **1-klik Pulihkan** kapan saja terjadi kesalahan.'
        ]
      },
      {
        title: '4. Tab Manajemen User & Reset Password',
        steps: [
          'Buka tab **Manajemen User**.',
          'Klik **Tambah User** untuk membuat akun baru dengan menentukan username, nama, dan peran (**Admin**, **Moderator**, atau **User**).',
          'Gunakan tombol **Reset Password** untuk mengatur ulang kata sandi pengguna yang lupa.',
          'Ubah status akun menjadi Aktif atau Nonaktif menggunakan sakelar toggle.'
        ]
      },
      {
        title: '5. Tab Pool Kunci API Gemini & OpenAI',
        bullets: [
          'Pusat pengelolaan multi-kunci API: dukung banyak token Gemini 2.5 Flash dan OpenAI sekaligus.',
          'Tetapkan salah satu kunci sebagai **Utama (Primary)**, dengan kunci lain berstatus cadangan rotasi otomatis saat limit.',
          'Gunakan fitur **Batch Import (Impor Massal)** untuk memasukkan banyak token API sekaligus hanya dengan menempelkan teks daftar kunci.'
        ]
      },
      {
        title: '6. Tab Kontrol Sakelar Menu Global',
        body: ['Tab **Kontrol Menu** memungkinkan Admin mengunci atau membuka akses menu (Unggah RKA, CBB Chatbot, Arsip, dll.) menggunakan sakelar toggle. Menu yang dinonaktifkan akan menampilkan lencana **Nonaktif** bagi pengguna biasa.']
      },
      {
        title: '7. Tab Laporan Masuk & Balas via WhatsApp',
        bullets: [
          'Daftar tiket laporan kendala yang dikirim pengguna lengkap dengan kategori, kontak pelapor, dan lampiran tangkapan layar.',
          'Klik tombol **Balas via WhatsApp** untuk langsung membuka aplikasi WhatsApp resmi (`wa.me`) dengan format pesan konfirmasi otomatis.',
          'Hapus laporan yang sudah selesai ditangani untuk menjaga kebersihan kotak masuk.'
        ]
      },
      {
        title: '8. Tab Pengaturan Kontak WhatsApp Admin',
        body: ['Konfigurasikan nomor WhatsApp Admin Bapperida resmi pada tab **Pengaturan** agar pengguna terhubung ke admin yang tepat saat membutuhkan bantuan cepat.']
      }
    ],
    actions: [{ label: 'Buka Dasbor Admin', tab: 'admin-dashboard' }]
  },
  {
    id: 'admin',
    sidebar: 'Mengontak Tim IT / Admin Bapperida jika menu nonaktif',
    title: 'Mengontak Tim IT / Admin Bapperida Jika Menu Nonaktif atau Mengalami Kendala',
    keywords: 'admin menu nonaktif tidak aktif terkunci lapor laporan hubungi it whatsapp akses aktivasi kendala',
    intro: [
      'Admin dapat menonaktifkan menu tertentu untuk sementara selama pemeliharaan atau periode tertentu. Menu tersebut tampil dengan lencana **Nonaktif** di sidebar.',
      'Untuk meminta pembukaan akses atau melaporkan kendala teknis, kirim laporan melalui menu **Laporan**.'
    ],
    note: { text: 'Admin dan Moderator dapat mengakses seluruh menu tanpa terpengaruh sakelar nonaktif.' },
    sections: [
      {
        title: 'Mengirim formulir laporan kendala pengguna',
        steps: [
          'Klik menu bendera (**Laporan**) di navigasi sidebar atau klik tautan pada lencana Nonaktif.',
          'Isi **Judul Laporan** dan **Deskripsi Laporan** secara rinci.',
          'Pilih Kategori: *Kendala Teknis*, *Bug Aplikasi*, *Masukan & Saran*, *Permintaan Akses*, atau *Lainnya*.',
          'Isi Nama Pelapor dan kontak (**Email** atau **No. WhatsApp**).',
          'Lampirkan hingga **5 foto tangkapan layar** (format PNG, JPG, JPEG, WebP, GIF maks. 5 MB total), lalu kirim.'
        ]
      },
      {
        title: 'Penanganan laporan & tindak lanjut WhatsApp',
        body: ['Laporan langsung masuk ke tab **Laporan Masuk** di Dasbor Admin. Tim Administrator akan meninjau bukti tangkapan layar dan menindaklanjuti secara langsung melalui tautan resmi WhatsApp atau email yang Anda cantumkan.']
      }
    ],
    actions: [{ label: 'Buka formulir Laporan', tab: 'report' }]
  }
];

/* ── State ─────────────────────────────────────────────────────────────── */
const activeTab = ref('pusat');
const articleId = ref('unggah');
const openIdx = ref([0]);
const bannerVisible = ref(true);
const articleEl = ref(null);
const searchWrap = ref(null);

const article = computed(() => ARTICLES.find((a) => a.id === articleId.value) || ARTICLES[0]);
const isOpen = (i) => openIdx.value.includes(i);
const toggle = (i) => {
  openIdx.value = isOpen(i) ? openIdx.value.filter((x) => x !== i) : [...openIdx.value, i];
};

function openArticle(id, sectionIdx = 0) {
  if (!ARTICLES.some((a) => a.id === id)) return;
  articleId.value = id;
  openIdx.value = [sectionIdx];
  activeTab.value = 'pusat';
  resultsOpen.value = false;
  nextTick(() => {
    // Di layar sempit artikel berada di bawah daftar, jadi gulir ke judulnya.
    if (window.innerWidth < 1024 && articleEl.value) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      articleEl.value.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
    }
  });
}

function onArticleClick(e) {
  const a = e.target.closest && e.target.closest('a[data-article]');
  if (a) {
    e.preventDefault();
    openArticle(a.dataset.article);
  }
}

function onTabKey(e, i) {
  let j = null;
  if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
  else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
  if (j === null) return;
  e.preventDefault();
  activeTab.value = TABS[j].id;
  nextTick(() => document.getElementById('bp-tab-' + TABS[j].id)?.focus());
}

/* ── Format teks konten ────────────────────────────────────────────────── */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[(\w+)\|(.+?)\]\]/g, '<a href="#" class="bp-link" data-article="$1">$2</a>');
const plain = (s) => s.replace(/\*\*/g, '').replace(/\[\[\w+\|(.+?)\]\]/g, '$1');

/* ── Pencarian (di sisi klien) ─────────────────────────────────────────── */
const STOP = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'saya', 'anda', 'apa', 'bagaimana', 'ini', 'itu', 'atau', 'pada', 'ada', 'bisa', 'cara', 'kenapa', 'mengapa', 'kok', 'tidak', 'the', 'how', 'to']);
const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

const INDEX = ARTICLES.map((a) => {
  const secs = a.sections.map((s) => ({
    title: s.title,
    text: [...(s.body || []), ...(s.steps || []), ...(s.bullets || [])].map(plain).join(' ')
  }));
  return {
    a,
    title: tokenize(a.title + ' ' + a.sidebar),
    kw: tokenize(a.keywords),
    secTitles: secs.map((s) => tokenize(s.title)),
    body: tokenize([...a.intro, a.note?.text || '', ...secs.map((s) => s.text)].map(plain).join(' '))
  };
});
const clip = (t, n) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)).replace(/[,.;:\s]+$/, '') + '…');
const hit = (arr, t) => (t.length >= 3 ? arr.some((x) => x.includes(t)) : arr.includes(t));

function search(q) {
  const tokens = [...new Set(tokenize(q))];
  if (!tokens.length) return [];
  const out = [];
  for (const it of INDEX) {
    let score = 0;
    let matched = 0;
    let sec = -1;
    for (const t of tokens) {
      let s = 0;
      if (hit(it.title, t)) s += 5;
      if (hit(it.kw, t)) s += 3;
      const si = it.secTitles.findIndex((arr) => hit(arr, t));
      if (si >= 0) {
        s += 2;
        if (sec < 0) sec = si;
      }
      if (hit(it.body, t)) s += 1;
      if (s > 0) {
        score += s;
        matched++;
      }
    }
    if (!score) continue;
    score += matched * 2;
    const snippet = sec >= 0 ? 'Bagian: ' + it.a.sections[sec].title : clip(plain(it.a.intro[0]), 110);
    out.push({ a: it.a, score, sec: Math.max(sec, 0), snippet });
  }
  out.sort((x, y) => y.score - x.score);
  // Buang hasil yang jauh kurang relevan dibanding hasil teratas.
  return out.filter((r) => r.score >= out[0].score * 0.4).slice(0, 5);
}

const query = ref('');
const resultsOpen = ref(false);
const hi = ref(-1);
const results = computed(() => (query.value.trim().length >= 2 ? search(query.value) : []));
const showResults = computed(() => resultsOpen.value && query.value.trim().length >= 2);

function onSearchInput() {
  resultsOpen.value = query.value.trim().length >= 2;
  hi.value = -1;
}
function moveHi(d) {
  if (!results.value.length) return;
  resultsOpen.value = true;
  const n = results.value.length;
  hi.value = hi.value < 0 ? (d > 0 ? 0 : n - 1) : (hi.value + d + n) % n;
}
function pick(r) {
  openArticle(r.a.id, r.sec);
  query.value = '';
  hi.value = -1;
}
function pickHighlighted() {
  const r = results.value[hi.value >= 0 ? hi.value : 0];
  if (r) pick(r);
}
function clearSearch() {
  query.value = '';
  resultsOpen.value = false;
  hi.value = -1;
}
function onDocPointer(e) {
  if (searchWrap.value && !searchWrap.value.contains(e.target)) resultsOpen.value = false;
}
onMounted(() => document.addEventListener('pointerdown', onDocPointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointer));

</script>

<style scoped>
/* Semua warna memakai token global; nilai setelah koma adalah cadangan. */
.bp {
  --bp-ink: var(--text-primary, #1a1d21);
  --bp-muted: var(--text-secondary, #5b6169);
  --bp-line: var(--border-color, #e6e8eb);
  --bp-line-strong: var(--border-color-strong, #d3d7dc);
  --bp-brand: var(--primary-color, #1b4d46);
  --bp-link: var(--info-color, #2e7d74);
  --bp-surface: var(--bg-secondary, #fff);
  --bp-inset: var(--bg-tertiary, #f1f3f5);
  --bp-focus: var(--info-color, #2e7d74);
  --bp-on-brand: #fff;

  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  min-width: 0;
  color: var(--bp-ink);
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
}
.bp :where(button, input) { font: inherit; color: inherit; }
.bp :where(button:focus-visible, a:focus-visible, input:focus-visible) {
  outline: 2px solid var(--bp-focus);
  outline-offset: 2px;
}

/* ── Header + pencarian ───────────────────────────────────────────────── */
.bp-head {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 4px 0 20px;
}
.bp-brand { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.bp-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: 1px solid var(--bp-line);
  border-radius: 12px;
  background: #fff;
}
.bp-logo { width: 34px; height: 34px; object-fit: contain; }
.bp-brand-name {
  margin: 0;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.739rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--bp-ink);
}
.bp-search { position: relative; flex: 1 1 auto; max-width: 760px; margin-inline: auto; min-width: 0; }
.bp-search-box {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 14px 0 20px;
  background: var(--bp-inset);
  border: 2px solid transparent;
  border-radius: 999px;
  transition: background-color 0.15s, border-color 0.15s;
}
.bp-search-box:focus-within { background: var(--bp-surface); border-color: var(--bp-brand); }
.bp-search-ico { flex: 0 0 auto; color: var(--bp-muted); }
.bp-search-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 1.344rem;
  color: var(--bp-ink);
  text-overflow: ellipsis;
}
.bp-search-input::placeholder { color: var(--bp-muted); opacity: 1; }
.bp-search-input::-webkit-search-cancel-button { display: none; }
.bp-search-input:focus-visible { outline: 0; }

.bp-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bp-muted);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.bp-icon-btn:hover { background: var(--bp-inset); color: var(--bp-ink); }

.bp-results {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px;
  background: var(--bp-surface);
  border: 1px solid var(--bp-line);
  border-radius: 20px;
  box-shadow: 0 16px 32px -12px rgba(17, 24, 39, 0.22);
}
.bp-results ul { list-style: none; margin: 0; padding: 0; }
.bp-res {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.bp-res.is-hi { background: var(--bp-inset); }
.bp-res-ico { flex: 0 0 auto; margin-top: 1px; color: var(--bp-brand); }
.bp-res-text { min-width: 0; }
.bp-res-title { font-weight: 600; font-size: 1.289rem; line-height: 1.4; }
.bp-res-desc { margin-top: 2px; font-size: 1.153rem; line-height: 1.45; color: var(--bp-muted); }
.bp-noresult { padding: 16px 14px 12px; }
.bp-noresult-title { margin: 0 0 6px; font-weight: 600; }
.bp-noresult-text { margin: 0 0 14px; font-size: 1.221rem; line-height: 1.55; color: var(--bp-muted); }

/* ── Tab + notifikasi ─────────────────────────────────────────────────── */
.bp-navrow {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: inset 0 -1px 0 var(--bp-line);
}
.bp-tabs { display: flex; gap: 8px; min-width: 0; overflow-x: auto; scrollbar-width: none; padding: 4px 4px 0; }
.bp-tabs::-webkit-scrollbar { display: none; }
.bp-tab {
  position: relative;
  flex: 0 0 auto;
  padding: 14px 16px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.265rem;
  font-weight: 500;
  color: var(--bp-ink);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, background-color 0.15s;
}
.bp-tab:hover { background: var(--bp-inset); }
.bp-tab.is-active { color: var(--bp-link); }
.bp-tab.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--bp-link);
}


/* ── Panel & banner ───────────────────────────────────────────────────── */
.bp-panel { padding-top: 24px; }
.bp-main { min-width: 0; }
.bp-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 12px 14px 20px;
  border-radius: 14px;
  background: var(--warning-glow, rgba(215, 154, 62, 0.16));
}
.bp-banner-ico { flex: 0 0 auto; color: var(--warning-hover, #b87f2a); }
.bp-banner-text { flex: 1 1 auto; margin: 0; font-size: 1.289rem; line-height: 1.55; color: var(--bp-ink); }
.bp-banner-link {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--bp-link);
  font-weight: 600;
  font-size: 1.289rem;
  cursor: pointer;
}
.bp-banner-link:hover { background: rgba(0, 0, 0, 0.05); }
.bp-banner-x { flex: 0 0 auto; color: var(--bp-ink); }
.bp-banner-x:hover { background: rgba(0, 0, 0, 0.06); }

/* ── Grid 2 kolom ─────────────────────────────────────────────────────── */
.bp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 48px;
  align-items: start;
}

/* Artikel */
.bp-article {
  min-width: 0;
  padding: 44px 52px 36px;
  border: 1px solid var(--bp-line-strong);
  border-radius: 20px;
  background: var(--bp-surface);
}
.bp-h1 {
  margin: 0 0 20px;
  max-width: 24ch;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 3.163rem;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--bp-ink);
  text-wrap: balance;
}
.bp-p { margin: 0 0 16px; max-width: 68ch; font-size: 1.344rem; line-height: 1.7; color: var(--bp-ink); }
.bp-article :deep(strong), .bp-simple :deep(strong) { font-weight: 600; }
.bp-link, .bp-article :deep(a.bp-link) {
  color: var(--bp-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
.bp-link:hover, .bp-article :deep(a.bp-link:hover) { color: var(--bp-brand); text-decoration-thickness: 2px; }

/* Akordeon */
.bp-acc { margin-top: 28px; border-bottom: 1px solid var(--bp-line); }
.bp-acc-item { border-top: 1px solid var(--bp-line); }
.bp-acc-h { margin: 0; }
.bp-acc-btn {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.503rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--bp-link);
  text-align: left;
  cursor: pointer;
}
.bp-acc-btn:hover { color: var(--bp-brand); }
.bp-acc-chev { flex: 0 0 auto; transition: transform 0.25s ease; }
.bp-acc-chev.is-open { transform: rotate(180deg); }
.bp-acc-panel {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition: grid-template-rows 0.25s ease, visibility 0s linear 0.25s;
}
.bp-acc-panel.is-open {
  grid-template-rows: 1fr;
  visibility: visible;
  transition: grid-template-rows 0.25s ease, visibility 0s;
}
.bp-acc-inner { min-height: 0; overflow: hidden; }
.bp-acc-body { padding: 0 4px 12px; }

.bp-steps, .bp-bullets { margin: 0 0 12px; padding-left: 1.4em; max-width: 68ch; }
.bp-steps li, .bp-bullets li { margin-bottom: 10px; padding-left: 4px; font-size: 1.344rem; line-height: 1.7; }
.bp-steps li::marker { color: var(--bp-muted); font-weight: 600; }
.bp-bullets li::marker { color: var(--bp-muted); }

.bp-article-foot { margin-top: 28px; }
.bp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.bp-foot-help { margin: 0; font-size: 1.289rem; color: var(--bp-muted); }

/* Tombol */
.bp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 1.272rem;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.bp-btn-primary { background: var(--bp-brand); color: var(--bp-on-brand); }
.bp-btn-primary:hover { background: var(--primary-hover, #113630); }
.bp-btn-ghost { border-color: var(--bp-line-strong); background: transparent; color: var(--bp-link); }
.bp-btn-ghost:hover { background: var(--bp-inset); }

/* Sidebar */
.bp-side { position: sticky; top: 16px; min-width: 0; }
.bp-side-h {
  margin: 8px 0 20px;
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 1.582rem;
  font-weight: 500;
  color: var(--bp-ink);
}
.bp-side-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.bp-side-link {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 12px;
  margin-inline: -12px;
  border-radius: 12px;
  color: var(--bp-ink);
  font-size: 1.265rem;
  line-height: 1.5;
  text-decoration: none;
  transition: background-color 0.15s;
}
.bp-side-link:hover { background: var(--bp-inset); }
.bp-side-ico { flex: 0 0 auto; margin-top: 0; color: var(--bp-link); }
.bp-side-link.is-current { font-weight: 600; }
.bp-side-link.is-current .bp-side-ico { color: var(--bp-brand); }

/* Panel sederhana: forum & panduan mulai */
.bp-simple { max-width: 820px; padding-bottom: 24px; }
.bp-simple .bp-h1 { max-width: none; }
.bp-defs { margin: 8px 0 28px; max-width: 68ch; border-top: 1px solid var(--bp-line); }
.bp-def { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--bp-line); }
.bp-def dt { font-weight: 600; }
.bp-def dd { margin: 0; color: var(--bp-muted); line-height: 1.6; }

.bp-quick { list-style: none; margin: 24px 0 0; padding: 0; border-top: 1px solid var(--bp-line); }
.bp-quick-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 22px 0;
  border-bottom: 1px solid var(--bp-line);
}
.bp-quick-n {
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 2.53rem;
  font-weight: 300;
  line-height: 1;
  color: var(--bp-link);
}
.bp-quick-title { margin: 0 0 4px; font-family: var(--font-heading, 'Outfit', sans-serif); font-size: 1.503rem; font-weight: 500; }
.bp-quick-desc { margin: 0; line-height: 1.6; color: var(--bp-muted); }

/* ── Responsif ────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .bp-grid { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .bp-side { position: static; }
  .bp-side-link { margin-inline: 0; }
  .bp-article { padding: 32px 28px 28px; }
  .bp-h1 { font-size: 2.688rem; }
}
@media (max-width: 720px) {
  .bp-head { flex-direction: column; align-items: stretch; gap: 16px; padding-bottom: 16px; }
  .bp-search { max-width: none; margin-inline: 0; }
  .bp-search-box { height: 52px; }
  .bp-tab { padding: 12px 12px; }
  .bp-tabs { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); padding-right: 24px; }
  .bp-banner {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 40px;
    grid-template-areas: 'ico text x' '. link .';
    align-items: start;
    gap: 4px 12px;
    padding: 14px 8px 10px 16px;
  }
  .bp-banner-ico { grid-area: ico; margin-top: 2px; }
  .bp-banner-text { grid-area: text; }
  .bp-banner-x { grid-area: x; margin-top: -6px; }
  .bp-banner-link { grid-area: link; justify-self: start; margin-left: -12px; }
  .bp-article { padding: 24px 18px 22px; border-radius: 16px; }
  .bp-h1 { font-size: 2.213rem; }
  .bp-p, .bp-steps li, .bp-bullets li { font-size: 1.265rem; }
  .bp-acc-btn { font-size: 1.344rem; }
  .bp-def { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .bp-quick-item { grid-template-columns: 36px minmax(0, 1fr); }
  .bp-quick-cta { grid-column: 2; }
  .bp-quick-n { font-size: 2.056rem; }
}
@media (prefers-reduced-motion: reduce) {
  .bp *, .bp *::before, .bp *::after { transition: none !important; }
}
</style>

<style>
/* Tema gelap: warna brand dicerahkan di style.css, jadi teks di atasnya dibuat gelap agar kontras. */
[data-theme='dark'] .bp.bp { --bp-on-brand: #0f1412; }
</style>
