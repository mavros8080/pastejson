import { useState, useCallback } from 'react';
import { JsonNode } from './JsonTree';

const SAMPLE = `{
  "name": "PasteJSON",
  "version": "1.0.0",
  "features": ["format", "validate", "tree view", "minify"],
  "meta": {
    "author": "you",
    "open": true,
    "stars": 0
  }
}`;

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'jnum';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'jkey-hl' : 'js';
        } else if (/true|false/.test(match)) {
          cls = 'jb';
        } else if (/null/.test(match)) {
          cls = 'jn';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export default function App() {
  const [input, setInput]   = useState(SAMPLE);
  const [view, setView]     = useState('formatted');
  const [parsed, setParsed] = useState(null);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats]   = useState(null);

  const parse = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) { setError('Nothing to parse.'); setParsed(null); setStats(null); return; }
    try {
      const obj = JSON.parse(trimmed);
      setParsed(obj);
      setError(null);
      const formatted = JSON.stringify(obj, null, 2);
      setStats({
        keys: countKeys(obj),
        size: new Blob([trimmed]).size,
        depth: getDepth(obj),
        lines: formatted.split('\n').length,
      });
    } catch (e) {
      setError(e.message);
      setParsed(null);
      setStats(null);
    }
  }, [input]);

  const getOutput = () => {
    if (!parsed) return '';
    if (view === 'formatted') return JSON.stringify(parsed, null, 2);
    if (view === 'minified')  return JSON.stringify(parsed);
    return '';
  };

  const copy = () => {
    const out = view === 'tree' ? JSON.stringify(parsed, null, 2) : getOutput();
    navigator.clipboard.writeText(out || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([getOutput()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'output.json'; a.click();
  };

  return (
    <div className="app">
      <header>
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#111827"/>
            <text x="3" y="22" fontFamily="monospace" fontSize="18" fontWeight="bold" fill="#38BDF8">{'{}'}</text>
          </svg>
          <span className="logo-text">PasteJSON</span>
        </div>
        <p className="tagline">Format, validate, and explore JSON instantly.</p>
      </header>

      <div className="workspace">
        <div className="panel left-panel">
          <div className="panel-header">
            <span className="panel-label">Input</span>
            <button className="sm-btn" onClick={() => { setInput(''); setParsed(null); setError(null); setStats(null); }}>clear</button>
          </div>
          <textarea
            className="json-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste JSON here..."
          />
          <button className="parse-btn" onClick={parse}>Parse &rarr;</button>
        </div>

        <div className="divider" />

        <div className="panel right-panel">
          <div className="panel-header">
            <div className="view-tabs">
              {['formatted','tree','minified'].map(v => (
                <button key={v} className={`view-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="panel-actions">
              <button className="sm-btn" onClick={copy} disabled={!parsed}>{copied ? 'copied!' : 'copy'}</button>
              <button className="sm-btn" onClick={download} disabled={!parsed || view === 'tree'}>download</button>
            </div>
          </div>

          {error && (
            <div className="error-box">
              <span className="error-icon">!</span>
              <span className="error-msg">{error}</span>
            </div>
          )}

          {stats && !error && (
            <div className="stats-row">
              <span>{stats.keys} keys</span>
              <span>{stats.depth} levels deep</span>
              <span>{stats.lines} lines</span>
              <span>{stats.size} bytes</span>
            </div>
          )}

          <div className="output-area">
            {!parsed && !error && (
              <div className="empty-state">Parse some JSON to see the output here.</div>
            )}

            {parsed && view !== 'tree' && (
              <pre
                className="formatted-output"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(getOutput()) }}
              />
            )}

            {parsed && view === 'tree' && (
              <div className="tree-output">
                <div className="jline">
                  <JsonNode data={parsed} depth={0} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function countKeys(obj, count = 0) {
  if (typeof obj !== 'object' || obj === null) return count;
  return Object.values(obj).reduce((acc, v) => countKeys(v, acc), count + Object.keys(obj).length);
}

function getDepth(obj, d = 0) {
  if (typeof obj !== 'object' || obj === null) return d;
  return Math.max(d, ...Object.values(obj).map(v => getDepth(v, d + 1)));
}
