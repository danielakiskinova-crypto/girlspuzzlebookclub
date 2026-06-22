// Shared kit for the Girl Book Club site — "Puzzle & Petal, in full bloom".
// Palette, helpers and the components reused across every page.
// Exports everything to window so each page's inline script can use it.

// ─── Palette: a soft tint + a saturated ink per hue ──────────────────────────
const PETALS = {
  rose:  { soft: 'oklch(0.94 0.045 12)',  ink: 'oklch(0.62 0.17 12)',  on: '#fff' },
  coral: { soft: 'oklch(0.94 0.05 40)',   ink: 'oklch(0.66 0.16 42)',  on: '#fff' },
  honey: { soft: 'oklch(0.95 0.055 85)',  ink: 'oklch(0.66 0.13 70)',  on: '#fff' },
  mint:  { soft: 'oklch(0.94 0.045 165)', ink: 'oklch(0.62 0.12 168)', on: '#fff' },
  sky:   { soft: 'oklch(0.94 0.04 235)',  ink: 'oklch(0.62 0.13 248)', on: '#fff' },
  lav:   { soft: 'oklch(0.94 0.04 295)',  ink: 'oklch(0.62 0.15 295)', on: '#fff' },
  berry: { soft: 'oklch(0.94 0.04 340)',  ink: 'oklch(0.62 0.18 342)', on: '#fff' },
};
const petal = (b) => PETALS[b && b.petal ? b.petal : 'rose'];

const INK = '#3a2f38';
const SOFT = '#8f7f8a';
const BG = '#fff7fb';
const HERO_GRAD = 'linear-gradient(120deg, oklch(0.95 0.05 12) 0%, oklch(0.95 0.05 60) 32%, oklch(0.95 0.05 200) 66%, oklch(0.95 0.05 300) 100%)';
const BRAND_GRAD = 'linear-gradient(135deg, oklch(0.64 0.17 12), oklch(0.62 0.16 340))';
const F_HEAD = '"Fredoka", sans-serif';
const F_BODY = '"Nunito", sans-serif';

// ─── Tiny atoms ──────────────────────────────────────────────────────────────

// Pull a TikTok video id out of a full URL, or accept a bare id.
function tiktokId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/\/video\/(\d+)/) || s.match(/[?&]item_id=(\d+)/);
  return m ? m[1] : null;
}

// Resolve ANY TikTok url (including short vm.tiktok.com links) to a numeric
// video id, via the official oEmbed endpoint. Cached so each link resolves once.
const _ttCache = {};
function resolveTikTok(url) {
  if (!url) return Promise.resolve(null);
  const direct = tiktokId(url);
  if (direct) return Promise.resolve(direct);
  if (_ttCache[url]) return _ttCache[url];
  const pr = fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(url.trim()))
    .then(r => r.json())
    .then(j => {
      const html = (j && j.html) || '';
      const m = html.match(/data-video-id="(\d+)"/) || html.match(/\/video\/(\d+)/);
      return m ? m[1] : null;
    })
    .catch(() => null);
  _ttCache[url] = pr;
  return pr;
}

// TikTok embed (official iframe player). Accepts full OR short links and resolves
// them at runtime. Lazy-loads when scrolled near, shows a loading skeleton, and
// falls back to a clickable card if a video can't be resolved/embedded.
function TikTokEmbed({ url, accent, height = 575 }) {
  const p = accent || PETALS.berry;
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);
  const [id, setId] = React.useState(tiktokId(url));
  const [status, setStatus] = React.useState(url ? 'idle' : 'empty');

  // reveal when near viewport
  React.useEffect(() => {
    if (!url || id || seen) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [url, id, seen]);

  React.useEffect(() => {
    if (!url || id || !seen) return;
    setStatus('loading');
    let alive = true;
    resolveTikTok(url).then(rid => {
      if (!alive) return;
      if (rid) { setId(rid); setStatus('ready'); }
      else setStatus('error');
    });
    return () => { alive = false; };
  }, [url, id, seen]);

  // no link set yet → friendly placeholder
  if (status === 'empty') {
    return (
      <div style={{ borderRadius: 22, padding: '34px 22px', textAlign: 'center',
        background: `linear-gradient(150deg, ${p.soft}, #fff 90%)`, border: `2px dashed ${p.ink}`, color: INK }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🎬</div>
        <div style={{ fontFamily: F_HEAD, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>No TikTok yet</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: SOFT, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
          Drop the link to our solve video here and it’ll play right on the page.</div>
      </div>
    );
  }

  // resolved → play inline
  if (id) {
    return (
      <div style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 28px rgba(58,47,56,0.1)',
        background: '#000', maxWidth: 325, margin: '0 auto', width: '100%' }}>
        <iframe title="TikTok video" src={`https://www.tiktok.com/embed/v2/${id}`}
          style={{ width: '100%', height, border: 0, display: 'block' }}
          allow="encrypted-media; fullscreen" allowFullScreen scrolling="no" />
      </div>
    );
  }

  // couldn't resolve → clickable fallback card (still gets them to the video)
  if (status === 'error') {
    return (
      <a ref={ref} href={url} target="_blank" rel="noopener"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', textDecoration: 'none', color: INK, borderRadius: 22, minHeight: 220,
          padding: '30px 22px', background: `linear-gradient(150deg, ${p.soft}, #fff 90%)`,
          boxShadow: '0 12px 28px rgba(58,47,56,0.08)' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>▶️</div>
        <div style={{ fontFamily: F_HEAD, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Watch on TikTok</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: p.ink }}>Open the video →</div>
      </a>
    );
  }

  // idle / loading skeleton
  return (
    <div ref={ref} style={{ borderRadius: 22, minHeight: 220, display: 'grid', placeItems: 'center',
      background: `linear-gradient(150deg, ${p.soft}, #fff 90%)`, color: SOFT, fontWeight: 800, fontSize: 13 }}>
      <span>Loading video…</span>
    </div>
  );
}

// Grid of TikTok videos from a list of urls.
function TikTokGrid({ urls }) {
  return (
    <div className="video-grid">
      {urls.map((u, i) => (
        <TikTokEmbed key={i} url={u} accent={PETALS[['rose','coral','mint','sky','lav','berry'][i % 6]]} height={560} />
      ))}
    </div>
  );
}

function Pill({ children, bg, color, style }) {
  return (
    <span style={{ background: bg, color, padding: '5px 12px', borderRadius: 999, fontSize: 12,
      fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, ...style }}>{children}</span>
  );
}

function Stars({ n, size = 14 }) {
  return <span style={{ color: 'oklch(0.74 0.15 78)', fontSize: size, letterSpacing: 1 }}>
    {'★'.repeat(Math.floor(n))}{n % 1 ? '½' : ''}</span>;
}

function Dots({ n, p, total = 10 }) {
  const filled = Math.round((n / 5) * total);
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, idx) => idx + 1).map(i => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: '50%',
          background: i <= filled ? p.ink : '#ecdfe8' }} />
      ))}
    </span>
  );
}

// Fillable cover slot — user drags their real cover in; persists by id.
// If the book has a `cover` image path, show that instead of the drop slot.
//   natural=true  → show the whole cover at its real proportions (height grows to fit)
//   otherwise     → fit the whole cover inside height `h`, letterboxed on the tint
function Cover({ book, h = 200, idPrefix = 'cover', radius = 16, natural = false }) {
  const p = petal(book);
  if (book.cover) {
    return (
      <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden',
        background: `linear-gradient(150deg, ${p.soft}, #fff 80%)`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <img src={book.cover} alt={`${book.title} cover`}
          style={natural
            ? { display: 'block', width: '100%', height: 'auto' }
            : { display: 'block', width: '100%', height: h, objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden',
      background: `linear-gradient(150deg, ${p.soft}, #fff 80%)`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none', background:
        `repeating-linear-gradient(45deg, transparent, transparent 13px, ${p.soft} 13px, ${p.soft} 16px)` }} />
      <image-slot
        id={`${idPrefix}-${book.id}`}
        shape="rect"
        placeholder="Drop cover"
        style={{ display: 'block', width: '100%', height: h, position: 'relative' }}
      />
    </div>
  );
}

// ─── Nav + footer ────────────────────────────────────────────────────────────
function Nav({ active }) {
  const links = [
    ['Home', 'index.html', 'rose'],
    ['Books', 'books.html', 'coral'],
    ['TikTok', 'watch.html', 'berry'],
    ['Shop', 'shop.html', 'lav'],
    ['The Girls', 'girls.html', 'sky'],
  ];
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 44px', maxWidth: 1180, margin: '0 auto' }}>
      <a href="index.html" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: INK }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, color: '#fff', background: BRAND_GRAD,
          display: 'grid', placeItems: 'center', fontFamily: F_HEAD, fontSize: 23, fontWeight: 600,
          boxShadow: '0 6px 16px oklch(0.62 0.17 12 / 0.4)' }}>g</span>
        <span style={{ fontFamily: F_HEAD, fontSize: 22, fontWeight: 600 }}>Girl Book Club</span>
      </a>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 800 }}>
        {links.map(([t, href, hue]) => {
          const on = active === t;
          return (
            <a key={t} href={href} style={{ padding: '9px 16px', borderRadius: 999, textDecoration: 'none',
              color: PETALS[hue].ink, background: on ? PETALS[hue].soft : 'transparent' }}>{t}</a>
          );
        })}
        <a href="books.html" style={{ padding: '10px 20px', borderRadius: 999, color: '#fff', textDecoration: 'none',
          background: BRAND_GRAD, boxShadow: '0 6px 16px oklch(0.62 0.17 340 / 0.35)' }}>Join us ♡</a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 44px 48px' }}>
      <div style={{ borderRadius: 28, padding: '34px 40px', background: HERO_GRAD,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: F_HEAD, fontSize: 26, fontWeight: 600 }}>Found your next puzzle? 🧩</div>
          <div style={{ fontSize: 14, color: SOFT, fontWeight: 700, marginTop: 4 }}>
            New book tested most weeks. No duds, ever.</div>
        </div>
        <a href="books.html" style={{ background: INK, color: '#fff', padding: '14px 28px', borderRadius: 999,
          fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>Browse the shelf →</a>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: SOFT, fontWeight: 700, marginTop: 26 }}>
        girlspuzzlebookclub.store · As an Amazon Associate we earn from qualifying purchases · made with ♡
      </div>
    </footer>
  );
}

// ─── Status: the club tests one book a week ─────────────────────────────────
// status 'testing' → in progress this week;  anything else → already tested.
function statusInfo(book) {
  if (book && book.status === 'testing') {
    return { testing: true, label: 'Testing this week', bg: 'oklch(0.7 0.17 25)', dot: '#fff' };
  }
  return { testing: false, label: 'Tested ✓', bg: 'oklch(0.6 0.12 165)', dot: '#fff' };
}

function StatusBadge({ book, style }) {
  const s = statusInfo(book);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: s.bg, color: '#fff',
      padding: '6px 13px 6px 11px', borderRadius: 999, fontSize: 12, fontWeight: 800,
      boxShadow: '0 4px 12px rgba(0,0,0,0.18)', ...style }}>
      <span className={s.testing ? 'gbc-pulse' : ''} style={{ width: 8, height: 8, borderRadius: '50%',
        background: s.dot, flex: '0 0 auto' }} />
      {s.label}
    </span>
  );
}

// ─── Book card (used on home + catalog) ──────────────────────────────────────
function BookCard({ book, i }) {
  const p = petal(book);
  return (
    <a href={`book.html?id=${book.id}`} style={{ display: 'block', textDecoration: 'none', color: INK,
      background: '#fff', borderRadius: 24, padding: 16, boxShadow: '0 12px 28px rgba(58,47,56,0.08)',
      borderTop: `5px solid ${p.ink}`, transition: 'transform .15s ease, box-shadow .15s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 18px 36px rgba(58,47,56,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(58,47,56,0.08)'; }}>
      <div style={{ position: 'relative' }}>
        <Cover book={book} h={190} />
        <StatusBadge book={book} style={{ position: 'absolute', top: 12, left: 12 }} />
        <span style={{ position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: 999,
          padding: '4px 10px', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
          <Stars n={book.stars} /></span>
      </div>
      <div style={{ padding: '14px 4px 4px' }}>
        <Pill bg={p.soft} color={p.ink}>{book.tag}</Pill>
        <h3 style={{ fontFamily: F_HEAD, fontSize: 21, fontWeight: 600, margin: '12px 0 4px', lineHeight: 1.12 }}>
          {book.title}</h3>
        <div style={{ fontSize: 12, color: SOFT, fontWeight: 800, marginBottom: 10 }}>by {book.author}</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: INK, fontWeight: 600, margin: '0 0 14px' }}>
          {book.blurb}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: SOFT, fontWeight: 800 }}>
          <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
            challenge <Dots n={book.difficulty} p={p} /></span>
          <span>{book.hours}</span>
        </div>
      </div>
    </a>
  );
}

Object.assign(window, {
  PETALS, petal, INK, SOFT, BG, HERO_GRAD, BRAND_GRAD, F_HEAD, F_BODY,
  Pill, Stars, Dots, Cover, Nav, Footer, BookCard, StatusBadge, statusInfo,
  TikTokEmbed, tiktokId, resolveTikTok, TikTokGrid,
});
