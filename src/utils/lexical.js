export const TokenType = {
  Keyword: "Keyword",
  Identifier: "Identifier",
  Number: "Number",
  Operator: "Operator",
  Separator: "Separator",
  String: "String",
}

const keywords = new Set([
  "int",
  "float",
  "double",
  "long",
  "char",
  "bool",
  "string",
  "if",
  "else",
  "for",
  "while",
  "true",
  "false",
  "return",
  "void",
])

const operators = new Set(["+", "-", "*", "/", "=", "%", "&", "|", "<", ">", "!", "^", "++", "--", "<=", ">=", "=="])

const separators = new Set(["{", "}", ",", "[", "]", "(", ")", ":", ";"])

function isNumber(str) {
  if (str.length === 0) return false

  let hasDecimal = false
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ".") {
      if (hasDecimal) return false
      hasDecimal = true
    } else if (!/\d/.test(str[i])) {
      return false
    }
  }
  return true
}

function isIdentifier(str) {
  if (str.length === 0 || /^\d/.test(str)) return false

  for (let i = 0; i < str.length; i++) {
    if (!/[a-zA-Z0-9_]/.test(str[i])) {
      return false
    }
  }
  return true
}

export function tokenize(code) {
  if (!code || typeof code !== "string") {
    return []
  }

  const tokens = []
  let line = 1,
    col = 1
  let current = ""
  let inString = false
  let inComment = false
  let inLineComment = false

  for (let i = 0; i < code.length; i++) {
    const c = code[i]

    if (!inString) {
      if (c === "/" && i + 1 < code.length && code[i + 1] === "/") {
        inLineComment = true
        i++
        col += 2
        continue
      } else if (c === "/" && i + 1 < code.length && code[i + 1] === "*") {
        inComment = true
        i++
        col += 2
        continue
      } else if (inComment && c === "*" && i + 1 < code.length && code[i + 1] === "/") {
        inComment = false
        i++
        col += 2
        continue
      }
    }

    if (inLineComment) {
      if (c === "\n") {
        inLineComment = false
        line++
        col = 1
      } else {
        col++
      }
      continue
    }

    if (inComment) {
      if (c === "\n") {
        line++
        col = 1
      } else {
        col++
      }
      continue
    }

    if (c === "\n") {
      line++
      col = 1
      continue
    }

    if (inString) {
      if (c === '"') {
        tokens.push({
          type: TokenType.String,
          value: current,
          line,
          col: col - current.length - 1,
        })
        current = ""
        inString = false
      } else {
        current += c
      }
      col++
      continue
    }

    if (c === '"') {
      if (current.length > 0) {
        const startCol = col - current.length
        if (keywords.has(current)) {
          tokens.push({ type: TokenType.Keyword, value: current, line, col: startCol })
        } else if (isNumber(current)) {
          tokens.push({ type: TokenType.Number, value: current, line, col: startCol })
        } else if (isIdentifier(current)) {
          tokens.push({ type: TokenType.Identifier, value: current, line, col: startCol })
        }
        current = ""
      }
      inString = true
      col++
      continue
    }

    if (/\s/.test(c)) {
      if (current.length > 0) {
        const startCol = col - current.length
        if (keywords.has(current)) {
          tokens.push({ type: TokenType.Keyword, value: current, line, col: startCol })
        } else if (isNumber(current)) {
          tokens.push({ type: TokenType.Number, value: current, line, col: startCol })
        } else if (isIdentifier(current)) {
          tokens.push({ type: TokenType.Identifier, value: current, line, col: startCol })
        }
        current = ""
      }
      col++
      continue
    }

    if (operators.has(c)) {
      if (current.length > 0) {
        const startCol = col - current.length
        if (keywords.has(current)) {
          tokens.push({ type: TokenType.Keyword, value: current, line, col: startCol })
        } else if (isNumber(current)) {
          tokens.push({ type: TokenType.Number, value: current, line, col: startCol })
        } else if (isIdentifier(current)) {
          tokens.push({ type: TokenType.Identifier, value: current, line, col: startCol })
        }
        current = ""
      }

      let opValue = c
      if (i + 1 < code.length) {
        const nextChar = code[i + 1]
        const potentialOp = c + nextChar
        if (["++", "--", "==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/="].includes(potentialOp)) {
          opValue = potentialOp
          i++
          col++
        }
      }

      tokens.push({ type: TokenType.Operator, value: opValue, line, col })
      col++
      continue
    }

    if (separators.has(c)) {
      if (current.length > 0) {
        const startCol = col - current.length
        if (keywords.has(current)) {
          tokens.push({ type: TokenType.Keyword, value: current, line, col: startCol })
        } else if (isNumber(current)) {
          tokens.push({ type: TokenType.Number, value: current, line, col: startCol })
        } else if (isIdentifier(current)) {
          tokens.push({ type: TokenType.Identifier, value: current, line, col: startCol })
        }
        current = ""
      }
      tokens.push({ type: TokenType.Separator, value: c, line, col })
      col++
      continue
    }

    current += c
    col++
  }

  if (current.length > 0) {
    const startCol = col - current.length
    if (keywords.has(current)) {
      tokens.push({ type: TokenType.Keyword, value: current, line, col: startCol })
    } else if (isNumber(current)) {
      tokens.push({ type: TokenType.Number, value: current, line, col: startCol })
    } else if (isIdentifier(current)) {
      tokens.push({ type: TokenType.Identifier, value: current, line, col: startCol })
    }
  }

  return tokens
}
