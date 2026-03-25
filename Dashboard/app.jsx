const { useState, useMemo, useRef, useEffect } = React;

// ── DATA ─────────────────────────────────────────────────────────────────────
const rawData = typeof REAL_DATA !== 'undefined' ? REAL_DATA : [];

// ── COLOR MAPS (hex para suportar transparência inline) ────────────────────
const STATE_COLORS = {
  'Construindo':        '#3b82f6',
  'Desenvolvimento':    '#06b6d4',
  'Devolvidos':         '#ef4444',
  'Finalizado':         '#22c55e',
  'Não Iniciado':       '#64748b',
  'Pronto para Deploy': '#a855f7',
  'Stand By':           '#f59e0b',
  'Stand By Externo':   '#f97316',
  'Stand By Interno':   '#f59e0b',
  'Testando':           '#8b5cf6',
};

const ENTREGA_COLORS = {
  'Entregue REQ + FIGMA': '#22c55e',
  'Apenas REQ':           '#3b82f6',
  'Apenas FIGMA':         '#f59e0b',
  'Não Entregue':         '#ef4444',
  'Não Iniciado':         '#64748b',
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d={d} />
  </svg>
);
const SearchIcon       = p => <Icon {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const FilterIcon       = p => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const ChevronDownIcon  = p => <Icon {...p} d="M6 9l6 6 6-6" />;
const ExternalLinkIcon = p => <Icon {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />;
const BarChartIcon     = p => <Icon {...p} d="M12 20V10M18 20V4M6 20v-4" />;
const TableIcon        = p => <Icon {...p} d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />;
const CheckIcon        = p => <Icon {...p} d="M20 6L9 17l-5-5" />;
const XIcon            = p => <Icon {...p} d="M18 6L6 18M6 6l12 12" />;
const SlidersIcon      = p => <Icon {...p} d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />;

// ── MULTI-SELECT DROPDOWN ─────────────────────────────────────────────────────
function MultiSelectDropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = val => onChange(
    selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]
  );

  const count = selected.length;

  return (
    <div ref={ref} className="ms-root">
      <button
        type="button"
        className={`ms-trigger${open ? ' ms-open' : ''}${count > 0 ? ' ms-active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ms-label">
          {count > 0 ? `${count} selecionado${count > 1 ? 's' : ''}` : `Selecionar…`}
        </span>
        {count > 0 && <span className="ms-badge">{count}</span>}
        <ChevronDownIcon size={13} className={`ms-chevron${open ? ' ms-chevron-up' : ''}`} />
      </button>

      {open && (
        <div className="ms-dropdown fade-in">
          {count > 0 && (
            <div className="ms-clear-row">
              <button
                type="button"
                className="ms-clear"
                onClick={e => { e.stopPropagation(); onChange([]); }}
              >
                <XIcon size={11} /> Limpar seleção
              </button>
            </div>
          )}
          <div className="ms-list">
            {options.map(opt => {
              const sel = selected.includes(opt);
              return (
                <div
                  key={opt}
                  className={`ms-item${sel ? ' ms-selected' : ''}`}
                  onClick={() => toggle(opt)}
                >
                  <span className={`ms-check${sel ? ' ms-check-on' : ''}`}>
                    {sel && <CheckIcon size={9} />}
                  </span>
                  <span className="ms-item-text">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FILTERS PANEL ─────────────────────────────────────────────────────────────
const FILTER_DEFS = [
  { label: 'Mês',                   key: 'mes'                  },
  { label: 'Sub Status',            key: 'subStatus'            },
  { label: 'Entrega REQ / FIGMA',   key: 'entregaREQ'           },
  { label: 'Classificação de Fluxo',key: 'classificacaoFluxo'   },
  { label: 'Produto Controladoria', key: 'produtoControladoria' },
];

function FiltersPanel({ filters, setFilters, data, onClose }) {
  const uniqueVals = key => [...new Set(data.map(d => d[key]).filter(Boolean))].sort();
  const setKey     = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const hasActive = FILTER_DEFS.some(({ key }) => (filters[key] || []).length > 0)
    || (filters.search || '').length > 0;

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <div className="filters-title">
          <FilterIcon size={14} />
          <span>Filtros</span>
        </div>
        <div className="filters-header-actions">
          {hasActive && (
            <button className="btn-link" onClick={() => setFilters({})}>
              Limpar todos
            </button>
          )}
          {onClose && (
            <button className="btn-icon" onClick={onClose} title="Fechar">
              <XIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Busca */}
      <div className="filter-search-wrap">
        <SearchIcon size={13} className="filter-search-icon" />
        <input
          className="filter-search"
          type="text"
          placeholder="ID, Caso de Uso, REQ..."
          value={filters.search || ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
      </div>

      {/* Dropdowns */}
      <div className="filters-list">
        {FILTER_DEFS.map(({ label, key }) => (
          <div key={key} className="filter-item">
            <span className="filter-item-label">{label}</span>
            <MultiSelectDropdown
              label={label}
              options={uniqueVals(key)}
              selected={filters[key] || []}
              onChange={v => setKey(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, color, icon, subtitle, pct }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {icon && <span style={{ color, opacity: 0.75 }}>{icon}</span>}
      </div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      {pct !== undefined && (
        <div className="kpi-bar-track">
          <div className="kpi-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  );
}

// ── CHART CARD ────────────────────────────────────────────────────────────────
function ChartCard({ title, rows, colorMap }) {
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <div className="chart-card">
      <p className="chart-title">{title}</p>
      <div className="chart-rows">
        {rows.map(r => {
          const key   = r.state || r.status;
          const color = colorMap[key] || '#64748b';
          const pct   = Math.round(r.count / max * 100);
          return (
            <div key={key} className="chart-row">
              <span className="chart-row-label" style={{ color }}>{key}</span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="chart-row-count">{r.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DATA TABLE ────────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: 'id',                   label: 'ID / Caso de Uso',  width: 220 },
  { key: 'state',                label: 'State',             width: 130 },
  { key: 'subStatus',            label: 'Sub Status',        width: 110 },
  { key: 'mes',                  label: 'Mês',               width: 70  },
  { key: 'entregaREQ',           label: 'Entrega REQ',       width: 170 },
  { key: 'requisitoFuncional',   label: 'REQ Funcional',     width: 110 },
  { key: 'produtoControladoria', label: 'Produto',           width: 150 },
  { key: 'req',                  label: 'Requisitos',        width: 120 },
  { key: 'pd',                   label: 'Designer',          width: 120 },
  { key: 'classificacaoFluxo',   label: 'Class. Fluxo',      width: 140 },
  { key: 'statusEFFIGMA',        label: 'Status EF/FIGMA',   width: 170 },
  { key: 'url',                  label: 'URL',               width: 60  },
];

function DataTable({ data }) {
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = String(a[sort.key] || '');
      const bv = String(b[sort.key] || '');
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [data, sort]);

  useEffect(() => { setPage(1); }, [data]);

  const pages   = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = key => setSort(s => ({
    key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc'
  }));

  const fluxoColor = f =>
    f === 'Fluxo Normal'      ? '#06b6d4' :
    f === 'Fluxo Alternativo' ? '#f97316' : '#a855f7';

  const paginNumbers = () => {
    const nums = [];
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const end   = Math.min(pages, start + 4);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  return (
    <div className="table-card">
      <div className="table-header-bar">
        <div className="table-title-wrap">
          <TableIcon size={14} />
          <span>Casos de Uso</span>
        </div>
        <span className="table-count">{sorted.length} registros</span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {TABLE_COLS.map(c => (
                <th key={c.key} style={{ minWidth: c.width }} onClick={() => toggleSort(c.key)}>
                  {c.label}
                  <span className="sort-indicator">
                    {sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row.id} className={i % 2 === 1 ? 'row-alt' : ''}>
                <td>
                  <div className="cell-id">{row.id}</div>
                  <div className="cell-name">{row.casoDeUso}</div>
                </td>
                <td>
                  <span className="state-chip">
                    <span className="status-dot" style={{ background: STATE_COLORS[row.state] || '#64748b' }} />
                    <span style={{ color: STATE_COLORS[row.state] || '#64748b', fontSize: 12 }}>{row.state}</span>
                  </span>
                </td>
                <td className="cell-secondary">{row.subStatus}</td>
                <td className="cell-muted">{row.mes}</td>
                <td>
                  <span className="tag-badge" style={{
                    background: `${ENTREGA_COLORS[row.entregaREQ] || '#64748b'}22`,
                    color: ENTREGA_COLORS[row.entregaREQ] || '#64748b',
                    border: `1px solid ${ENTREGA_COLORS[row.entregaREQ] || '#64748b'}44`,
                  }}>{row.entregaREQ}</span>
                </td>
                <td className="cell-secondary">{row.requisitoFuncional}</td>
                <td className="cell-muted">{row.produtoControladoria}</td>
                <td className="cell-secondary">{row.req}</td>
                <td className="cell-secondary">{row.pd}</td>
                <td>
                  <span style={{ fontSize: 11, color: fluxoColor(row.classificacaoFluxo) }}>
                    {row.classificacaoFluxo}
                  </span>
                </td>
                <td>
                  <span className="tag-badge" style={{
                    background: `${ENTREGA_COLORS[row.statusEFFIGMA] || '#64748b'}22`,
                    color: ENTREGA_COLORS[row.statusEFFIGMA] || '#64748b',
                    border: `1px solid ${ENTREGA_COLORS[row.statusEFFIGMA] || '#64748b'}44`,
                  }}>{row.statusEFFIGMA}</span>
                </td>
                <td>
                  {row.url && (
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="link-btn">
                      <ExternalLinkIcon size={12} /> Ver
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLS.length} className="empty-row">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Anterior
          </button>
          {paginNumbers().map(p => (
            <button
              key={p}
              className={`page-num${p === page ? ' page-active' : ''}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
function App() {
  const [filters, setFilters]           = useState({});
  const [showFilters, setShowFilters]   = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);

  const filteredData = useMemo(() => {
    let d = rawData;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      d = d.filter(r =>
        (r.id || '').toLowerCase().includes(q) ||
        (r.casoDeUso || '').toLowerCase().includes(q) ||
        (r.req || '').toLowerCase().includes(q) ||
        (r.requisitoFuncional || '').toLowerCase().includes(q)
      );
    }
    FILTER_DEFS.forEach(({ key }) => {
      if ((filters[key] || []).length > 0)
        d = d.filter(r => filters[key].includes(r[key]));
    });
    return d;
  }, [filters]);

  const kpis = useMemo(() => {
    const d     = filteredData;
    const total = d.length;
    const pct   = n => total ? Math.round(n / total * 100) : 0;
    const count = val => d.filter(r => r.entregaREQ === val).length;
    const entregue    = count('Entregue REQ + FIGMA');
    const naoEntregue = count('Não Entregue');
    const apenasREQ   = count('Apenas REQ');
    const apenasF     = count('Apenas FIGMA');
    const fluxoN  = d.filter(r => r.classificacaoFluxo === 'Fluxo Normal').length;
    const fluxoER = d.filter(r => r.classificacaoFluxo === 'Fluxo de Exceção').length;
    return { total, entregue, naoEntregue, apenasREQ, apenasF, fluxoN, fluxoER, pct };
  }, [filteredData]);

  const stateDistrib = useMemo(() => {
    const counts = {};
    filteredData.forEach(r => { counts[r.state] = (counts[r.state] || 0) + 1; });
    return Object.entries(counts).map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const entregaDistrib = useMemo(() => {
    const counts = {};
    filteredData.forEach(r => { counts[r.entregaREQ] = (counts[r.entregaREQ] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const hasFilters = FILTER_DEFS.some(({ key }) => (filters[key] || []).length > 0)
    || (filters.search || '').length > 0;

  return (
    <div className="app-root">

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <BarChartIcon size={16} style={{ color: 'white' }} />
          </div>
          <div>
            <div className="brand-name">USE CASE CONTROL</div>
            <div className="brand-sub">Vector · Controladoria</div>
          </div>
        </div>

        <div className="header-actions">
          <span className="header-count">{filteredData.length} registros</span>

          {/* Mobile */}
          <button className="btn-icon-mobile" onClick={() => setMobileFilters(true)}>
            <FilterIcon size={15} />
            {hasFilters && <span className="filter-dot" />}
          </button>

          {/* Desktop */}
          <button
            className={`btn-filter${showFilters ? ' btn-filter-active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersIcon size={14} />
            <span>Filtros</span>
            {hasFilters && <span className="ms-badge" style={{ fontSize: 10 }}>!</span>}
          </button>

          <div className="avatar">AO</div>
        </div>
      </header>

      {/* ── MOBILE OVERLAY ── */}
      {mobileFilters && (
        <div className="mobile-overlay" onClick={() => setMobileFilters(false)}>
          <div className="mobile-drawer fade-in" onClick={e => e.stopPropagation()}>
            <FiltersPanel filters={filters} setFilters={setFilters} data={rawData} onClose={() => setMobileFilters(false)} />
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="app-body">

        {showFilters && (
          <aside className="sidebar fade-in">
            <FiltersPanel filters={filters} setFilters={setFilters} data={rawData} />
          </aside>
        )}

        <main className="main-content">

          {/* Page title */}
          <div className="page-title-row">
            <div className="page-accent-bar" />
            <h1 className="page-title">Dashboard</h1>
            {hasFilters && <span className="active-badge">Filtros ativos</span>}
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            <KPICard label="Total de CUs"    value={kpis.total}        color="#8b5cf6" icon={<BarChartIcon size={15} />}  subtitle="casos de uso" />
            <KPICard label="Entregue"        value={kpis.entregue}     color="#22c55e" subtitle={`${kpis.pct(kpis.entregue)}% do total`}       pct={kpis.pct(kpis.entregue)} />
            <KPICard label="Não Entregue"    value={kpis.naoEntregue}  color="#ef4444" subtitle={`${kpis.pct(kpis.naoEntregue)}% do total`}    pct={kpis.pct(kpis.naoEntregue)} />
            <KPICard label="Apenas REQ"      value={kpis.apenasREQ}    color="#3b82f6" subtitle="REQ entregue"            pct={kpis.pct(kpis.apenasREQ)} />
            <KPICard label="Apenas FIGMA"    value={kpis.apenasF}      color="#f59e0b" subtitle="FIGMA entregue"          pct={kpis.pct(kpis.apenasF)} />
            <KPICard label="Fluxo Normal"    value={kpis.fluxoN}       color="#06b6d4" subtitle="classificação"           pct={kpis.pct(kpis.fluxoN)} />
            <KPICard label="Eng. Reversa"    value={kpis.fluxoER}      color="#f97316" subtitle="Fluxo de Exceção"        pct={kpis.pct(kpis.fluxoER)} />
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <ChartCard title="Distribuição por State"          rows={stateDistrib}   colorMap={STATE_COLORS} />
            <ChartCard title="Status de Entrega REQ / FIGMA"  rows={entregaDistrib} colorMap={ENTREGA_COLORS} />
          </div>

          {/* Table */}
          <DataTable data={filteredData} />

        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
