export const PythonTokenType = {
    Keyword: "Keyword",
    Identifier: "Identifier",
    Number: "Number",
    Operator: "Operator",
    Separator: "Separator",
    String: "String",
    Comment: "Comment",
    Indent: "Indent",
    Dedent: "Dedent",
}

const pythonKeywords = new Set([
    "and",
    "as",
    "assert",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
    "True",
    "False",
    "None",
    "async",
    "await",
    "nonlocal",
    // Note: "print" is NOT included here because it's a function in Python 3, not a keyword
])

const pythonOperators = new Set([
    "+",
    "-",
    "*",
    "/",
    "//",
    "%",
    "**",
    "=",
    "+=",
    "-=",
    "*=",
    "/=",
    "//=",
    "%=",
    "**=",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "&",
    "|",
    "^",
    "~",
    "<<",
    ">>",
    "&=",
    "|=",
    "^=",
    "<<=",
    ">>=",
])

const pythonSeparators = new Set(["(", ")", "[", "]", "{", "}", ",", ":", ".", ";", "@", "->", "..."])

function isPythonNumber(str) {
    const numberRegex = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[jJ]?$/
    return numberRegex.test(str)
}

function isPythonIdentifier(str) {
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    return identifierRegex.test(str)
}

function processPythonToken(token, tokens, line, col) {
    if (pythonKeywords.has(token)) {
        tokens.push({ type: PythonTokenType.Keyword, value: token, line, col })
    } else if (isPythonNumber(token)) {
        tokens.push({ type: PythonTokenType.Number, value: token, line, col })
    } else if (isPythonIdentifier(token)) {
        tokens.push({ type: PythonTokenType.Identifier, value: token, line, col })
    }
}

export function tokenizePython(code) {
    if (!code || typeof code !== "string") return []

    const tokens = []
    const lines = code.split("\n")
    let lineNumber = 1

    for (const line of lines) {
        let col = 1
        let current = ""
        let inString = false
        let stringChar = ""
        let inTripleString = false
        let tripleStringChar = ""
        let i = 0

        // Handle indentation
        let indentLevel = 0
        while (i < line.length && (line[i] === " " || line[i] === "\t")) {
            indentLevel += line[i] === " " ? 1 : 4
            i++
            col++
        }

        if (i < line.length && line[i] !== "#" && indentLevel > 0) {
            tokens.push({ type: PythonTokenType.Indent, value: indentLevel.toString(), line: lineNumber, col: 1 })
        }

        while (i < line.length) {
            const c = line[i]

            // Handle comments
            if (!inString && !inTripleString && c === "#") {
                if (current.length > 0) {
                    processPythonToken(current, tokens, lineNumber, col - current.length)
                    current = ""
                }
                tokens.push({ type: PythonTokenType.Comment, value: line.substring(i), line: lineNumber, col })
                break
            }

            // Handle triple-quoted strings
            if (!inString && (c === '"' || c === "'")) {
                if (i + 2 < line.length && line[i + 1] === c && line[i + 2] === c) {
                    if (current.length > 0) {
                        processPythonToken(current, tokens, lineNumber, col - current.length)
                        current = ""
                    }
                    inTripleString = true
                    tripleStringChar = c
                    current = c + c + c
                    i += 3
                    col += 3
                    continue
                }
            }

            if (inTripleString) {
                current += c
                if (
                    c === tripleStringChar &&
                    i + 2 < line.length &&
                    line[i + 1] === tripleStringChar &&
                    line[i + 2] === tripleStringChar
                ) {
                    current += tripleStringChar + tripleStringChar
                    tokens.push({ type: PythonTokenType.String, value: current, line: lineNumber, col: col - current.length + 1 })
                    current = ""
                    inTripleString = false
                    tripleStringChar = ""
                    i += 3
                    col += 3
                    continue
                }
                i++
                col++
                continue
            }

            // Handle regular strings
            if (!inString && (c === '"' || c === "'")) {
                if (current.length > 0) {
                    processPythonToken(current, tokens, lineNumber, col - current.length)
                    current = ""
                }
                inString = true
                stringChar = c
                current = c
                i++
                col++
                continue
            }

            if (inString) {
                current += c
                if (c === stringChar && (i === 0 || line[i - 1] !== "\\")) {
                    tokens.push({ type: PythonTokenType.String, value: current, line: lineNumber, col: col - current.length + 1 })
                    current = ""
                    inString = false
                    stringChar = ""
                }
                i++
                col++
                continue
            }

            // Handle whitespace
            if (/\s/.test(c)) {
                if (current.length > 0) {
                    processPythonToken(current, tokens, lineNumber, col - current.length)
                    current = ""
                }
                i++
                col++
                continue
            }

            // Handle operators
            if (pythonOperators.has(c)) {
                if (current.length > 0) {
                    processPythonToken(current, tokens, lineNumber, col - current.length)
                    current = ""
                }

                let opValue = c
                // Check for multi-character operators
                if (i + 1 < line.length) {
                    const twoChar = c + line[i + 1]
                    if (pythonOperators.has(twoChar)) {
                        opValue = twoChar
                        if (i + 2 < line.length) {
                            const threeChar = twoChar + line[i + 2]
                            if (pythonOperators.has(threeChar)) {
                                opValue = threeChar
                                i += 2
                                col += 2
                            } else {
                                i++
                                col++
                            }
                        } else {
                            i++
                            col++
                        }
                    }
                }

                tokens.push({ type: PythonTokenType.Operator, value: opValue, line: lineNumber, col })
                i++
                col++
                continue
            }

            // Handle separators
            if (pythonSeparators.has(c)) {
                if (current.length > 0) {
                    processPythonToken(current, tokens, lineNumber, col - current.length)
                    current = ""
                }

                let sepValue = c
                // Check for multi-character separators
                if (c === "-" && i + 1 < line.length && line[i + 1] === ">") {
                    sepValue = "->"
                    i++
                    col++
                } else if (c === "." && i + 2 < line.length && line[i + 1] === "." && line[i + 2] === ".") {
                    sepValue = "..."
                    i += 2
                    col += 2
                }

                tokens.push({ type: PythonTokenType.Separator, value: sepValue, line: lineNumber, col })
                i++
                col++
                continue
            }

            current += c
            i++
            col++
        }

        // Process any remaining token
        if (current.length > 0) {
            processPythonToken(current, tokens, lineNumber, col - current.length)
        }

        lineNumber++
    }

    return tokens
}
