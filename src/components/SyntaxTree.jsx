export default function SyntaxTree({ tokens, errors }) {
  return (
    <div className="panel">
      <h2>Lexical Tokens</h2>
      <ul className="tokens">
        {tokens.map((t, i) => (
          <div className={`${t.type} list-item`} key={i}>

            <b>{t.type}</b>: <code>{t.value}</code> (line {t.line}, col {t.col})

          </div>
        ))}
      </ul>
      <h2>Syntax Errors</h2>
      {errors.length === 0 ? (
        <div style={{ color: "green" }}>No syntax errors</div>
      ) : (
        <ul style={{ color: "red" }}>
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
