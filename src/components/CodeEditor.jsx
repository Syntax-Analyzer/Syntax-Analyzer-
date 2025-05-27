export default function CodeEditor({ code, onChange }) {
  return (
    <div className="panel">
      <h2>Code Editor</h2>
      <textarea
        value={code}
        onChange={e => onChange(e.target.value)}
        rows={16}
        cols={40}
        style={{ fontFamily: "monospace", fontSize: "1rem", width: "100%" }}
      />
    </div>
  );
}
