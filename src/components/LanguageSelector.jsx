export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
  const languages = [
    { value: "c", label: "C" },
    { value: "python", label: "Python" },
  ]

  return (
    <div className="panel" style={{ marginBottom: "1rem" }}>
      <h3>Select Language</h3>
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        style={{
          padding: "0.5rem",
          borderRadius: "4px",
          border: "1px solid #bbb",
          fontSize: "1rem",
          width: "200px",
        }}>
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
