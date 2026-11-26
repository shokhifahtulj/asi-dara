/** @type {import('tailwindcss').Config} */
// Tailwind di proyek ini dipakai HANYA untuk halaman "Petunjuk Penggunaan"
// (src/components/PetunjukPenggunaan.vue) supaya tampilan menu lain tidak berubah:
//   • content   : hanya memindai komponen tersebut
//   • important : semua utilitas dibatasi di dalam #petunjuk-root
//   • preflight : dimatikan (tidak mereset gaya global aplikasi)
// Warna memakai token di assets/style.css sehingga tema terang/gelap ikut bekerja.
export default {
  content: ['./src/components/PetunjukPenggunaan.vue'],
  important: '#petunjuk-root',
  corePlugins: { preflight: false },
  theme: {
    // Ukuran teks bawaan Tailwind diperbesar ~15% (tata letak kotak tidak diubah)
    fontSize: {
      xs: ['0.95rem', { lineHeight: '1.1rem' }],
      sm: ['1.1rem', { lineHeight: '1.4rem' }],
      base: ['1.25rem', { lineHeight: '1.75rem' }],
      lg: ['1.4rem', { lineHeight: '1.9rem' }],
      xl: ['1.55rem', { lineHeight: '2rem' }],
      '2xl': ['1.85rem', { lineHeight: '2.2rem' }]
    },
    extend: {
      colors: {
        brand: 'rgba(var(--primary-rgb), <alpha-value>)',
        'brand-soft': 'var(--primary-glow)',
        accent: 'rgba(var(--accent-rgb), <alpha-value>)',
        'accent-soft': 'var(--accent-glow)',
        surface: 'var(--bg-secondary)',
        inset: 'var(--bg-tertiary)',
        line: 'var(--border-color)',
        'line-strong': 'var(--border-color-strong)',
        ink: 'var(--text-primary)',
        'ink-2': 'var(--text-secondary)',
        'ink-3': 'var(--text-muted)',
        ok: 'var(--success-color)',
        'ok-soft': 'var(--success-glow)',
        'ok-ink': 'var(--success-hover)',
        warn: 'var(--warning-color)',
        'warn-soft': 'var(--warning-glow)',
        bad: 'var(--danger-color)',
        'bad-soft': 'var(--danger-glow)',
        'bad-ink': 'var(--danger-hover)'
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif']
      }
    }
  },
  plugins: []
};
