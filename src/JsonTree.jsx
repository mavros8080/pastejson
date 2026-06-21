import { useState } from 'react';

function JsonValue({ data }) {
  if (data === null)              return <span className="jn">null</span>;
  if (typeof data === 'boolean')  return <span className="jb">{String(data)}</span>;
  if (typeof data === 'number')   return <span className="jnum">{data}</span>;
  if (typeof data === 'string')   return <span className="js">"{escapeStr(data)}"</span>;
  return null;
}

function escapeStr(s) {
  return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\t/g,'\\t');
}

export function JsonNode({ data, depth }) {
  const [open, setOpen] = useState(depth < 3);

  if (data === null || typeof data !== 'object') {
    return <JsonValue data={data} />;
  }

  const isArr  = Array.isArray(data);
  const keys   = Object.keys(data);
  const open_b = isArr ? '[' : '{';
  const clos_b = isArr ? ']' : '}';

  if (keys.length === 0) {
    return <span className="jbrace">{open_b}{clos_b}</span>;
  }

  return (
    <span className="jnode">
      <button className="jtoggle" onClick={() => setOpen(o => !o)}>
        {open ? '▾' : '▸'}
      </button>
      <span className="jbrace">{open_b}</span>

      {!open ? (
        <span className="jellipsis" onClick={() => setOpen(true)}>
          {isArr ? `${keys.length} items` : `${keys.length} keys`}
        </span>
      ) : (
        <div className="jchildren">
          {keys.map((k, i) => (
            <div key={k} className="jline" style={{ paddingLeft: `${(depth + 1) * 18}px` }}>
              {!isArr && <><span className="jkey">"{k}"</span><span className="jpunct">: </span></>}
              <JsonNode data={data[k]} depth={depth + 1} />
              {i < keys.length - 1 && <span className="jpunct">,</span>}
            </div>
          ))}
          <div style={{ paddingLeft: `${depth * 18}px` }}>
            <span className="jbrace">{clos_b}</span>
          </div>
        </div>
      )}

      {open && <span />}
    </span>
  );
}
