// Wordmark "ecco" ala label logo perusahaan: huruf kecil, serif, dibingkai
// badge bulat tipis. Dipakai di header Login, Staff, dan Admin biar identitas
// visualnya konsisten di seluruh aplikasi.

export function BrandMark({ tone = 'dark', size = 'md' }: { tone?: 'dark' | 'light'; size?: 'sm' | 'md' | 'lg' }) {
  const toneClass = tone === 'light' ? 'text-white' : 'text-ink';
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <span className={`brand-badge brand-wordmark ${toneClass} ${sizeClass}`}>
      ecco
    </span>
  );
}

export function BrandHeader({
  tone = 'dark',
  title,
  subtitle,
}: {
  tone?: 'dark' | 'light';
  title: string;
  subtitle?: string;
}) {
  const subToneClass = tone === 'light' ? 'text-white/60' : 'text-gray-500';
  const titleToneClass = tone === 'light' ? 'text-white' : 'text-ink';

  return (
    <div className="flex items-center gap-3">
      <BrandMark tone={tone} />
      <div className="border-l border-current/20 pl-3">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${titleToneClass}`}>{title}</p>
        {subtitle && <p className={`text-[11px] ${subToneClass}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
