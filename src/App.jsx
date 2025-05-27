import { useState, useEffect } from "react";
import CodeEditor from "./components/CodeEditor.jsx";
import SyntaxTree from "./components/SyntaxTree.jsx";
import LanguageSelector from "./components/LanguageSelector.jsx"
import { tokenize } from "./utils/lexical.js";
import { parse } from "./utils/syntax.js";
import { tokenizePython } from "./utils/lexical-python.js"
import { parsePython } from "./utils/syntax-python.js"


export default function App() {
  const defaultCode = {
    c: "int main() {\n  return 0;\n}",
    python: 'def main():\n    print("Hello, World!")\n    return 0\n\nif __name__ == "__main__":\n    main()',
  }

  const [code, setCode] = useState(defaultCode.c);
  const [tokens, setTokens] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("c");

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    setCode(defaultCode[language])
  };

  useEffect(() => {
    let tokens, result

    if (selectedLanguage === "c") {
      tokens = tokenize(code)
      result = parse(tokens)
    } else if (selectedLanguage === "python") {
      tokens = tokenizePython(code)
      result = parsePython(tokens)
    }

    setTokens(tokens || [])
    setErrors(result?.errors || [])
  }, [code, selectedLanguage]);

  return (
    <div className="container">
      <h1>Lexical & Syntax Analyzer</h1>
      <div className="panels">
        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={handleLanguageChange} />
        <CodeEditor code={code} onChange={setCode} />
        <SyntaxTree tokens={tokens} errors={errors} />
      </div>
    </div>
  );
}
