import { useEffect, useState, useRef } from 'react';
import {
  Zap,
  Radio,
  StopCircle,
  Database,
  CheckCircle,
  XCircle,
  Copy,
  RotateCcw,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SCRAPE_MIN_YEAR = 2024;
const SCRAPE_MAX_YEAR = 2026;

interface CrawlStatus {
  running: boolean;
  phase: 'idle' | 'collecting' | 'scraping' | 'done';
  added: number;
  skipped: number;
  failed: number;
  totalLinks: number;
  minYear: number;
  maxYear: number;
  startedAt?: string;
  finishedAt?: string;
  recentLogs: string[];
}

export default function AdminCrawlMonitor() {
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [msg, setMsg] = useState('');
  const [concurrency, setConcurrency] = useState(6);
  const [showConfig, setShowConfig] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/api/crawl-status`);
      setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [status?.recentLogs]);

  const startCrawl = async () => {
    setMsg('');
    try {
      const res = await fetch(`${API}/api/crawl-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: 'STC Japan', minYear: SCRAPE_MIN_YEAR, maxYear: SCRAPE_MAX_YEAR, concurrency }),
      });
      const data = await res.json();
      setMsg(res.ok ? data.message : data.error || 'Failed');
      fetchStatus();
    } catch {
      setMsg('Could not connect to backend.');
    }
  };

  const stopCrawl = async () => {
    await fetch(`${API}/api/crawl-stop`, { method: 'POST' });
    fetchStatus();
  };

  const phaseLabel: Record<string, string> = {
    idle: 'Idle',
    collecting: 'Phase 1 — Collecting links',
    scraping: 'Phase 2 — Scraping details',
    done: 'Complete',
  };

  const logColor = (line: string) => {
    if (line.includes('✅')) return '#22C55E';
    if (line.includes('❌') || line.includes('💥')) return '#EF4444';
    if (line.includes('⏭') || line.includes('🔁')) return '#6B7280';
    if (line.includes('Phase 2') || line.includes('⚡')) return '#60A5FA';
    if (line.includes('🚀') || line.includes('📄') || line.includes('🔍')) return '#D4A853';
    return '#9CA3AF';
  };

  const progress = status && status.totalLinks > 0
    ? Math.min(((status.added + status.skipped + status.failed) / status.totalLinks) * 100, 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crawl Monitor</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: 4 }}>
            Automated 2-phase scraper for STC Japan listings
          </p>
        </div>
        <div className="flex gap-2">
          {status?.running ? (
            <button
              onClick={stopCrawl}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <StopCircle size={15} /> Stop Crawl
            </button>
          ) : (
            <button
              onClick={startCrawl}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: '#D4A853', color: '#0A0A0A' }}
            >
              <Zap size={15} /> Start Crawl
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div
        className="rounded-xl p-5"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: status?.running ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)' }}
            >
              <Radio size={16} style={{ color: status?.running ? '#22C55E' : '#6B7280' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {status ? phaseLabel[status.phase] : 'Loading…'}
              </p>
              <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                STC Japan · {SCRAPE_MIN_YEAR}–{SCRAPE_MAX_YEAR}
              </p>
            </div>
          </div>
          {status?.running && (
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Added', value: status?.added ?? 0, color: '#22C55E', icon: CheckCircle },
            { label: 'Links Found', value: status?.totalLinks ?? 0, color: '#D4A853', icon: Database },
            { label: 'Duplicates', value: status?.skipped ?? 0, color: '#9CA3AF', icon: RotateCcw },
            { label: 'Failed', value: status?.failed ?? 0, color: '#EF4444', icon: XCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <Icon size={14} style={{ color, margin: '0 auto 6px' }} />
              <p className="text-xl font-bold text-white">{value}</p>
              <p style={{ color: '#6B7280', fontSize: '0.7rem', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar (phase 2) */}
        {status && status.totalLinks > 0 && status.phase === 'scraping' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#6B7280' }}>
              <span>Scraping progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #60A5FA, #818CF8)' }}
              />
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: 6 }}>
              {(status.added + status.skipped + status.failed)} / {status.totalLinks} processed
            </p>
          </div>
        )}
      </div>

      {/* Config */}
      <div
        className="rounded-xl"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center justify-between w-full px-5 py-4"
        >
          <span className="text-sm font-semibold text-white">Configuration</span>
          <ChevronDown
            size={15}
            style={{
              color: '#6B7280',
              transform: showConfig ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </button>
        {showConfig && (
          <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Supplier', value: 'STC Japan', editable: false },
              { label: 'Year Range', value: `${SCRAPE_MIN_YEAR} – ${SCRAPE_MAX_YEAR}`, editable: false },
              { label: 'Concurrency', value: concurrency, editable: true },
            ].map(({ label, value, editable }) => (
              <div key={label}>
                <p style={{ color: '#6B7280', fontSize: '0.72rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                {editable ? (
                  <select
                    value={concurrency}
                    onChange={e => setConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} scrapers</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-white">{value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log output */}
      <div
        className="rounded-xl"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-sm font-semibold text-white">Live Logs</span>
          <button
            onClick={() => {
              const text = (status?.recentLogs || []).join('\n');
              navigator.clipboard?.writeText(text);
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{ color: '#6B7280', background: 'rgba(255,255,255,0.04)' }}
          >
            <Copy size={11} /> Copy
          </button>
        </div>
        <div
          ref={logRef}
          className="font-mono text-xs p-4 overflow-y-auto"
          style={{ maxHeight: 320, color: '#6B7280' }}
        >
          {!status?.recentLogs?.length ? (
            <span>No logs yet. Start a crawl to see output here.</span>
          ) : (
            status.recentLogs.map((line, i) => (
              <div key={i} style={{ color: logColor(line), lineHeight: 1.7 }}>{line}</div>
            ))
          )}
        </div>
      </div>

      {msg && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(212,168,83,0.08)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.2)' }}
        >
          <AlertCircle size={14} /> {msg}
        </div>
      )}
    </div>
  );
}