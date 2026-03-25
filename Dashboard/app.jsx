const { useState, useMemo, useCallback } = React;

// ── REAL DATA (from Excel: Casos de Uso - Anderson.xlsx) ─────────────────────
const rawData = typeof REAL_DATA !== 'undefined' ? REAL_DATA : [];

// Derive unique filter values from real data
const unique = (key) => [...new Set(rawData.map(d => d[key]).filter(Boolean))].sort();

const MONTHS        = unique('mes');
const STATES        = unique('state');
const SUB_STATUS    = unique('subStatus');
const PRODUCTS      = unique('produtoControladoria');
const CLASSIFICACAO = unique('classificacaoFluxo');
const STATUS_EF     = unique('entregaREQ');

// ── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATE_COLORS = {
  'Construindo':        'var(--blue)',
  'Desenvolvimento':    'var(--cyan)',
  'Devolvidos':         'var(--red)',
  'Finalizado':         'var(--green)',
  'Não Iniciado':       'var(--text-muted)',
  'Pronto para Deploy': 'var(--purple)',
  'Stand By':           'var(--yellow)',
  'Stand By Externo':   'var(--orange)',
  'Stand By Interno':   'var(--yellow)',
  'Testando':           'var(--accent-light)',
};

const ENTREGA_COLORS = {
  'Entregue REQ + FIGMA': 'var(--green)',
  'Apenas REQ':           'var(--blue)',
  'Apenas FIGMA':         'var(--yellow)',
  'Não Entregue':         'var(--red)',
  'Não Iniciado':         'var(--text-muted)',
};

// ── VIEWS ────────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'N',    label: 'Normal',                  short: 'N' },
  { id: 'NTA',  label: 'Normal + Total. Aberto',  short: 'N+TA' },
  { id: 'FA',   label: 'Filtro Aberto',           short: 'FA' },
  { id: 'FATA', label: 'Filtro Aberto + Total.',  short: 'FA+TA' },
];

// ── ICON COMPONENTS ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const SearchIcon      = (p) => <Icon {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const FilterIcon      = (p) => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const ChevronIcon     = (p) => <Icon {...p} d="M6 9l6 6 6-6" />;
const ExternalLinkIcon= (p) => <Icon {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />;
const BarChartIcon    = (p) => <Icon {...p} d="M12 20V10M18 20V4M6 20v-4" />;
const RefreshIcon     = (p) => <Icon {...p} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
const TableIcon       = (p) => <Icon {...p} d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />;

// ── FILTERS PANEL ────────────────────────────────────────────────────────────
function FiltersPanel({ filters, setFilters, data }) {
  const uniqueVals = (key) => [...new Set(data.map(d => d[key]).filter(Boolean))].sort();
  const toggle = (key, val) => setFilters(f => {
    const prev = f[key] || [];
    return { ...f, [key]: prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val] };
  });
  const isActive = (key, val) => (filters[key] || []).includes(val);

  const FilterGroup = ({ label, dataKey, values }) => (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {values.map(v => (
          <button key={v} onClick={() => toggle(dataKey, v)}
            className={`filter-chip ${isActive(dataKey, v) ? 'active' : ''}`}
            style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, border: '1px solid var(--border)', background: isActive(dataKey, v) ? 'var(--accent-glow)' : 'transparent', color: isActive(dataKey, v) ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: 20, width: 280, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <FilterIcon size={14} style={{ color: 'var(--accent-light)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>FILTROS</span>
        {Object.values(filters).some(v => v.length > 0) && (
          <button onClick={() => setFilters({})} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Limpar
          </button>
        )}
      </div>

      {/* Text Search */}
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Busca</p>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="search-box"
            value={filters.search || ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="ID, Caso de Uso, REQ..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }} />
        </div>
      </div>

      <FilterGroup label="Mês" dataKey="mes" values={uniqueVals('mes')} />
      <FilterGroup label="Sub Status" dataKey="subStatus" values={uniqueVals('subStatus')} />
      <FilterGroup label="Entrega REQ / Status EF/FIGMA" dataKey="entregaREQ" values={uniqueVals('entregaREQ')} />
      <FilterGroup label="Classificação Fluxo" dataKey="classificacaoFluxo" values={uniqueVals('classificacaoFluxo')} />
      <FilterGroup label="Produto Controladoria" dataKey="produtoControladoria" values={uniqueVals('produtoControladoria')} />
    </div>
  );
}

// ── KPI CARD ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, color, icon, subtitle }) {
  return (
    <div className="kpi-card card-glow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 130, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.3 }}>{label}</span>
        {icon && <div style={{ color, opacity: 0.7 }}>{icon}</div>}
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
    </div>
  );
}

// ── DATA TABLE ───────────────────────────────────────────────────────────────
function DataTable({ data, view }) {
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const cols = [
    { key: 'id',                    label: 'ID / Caso de Uso',  width: 220 },
    { key: 'state',                 label: 'State',             width: 120 },
    { key: 'subStatus',             label: 'Sub Status',        width: 110 },
    { key: 'mes',                   label: 'Mês',               width: 70  },
    { key: 'entregaREQ',            label: 'Entrega REQ',       width: 170 },
    { key: 'requisitoFuncional',    label: 'REQ Funcional',     width: 110 },
    { key: 'produtoControladoria',  label: 'Produto',           width: 150 },
    { key: 'req',                   label: 'Requisitante',      width: 120 },
    { key: 'pd',                    label: 'Designer',          width: 120 },
    { key: 'classificacaoFluxo',    label: 'Class. Fluxo',      width: 140 },
    ...(view !== 'N' ? [{ key: 'statusEFFIGMA', label: 'Status EF/FIGMA', width: 170 }] : []),
    { key: 'url',                   label: 'URL',               width: 80  },
  ];

  const sorted = useMemo(() => {
    const d = [...data];
    d.sort((a, b) => {
      const av = a[sort.key] || '', bv = b[sort.key] || '';
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return d;
  }, [data, sort.key, sort.dir]);

  const total   = sorted.length;
  const pages   = Math.ceil(total / pageSize);
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const SortIndicator = ({ col }) => {
    if (sort.key !== col) return <span style={{ opacity: 0.2, marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--accent-light)', marginLeft: 4 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--bg-table)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Table header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TableIcon size={14} style={{ color: 'var(--accent-light)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            CASOS DE USO — {view === 'FA' || view === 'FATA' ? 'FILTRO ABERTO' : 'NORMAL'}
            {(view === 'NTA' || view === 'FATA') && ' + TOTAL ABERTO'}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} registros</span>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: 'auto', maxHeight: 440 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {cols.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: c.width, borderBottom: '1px solid var(--border)', userSelect: 'none' }}>
                  {c.label}<SortIndicator col={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row.id} className="table-row-hover"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(42,47,71,0.5)', transition: 'background 0.1s' }}>
                <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 700 }}>{row.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.casoDeUso}</div>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span className="status-dot" style={{ background: STATE_COLORS[row.state] || 'var(--text-muted)' }} />
                    <span style={{ color: STATE_COLORS[row.state] || 'var(--text-muted)', fontSize: 12 }}>{row.state}</span>
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{row.subStatus}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{row.mes}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span className="badge" style={{ background: `${ENTREGA_COLORS[row.entregaREQ]}22`, color: ENTREGA_COLORS[row.entregaREQ], border: `1px solid ${ENTREGA_COLORS[row.entregaREQ]}44`, fontSize: 10 }}>
                    {row.entregaREQ}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{row.requisitoFuncional}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{row.produtoControladoria}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{row.req}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{row.pd}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ fontSize: 11, color: row.classificacaoFluxo === 'Fluxo Normal' ? 'var(--cyan)' : row.classificacaoFluxo === 'Fluxo Alternativo' ? 'var(--orange)' : 'var(--purple)' }}>
                    {row.classificacaoFluxo}
                  </span>
                </td>
                {(view !== 'N') && (
                  <td style={{ padding: '8px 12px' }}>
                    <span className="badge" style={{ background: `${ENTREGA_COLORS[row.statusEFFIGMA]}22`, color: ENTREGA_COLORS[row.statusEFFIGMA], border: `1px solid ${ENTREGA_COLORS[row.statusEFFIGMA]}44`, fontSize: 10 }}>
                      {row.statusEFFIGMA}
                    </span>
                  </td>
                )}
                <td style={{ padding: '8px 12px' }}>
                  <a href={row.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <ExternalLinkIcon size={12} /> Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '4px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>
            ← Anterior
          </button>
          {Array.from({ length: Math.min(7, pages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : i + page - 3;
            if (p > pages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid', borderColor: p === page ? 'var(--accent)' : 'var(--border)', background: p === page ? 'var(--accent-glow)' : 'var(--bg-card)', color: p === page ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: p === page ? 700 : 400 }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '4px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, color: page === pages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === pages ? 'default' : 'pointer', fontSize: 12 }}>
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [activeView, setActiveView] = useState('N');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(true);

  // Filter data based on view and active filters
  const filteredData = useMemo(() => {
    let d = rawData;

    // View filter
    // FA / FATA = only open (non-terminal) items
    if (activeView === 'FA' || activeView === 'FATA') d = d.filter(r => r.isFiltroAberto);
    // NTA = Normal but excluding Finalizado/Pronto para Deploy
    if (activeView === 'NTA') d = d.filter(r => r.isAberto);

    // User filters
    if (filters.search) {
      const q = filters.search.toLowerCase();
      d = d.filter(r => r.id.toLowerCase().includes(q) || r.casoDeUso.toLowerCase().includes(q) || r.req.toLowerCase().includes(q) || r.requisitoFuncional.toLowerCase().includes(q));
    }
    ['mes', 'subStatus', 'entregaREQ', 'classificacaoFluxo', 'produtoControladoria'].forEach(key => {
      if (filters[key] && filters[key].length > 0) d = d.filter(r => filters[key].includes(r[key]));
    });
    return d;
  }, [activeView, filters]);

  // KPI calculations
  const kpis = useMemo(() => {
    const d = filteredData;
    const total       = d.length;
    const entregue    = d.filter(r => r.entregaREQ === 'Entregue REQ + FIGMA').length;
    const naoEntregue = d.filter(r => r.entregaREQ === 'Não Entregue').length;
    const apenasREQ   = d.filter(r => r.entregaREQ === 'Apenas REQ').length;
    const apenasF     = d.filter(r => r.entregaREQ === 'Apenas FIGMA').length;
    const fluxoN      = d.filter(r => r.classificacaoFluxo === 'Fluxo Normal').length;
    const fluxoER     = d.filter(r => r.classificacaoFluxo === 'Fluxo de Exceção').length;
    return { total, entregue, naoEntregue, apenasREQ, apenasF, fluxoN, fluxoER };
  }, [filteredData]);

  // Status distribution for mini bar
  const stateDistrib = useMemo(() => {
    const counts = {};
    filteredData.forEach(r => { counts[r.state] = (counts[r.state] || 0) + 1; });
    return Object.entries(counts)
      .map(([s, c]) => ({ state: s, count: c, pct: Math.round(c / filteredData.length * 100) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const entregaDistrib = useMemo(() => {
    const counts = {};
    filteredData.forEach(r => { counts[r.entregaREQ] = (counts[r.entregaREQ] || 0) + 1; });
    return Object.entries(counts)
      .map(([s, c]) => ({ status: s, count: c, pct: Math.round(c / filteredData.length * 100) || 0 }));
  }, [filteredData]);

  const isExtended = activeView === 'NTA' || activeView === 'FATA';
  const isFA       = activeView === 'FA'  || activeView === 'FATA';
  const viewLabel  = VIEWS.find(v => v.id === activeView)?.label;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── TOP HEADER ── */}
      <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'stretch', height: 52 }}>
        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 24, borderRight: '1px solid var(--border)', marginRight: 24 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--accent), #06b6d4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChartIcon size={16} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>USE CASE CONTROL</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}>Vector · Controladoria</div>
          </div>
        </div>

        {/* View tabs */}
        <nav style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`tab-btn ${activeView === v.id ? 'active' : ''}`}
              style={{ padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: activeView === v.id ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
              {v.short}
              <span style={{ display: 'none' }}>{v.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filteredData.length} registros</span>
          <button onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: showFilters ? 'var(--accent-glow)' : 'var(--bg-card)', border: `1px solid ${showFilters ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 6, color: showFilters ? 'var(--accent-light)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
            <FilterIcon size={13} /> Filtros
          </button>
          <RefreshIcon size={15} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>AO</div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Filters sidebar */}
        {showFilters && (
          <aside style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid var(--border)' }} className="fade-in">
            <FiltersPanel filters={filters} setFilters={setFilters} data={rawData} />
          </aside>
        )}

        {/* Main area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">

          {/* View label + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 18, background: 'linear-gradient(to bottom, var(--accent), #06b6d4)', borderRadius: 2 }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{viewLabel}</h1>
            {Object.values(filters).some(v => v && (typeof v === 'string' ? v.length > 0 : v.length > 0)) && (
              <span className="badge" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', border: '1px solid var(--accent)', marginLeft: 8 }}>
                Filtros ativos
              </span>
            )}
          </div>

          {/* ── KPI CARDS ── */}
          <section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              <KPICard label="Total" value={kpis.total} color="var(--accent-light)"
                icon={<BarChartIcon size={15} />} subtitle="casos de uso" />
              {isExtended && (
                <>
                  <KPICard label="Entregue" value={kpis.entregue} color="var(--green)"
                    subtitle={`${Math.round(kpis.entregue / kpis.total * 100) || 0}% do total`} />
                  <KPICard label="Não Entregue" value={kpis.naoEntregue} color="var(--red)"
                    subtitle={`${Math.round(kpis.naoEntregue / kpis.total * 100) || 0}% do total`} />
                  <KPICard label="Apenas REQ" value={kpis.apenasREQ} color="var(--blue)"
                    subtitle="REQ Entregue" />
                  <KPICard label="Apenas FIGMA" value={kpis.apenasF} color="var(--yellow)"
                    subtitle="FIGMA Entregue" />
                  <KPICard label="Fluxo Normal" value={kpis.fluxoN} color="var(--cyan)"
                    subtitle="classificação" />
                  <KPICard label="Eng. Reversa" value={kpis.fluxoER} color="var(--orange)"
                    subtitle="Fluxo Exceção" />
                </>
              )}
            </div>
          </section>

          {/* ── CHARTS ROW ── */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* State distribution */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distribuição por State</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stateDistrib.map(s => (
                  <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 90, fontSize: 11, color: STATE_COLORS[s.state] || 'var(--text-muted)', flexShrink: 0 }}>{s.state}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: STATE_COLORS[s.state] || 'var(--text-muted)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 40, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entrega distribution */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status de Entrega REQ/FIGMA</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entregaDistrib.map(s => (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 150, fontSize: 11, color: ENTREGA_COLORS[s.status] || 'var(--text-muted)', flexShrink: 0 }}>{s.status}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: ENTREGA_COLORS[s.status] || 'var(--text-muted)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 40, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── DATA TABLE ── */}
          <DataTable data={filteredData} view={activeView} />

        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
