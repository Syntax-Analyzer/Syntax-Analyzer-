import { PythonTokenType } from "./lexical-python.js"

export function parsePython(tokens) {
    if (!tokens || tokens.length === 0) {
        return { success: true, errors: [] }
    }

    const parser = new PythonSyntaxParser(tokens)
    try {
        parser.parseProgram()
        return {
            success: parser.errors.length === 0,
            errors: parser.errors,
        }
    } catch (error) {
        if (!parser.errors.length) {
            parser.errors.push(`Unexpected error: ${error}`)
        }
        return {
            success: false,
            errors: parser.errors,
        }
    }
}

class PythonSyntaxParser {
    constructor(tokens) {
        // Filter out comments and indentation tokens for simpler parsing
        this.tokens = tokens.filter(
            (t) =>
                t.type !== PythonTokenType.Comment && t.type !== PythonTokenType.Indent && t.type !== PythonTokenType.Dedent,
        )
        this.pos = 0
        this.errors = []
    }

    advance() {
        if (this.pos < this.tokens.length) {
            this.pos++
        }
    }

    peek() {
        if (this.pos < this.tokens.length) {
            return this.tokens[this.pos]
        }
        return null
    }

    peekNext() {
        if (this.pos + 1 < this.tokens.length) {
            return this.tokens[this.pos + 1]
        }
        return null
    }

    matchPython(type, value = "") {
        if (this.pos >= this.tokens.length) return false
        const token = this.tokens[this.pos]
        if (token.type === type && (value === "" || token.value === value)) {
            this.advance()
            return true
        }
        return false
    }

    expectPython(type, value = "") {
        if (this.pos >= this.tokens.length) {
            const error = `Python Syntax Error at EOF: Expected ${type}${value ? ` '${value}'` : ""}`
            this.errors.push(error)
            return false
        }
        const token = this.tokens[this.pos]
        if (token.type !== type || (value !== "" && token.value !== value)) {
            const error = `Python Syntax Error at line ${token.line}: Expected ${type}${value ? ` '${value}'` : ""}, got '${token.value}'`
            this.errors.push(error)
            return false
        }
        this.advance()
        return true
    }

    parseProgram() {
        if (this.tokens.length === 0) return

        while (this.pos < this.tokens.length) {
            try {
                this.parseStatement()
            } catch (error) {
                this.errors.push(`${error}`)
                this.recoverToNextStatement()
            }
        }
    }

    parseStatement() {
        const token = this.peek()
        if (!token) return

        // Function definition
        if (token.type === PythonTokenType.Keyword && token.value === "def") {
            this.parseFunctionDef()
        }
        // Class definition
        else if (token.type === PythonTokenType.Keyword && token.value === "class") {
            this.parseClassDef()
        }
        // If statement
        else if (token.type === PythonTokenType.Keyword && token.value === "if") {
            this.parseIfStatement()
        }
        // For loop
        else if (token.type === PythonTokenType.Keyword && token.value === "for") {
            this.parseForStatement()
        }
        // While loop
        else if (token.type === PythonTokenType.Keyword && token.value === "while") {
            this.parseWhileStatement()
        }
        // Try statement
        else if (token.type === PythonTokenType.Keyword && token.value === "try") {
            this.parseTryStatement()
        }
        // Import statement
        else if (token.type === PythonTokenType.Keyword && token.value === "import") {
            this.parseImportStatement()
        }
        // From import statement
        else if (token.type === PythonTokenType.Keyword && token.value === "from") {
            this.parseFromImportStatement()
        }
        // Return statement
        else if (token.type === PythonTokenType.Keyword && token.value === "return") {
            this.parseReturnStatement()
        }
        // Pass, break, continue statements
        else if (token.type === PythonTokenType.Keyword && ["pass", "break", "continue"].includes(token.value)) {
            this.advance() // Just consume the keyword
        }
        // Assignment or expression statement (including function calls like print())
        else if (token.type === PythonTokenType.Identifier) {
            this.parseAssignmentOrExpression()
        }
        // Expression statement (literals, etc.)
        else {
            this.parseExpressionStatement()
        }
    }

    parseAssignmentOrExpression() {
        const startPos = this.pos

        // Look ahead to see if this is an assignment
        let tempPos = this.pos
        let isAssignment = false

        // Skip the identifier
        if (tempPos < this.tokens.length && this.tokens[tempPos].type === PythonTokenType.Identifier) {
            tempPos++

            // Skip any attribute access or function calls to find assignment
            while (tempPos < this.tokens.length) {
                const token = this.tokens[tempPos]

                if (token.type === PythonTokenType.Separator && token.value === ".") {
                    tempPos++ // skip '.'
                    if (tempPos < this.tokens.length && this.tokens[tempPos].type === PythonTokenType.Identifier) {
                        tempPos++ // skip identifier after '.'
                    }
                } else if (token.type === PythonTokenType.Separator && token.value === "(") {
                    // This is a function call, not an assignment
                    break
                } else if (
                    token.type === PythonTokenType.Operator &&
                    ["=", "+=", "-=", "*=", "/=", "//=", "%=", "**="].includes(token.value)
                ) {
                    isAssignment = true
                    break
                } else {
                    break
                }
            }
        }

        if (isAssignment) {
            // Parse assignment
            this.expectPython(PythonTokenType.Identifier) // variable name

            // Handle attribute assignments like obj.attr = value
            while (this.peek()?.type === PythonTokenType.Separator && this.peek()?.value === ".") {
                this.advance() // consume '.'
                this.expectPython(PythonTokenType.Identifier) // attribute name
            }

            const opToken = this.peek()
            if (
                opToken &&
                opToken.type === PythonTokenType.Operator &&
                ["=", "+=", "-=", "*=", "/=", "//=", "%=", "**="].includes(opToken.value)
            ) {
                this.advance() // consume assignment operator
                this.parseExpression() // parse right-hand side
            } else {
                this.errors.push(`Expected assignment operator at line ${opToken?.line || "EOF"}`)
            }
        } else {
            // Parse as expression (function call, etc.)
            this.parseExpression()
        }
    }

    parseFunctionDef() {
        this.advance() // consume 'def'
        this.expectPython(PythonTokenType.Identifier) // function name
        this.expectPython(PythonTokenType.Separator, "(")

        // Parse parameters
        if (!this.matchPython(PythonTokenType.Separator, ")")) {
            do {
                this.expectPython(PythonTokenType.Identifier) // parameter name
                if (this.matchPython(PythonTokenType.Separator, ":")) {
                    this.parseExpression() // type annotation
                }
                if (this.matchPython(PythonTokenType.Operator, "=")) {
                    this.parseExpression() // default value
                }
            } while (this.matchPython(PythonTokenType.Separator, ","))
            this.expectPython(PythonTokenType.Separator, ")")
        }

        // Optional return type annotation
        if (this.matchPython(PythonTokenType.Separator, "->")) {
            this.parseExpression()
        }

        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()
    }

    parseClassDef() {
        this.advance() // consume 'class'
        this.expectPython(PythonTokenType.Identifier) // class name

        // Optional inheritance
        if (this.matchPython(PythonTokenType.Separator, "(")) {
            if (!this.matchPython(PythonTokenType.Separator, ")")) {
                do {
                    this.parseExpression() // base class
                } while (this.matchPython(PythonTokenType.Separator, ","))
                this.expectPython(PythonTokenType.Separator, ")")
            }
        }

        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()
    }

    parseIfStatement() {
        this.advance() // consume 'if'
        this.parseExpression() // condition
        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()

        // Handle elif and else
        while (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "elif") {
            this.advance() // consume 'elif'
            this.parseExpression() // condition
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }

        if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "else") {
            this.advance() // consume 'else'
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }
    }

    parseForStatement() {
        this.advance() // consume 'for'
        this.expectPython(PythonTokenType.Identifier) // loop variable
        this.expectPython(PythonTokenType.Keyword, "in")
        this.parseExpression() // iterable
        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()

        // Optional else clause
        if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "else") {
            this.advance() // consume 'else'
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }
    }

    parseWhileStatement() {
        this.advance() // consume 'while'
        this.parseExpression() // condition
        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()

        // Optional else clause
        if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "else") {
            this.advance() // consume 'else'
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }
    }

    parseTryStatement() {
        this.advance() // consume 'try'
        this.expectPython(PythonTokenType.Separator, ":")
        this.parseBlock()

        // Must have at least one except or finally
        let hasExcept = false
        while (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "except") {
            this.advance() // consume 'except'
            hasExcept = true

            // Optional exception type
            if (this.peek()?.type === PythonTokenType.Identifier) {
                this.parseExpression() // exception type
                if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "as") {
                    this.advance() // consume 'as'
                    this.expectPython(PythonTokenType.Identifier) // exception variable
                }
            }
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }

        if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "finally") {
            this.advance() // consume 'finally'
            this.expectPython(PythonTokenType.Separator, ":")
            this.parseBlock()
        }

        if (!hasExcept && this.tokens[this.pos - 2]?.value !== "finally") {
            this.errors.push("Try statement must have except or finally clause")
        }
    }

    parseImportStatement() {
        this.advance() // consume 'import'
        do {
            this.expectPython(PythonTokenType.Identifier) // module name
            while (this.matchPython(PythonTokenType.Separator, ".")) {
                this.expectPython(PythonTokenType.Identifier) // submodule
            }
            if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "as") {
                this.advance() // consume 'as'
                this.expectPython(PythonTokenType.Identifier) // alias
            }
        } while (this.matchPython(PythonTokenType.Separator, ","))
    }

    parseFromImportStatement() {
        this.advance() // consume 'from'
        this.expectPython(PythonTokenType.Identifier) // module name
        while (this.matchPython(PythonTokenType.Separator, ".")) {
            this.expectPython(PythonTokenType.Identifier) // submodule
        }
        this.expectPython(PythonTokenType.Keyword, "import")

        if (this.matchPython(PythonTokenType.Operator, "*")) {
            return // from module import *
        }

        do {
            this.expectPython(PythonTokenType.Identifier) // imported name
            if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "as") {
                this.advance() // consume 'as'
                this.expectPython(PythonTokenType.Identifier) // alias
            }
        } while (this.matchPython(PythonTokenType.Separator, ","))
    }

    parseReturnStatement() {
        this.advance() // consume 'return'

        // Optional return value
        const nextToken = this.peek()
        if (
            nextToken &&
            nextToken.type !== PythonTokenType.Keyword &&
            !(nextToken.type === PythonTokenType.Separator && nextToken.value === ":")
        ) {
            this.parseExpression()
        }
    }

    parseBlock() {
        // Simplified block parsing - just parse statements until we hit a dedent or new block keyword
        while (this.pos < this.tokens.length) {
            const token = this.peek()
            if (!token) break

            // If we see a keyword that starts a new block-level statement, assume current block is done
            if (
                token.type === PythonTokenType.Keyword &&
                ["def", "class", "if", "elif", "else", "for", "while", "try", "except", "finally"].includes(token.value)
            ) {
                break
            }

            this.parseStatement()
        }
    }

    parseExpressionStatement() {
        this.parseExpression()
    }

    parseExpression() {
        this.parseOrExpression()
    }

    parseOrExpression() {
        this.parseAndExpression()
        while (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "or") {
            this.advance()
            this.parseAndExpression()
        }
    }

    parseAndExpression() {
        this.parseNotExpression()
        while (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "and") {
            this.advance()
            this.parseNotExpression()
        }
    }

    parseNotExpression() {
        if (this.peek()?.type === PythonTokenType.Keyword && this.peek()?.value === "not") {
            this.advance()
            this.parseNotExpression()
        } else {
            this.parseComparison()
        }
    }

    parseComparison() {
        this.parseArithmeticExpression()
        while (true) {
            const token = this.peek()
            if (!token) break

            if (
                (token.type === PythonTokenType.Operator && ["<", ">", "<=", ">=", "==", "!="].includes(token.value)) ||
                (token.type === PythonTokenType.Keyword && ["in", "is"].includes(token.value))
            ) {
                this.advance()
                this.parseArithmeticExpression()
            } else {
                break
            }
        }
    }

    parseArithmeticExpression() {
        this.parseTerm()
        while (this.peek()?.type === PythonTokenType.Operator && ["+", "-"].includes(this.peek()?.value || "")) {
            this.advance()
            this.parseTerm()
        }
    }

    parseTerm() {
        this.parseFactor()
        while (this.peek()?.type === PythonTokenType.Operator && ["*", "/", "//", "%"].includes(this.peek()?.value || "")) {
            this.advance()
            this.parseFactor()
        }
    }

    parseFactor() {
        if (this.peek()?.type === PythonTokenType.Operator && ["+", "-", "~"].includes(this.peek()?.value || "")) {
            this.advance()
            this.parseFactor()
        } else {
            this.parsePower()
        }
    }

    parsePower() {
        this.parseAtom()
        if (this.peek()?.type === PythonTokenType.Operator && this.peek()?.value === "**") {
            this.advance()
            this.parseFactor()
        }
    }

    parseAtom() {
        const token = this.peek()
        if (!token) {
            this.errors.push("Unexpected end of input")
            return
        }

        // Literals
        if (
            token.type === PythonTokenType.Number ||
            token.type === PythonTokenType.String ||
            (token.type === PythonTokenType.Keyword && ["True", "False", "None"].includes(token.value))
        ) {
            this.advance()
            return
        }

        // Identifiers (variables, function calls)
        if (token.type === PythonTokenType.Identifier) {
            this.advance()

            // Handle postfix operations
            while (true) {
                const nextToken = this.peek()
                if (!nextToken) break

                if (nextToken.type === PythonTokenType.Separator && nextToken.value === "(") {
                    // Function call
                    this.advance() // consume '('
                    if (!this.matchPython(PythonTokenType.Separator, ")")) {
                        do {
                            this.parseExpression()
                        } while (this.matchPython(PythonTokenType.Separator, ","))
                        this.expectPython(PythonTokenType.Separator, ")")
                    }
                } else if (nextToken.type === PythonTokenType.Separator && nextToken.value === "[") {
                    // Index access
                    this.advance() // consume '['
                    this.parseExpression()
                    this.expectPython(PythonTokenType.Separator, "]")
                } else if (nextToken.type === PythonTokenType.Separator && nextToken.value === ".") {
                    // Attribute access
                    this.advance() // consume '.'
                    this.expectPython(PythonTokenType.Identifier)
                } else {
                    break
                }
            }
            return
        }

        // Parenthesized expressions
        if (token.type === PythonTokenType.Separator && token.value === "(") {
            this.advance()
            this.parseExpression()
            this.expectPython(PythonTokenType.Separator, ")")
            return
        }

        // List literals
        if (token.type === PythonTokenType.Separator && token.value === "[") {
            this.advance()
            if (!this.matchPython(PythonTokenType.Separator, "]")) {
                do {
                    this.parseExpression()
                } while (this.matchPython(PythonTokenType.Separator, ","))
                this.expectPython(PythonTokenType.Separator, "]")
            }
            return
        }

        // Dict literals
        if (token.type === PythonTokenType.Separator && token.value === "{") {
            this.advance()
            if (!this.matchPython(PythonTokenType.Separator, "}")) {
                do {
                    this.parseExpression() // key
                    this.expectPython(PythonTokenType.Separator, ":")
                    this.parseExpression() // value
                } while (this.matchPython(PythonTokenType.Separator, ","))
                this.expectPython(PythonTokenType.Separator, "}")
            }
            return
        }

        // If we get here, it's an unexpected token
        this.errors.push(`Unexpected token: ${token.value} at line ${token.line}`)
        this.advance()
    }

    recoverToNextStatement() {
        // Skip tokens until we find what looks like the start of a new statement
        while (this.pos < this.tokens.length) {
            const token = this.peek()
            if (!token) break

            if (
                token.type === PythonTokenType.Keyword &&
                ["def", "class", "if", "for", "while", "try", "import", "from", "return", "pass", "break", "continue"].includes(
                    token.value,
                )
            ) {
                break
            }

            if (token.type === PythonTokenType.Identifier) {
                break
            }

            this.advance()
        }
    }
}
