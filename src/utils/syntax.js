// syntax.js
import { TokenType } from "./lexical.js";

export function parse(tokens) {
  if (!tokens || tokens.length === 0) {
    return { success: true, errors: [] };
  }

  const parser = new Parser(tokens);
  try {
    parser.parse();
    return {
      success: parser.errors.length === 0,
      errors: parser.errors,
    };
  } catch (error) {
    if (!parser.errors.length) {
      parser.errors.push(`Unexpected error: ${error}`);
    }
    return {
      success: false,
      errors: parser.errors,
    };
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.errors = [];
  }

  advance() {
    if (this.pos < this.tokens.length) {
      this.pos++;
    }
  }

  peek() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }
    return null;
  }

  match(type, value = "") {
    if (this.pos >= this.tokens.length) return false;
    const token = this.tokens[this.pos];
    if (token.type === type && (value === "" || token.value === value)) {
      this.advance();
      return true;
    }
    return false;
  }

  expect(type, value = "") {
    if (this.pos >= this.tokens.length) {
      const error = `Syntax Error at EOF: Expected ${type}${value ? ` '${value}'` : ""}`;
      this.errors.push(error);
      throw new Error(error);
    }
    const token = this.tokens[this.pos];
    if (token.type !== type || (value !== "" && token.value !== value)) {
      const error = `Syntax Error at line ${token.line}, column ${token.col}: Expected ${type}${value ? ` '${value}'` : ""}, got '${token.value}'`;
      this.errors.push(error);
      throw new Error(error);
    }
    this.advance();
  }

  parse() {
    if (this.tokens.length === 0) return;
    try {
      while (this.pos < this.tokens.length) {
        const token = this.peek();
        if (!token) break;
        if (token.type === TokenType.Identifier && token.value.startsWith("#")) {
          while (
            this.pos < this.tokens.length &&
            !(this.tokens[this.pos].type === TokenType.Separator && this.tokens[this.pos].value === "\n")
          ) {
            this.advance();
          }
          if (this.pos < this.tokens.length) this.advance();
          continue;
        }
        try {
          this.parseFunction();
        } catch (error) {
          this.errors.push(`${error}`);
          this.recoverToNextFunction();
        }
      }
    } catch (error) {
      this.errors.push(`${error}`);
    }
  }

  recoverToNextFunction() {
    let braceCount = 0;
    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (!token) break;
      if (token.type === TokenType.Separator && token.value === "{") {
        braceCount++;
        this.advance();
        continue;
      } else if (token.type === TokenType.Separator && token.value === "}") {
        braceCount--;
        this.advance();
        if (braceCount <= 0) break;
        continue;
      }
      if (
        braceCount <= 0 &&
        token.type === TokenType.Keyword &&
        ["int", "void", "float", "double", "char", "bool"].includes(token.value)
      ) {
        if (
          this.pos + 2 < this.tokens.length &&
          this.tokens[this.pos + 1].type === TokenType.Identifier &&
          this.tokens[this.pos + 2].type === TokenType.Separator &&
          this.tokens[this.pos + 2].value === "("
        ) {
          break;
        }
      }
      this.advance();
    }
  }

  parseFunction() {
    if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing function");
    const token = this.peek();
    if (
      token.type !== TokenType.Keyword ||
      !["int", "void", "float", "double", "char", "bool", "long"].includes(token.value)
    ) {
      throw new Error(
        `Expected return type keyword at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`
      );
    }
    this.advance();
    if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing function name");
    if (this.peek().type !== TokenType.Identifier) {
      const token = this.peek();
      throw new Error(
        `Expected function name at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`
      );
    }
    this.advance();
    if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing function parameters");
    if (!this.match(TokenType.Separator, "(")) {
      const token = this.peek();
      throw new Error(`Expected '(' at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`);
    }
    if (!this.match(TokenType.Separator, ")")) {
      do {
        if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing parameter type");
        if (this.peek().type !== TokenType.Keyword) {
          const token = this.peek();
          throw new Error(
            `Expected parameter type at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`
          );
        }
        this.advance();
        if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing parameter name");
        if (this.peek().type !== TokenType.Identifier) {
          const token = this.peek();
          throw new Error(
            `Expected parameter name at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`
          );
        }
        this.advance();
      } while (this.match(TokenType.Separator, ","));
      if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing function parameters");
      if (!this.match(TokenType.Separator, ")")) {
        const token = this.peek();
        throw new Error(`Expected ')' at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`);
      }
    }
    if (this.pos >= this.tokens.length) throw new Error("Unexpected end of input while parsing function body");
    if (!this.match(TokenType.Separator, "{")) {
      const token = this.peek();
      throw new Error(`Expected '{' at line ${token.line}, column ${token.col}, got ${token.type} '${token.value}'`);
    }
    while (this.pos < this.tokens.length && !this.match(TokenType.Separator, "}")) {
      this.parseStatement();
    }
  }

  parseStatement() {
    const token = this.peek();
    if (!token) throw new Error("Syntax Error: Unexpected end of input");
    try {
      if (
        token.type === TokenType.Keyword &&
        ["int", "float", "char", "double", "bool", "void", "long"].includes(token.value)
      ) {
        this.expect(TokenType.Keyword);
        this.expect(TokenType.Identifier);
        if (this.match(TokenType.Operator, "=")) {
          this.parseExpression();
        }
        this.expect(TokenType.Separator, ";");
      } else if (this.match(TokenType.Keyword, "if")) {
        this.expect(TokenType.Separator, "(");
        this.parseExpression();
        this.expect(TokenType.Separator, ")");
        if (this.match(TokenType.Separator, "{")) {
          while (!this.match(TokenType.Separator, "}")) {
            if (this.pos >= this.tokens.length) throw new Error("Syntax Error: Unclosed if statement block");
            this.parseStatement();
          }
        } else {
          this.parseStatement();
        }
        if (this.match(TokenType.Keyword, "else")) {
          if (this.match(TokenType.Separator, "{")) {
            while (!this.match(TokenType.Separator, "}")) {
              if (this.pos >= this.tokens.length) throw new Error("Syntax Error: Unclosed else statement block");
              this.parseStatement();
            }
          } else {
            this.parseStatement();
          }
        }
      } else if (this.match(TokenType.Keyword, "for")) {
        this.expect(TokenType.Separator, "(");
        
        // Initialization part: can be declaration (int i=0) or assignment (i=0) or empty (;)
        if (!this.match(TokenType.Separator, ";")) {
          if (this.peek()?.type === TokenType.Keyword) {
            // Handle declaration: int i = 0;
            this.expect(TokenType.Keyword);
            this.expect(TokenType.Identifier);
            if (this.match(TokenType.Operator, "=")) {
              this.parseExpression();
            }
          } else {
            // Handle assignment: i = 0;
            this.parseAssignmentExpression();
          }
          this.expect(TokenType.Separator, ";");
        }
        
        // Condition part: can be expression (i<10) or empty (;)
        if (!this.match(TokenType.Separator, ";")) {
          this.parseExpression();
          this.expect(TokenType.Separator, ";");
        }
        
        // Increment part: can be expression (i++) or assignment (i=i+1) or empty ()
        if (!this.match(TokenType.Separator, ")")) {
          // Handle both i++ and i=i+1 cases
          this.parseExpression();
          this.expect(TokenType.Separator, ")");
        }
        
        // Loop body
        if (this.match(TokenType.Separator, "{")) {
          while (!this.match(TokenType.Separator, "}")) {
            if (this.pos >= this.tokens.length) throw new Error("Syntax Error: Unclosed for loop block");
            this.parseStatement();
          }
        } else {
          this.parseStatement();
        }
      } else if (this.match(TokenType.Keyword, "while")) {
        this.expect(TokenType.Separator, "(");
        this.parseExpression();
        this.expect(TokenType.Separator, ")");
        if (this.match(TokenType.Separator, "{")) {
          while (!this.match(TokenType.Separator, "}")) {
            if (this.pos >= this.tokens.length) throw new Error("Syntax Error: Unclosed while loop block");
            this.parseStatement();
          }
        } else {
          this.parseStatement();
        }
      } else if (this.match(TokenType.Keyword, "return")) {
        if (!this.match(TokenType.Separator, ";")) {
          this.parseExpression();
          this.expect(TokenType.Separator, ";");
        }
      } else if (this.match(TokenType.Separator, ";")) {
        // Empty statement
      } else if (this.match(TokenType.Separator, "{")) {
        while (!this.match(TokenType.Separator, "}")) {
          if (this.pos >= this.tokens.length) throw new Error("Syntax Error: Unclosed block");
          this.parseStatement();
        }
      } else if (token.type === TokenType.Identifier) {
        this.expect(TokenType.Identifier);
        
        // Function call: identifier()
        if (this.match(TokenType.Separator, "(")) {
          if (!this.match(TokenType.Separator, ")")) {
            do {
              this.parseExpression();
            } while (this.match(TokenType.Separator, ","));
            this.expect(TokenType.Separator, ")");
          }
          this.expect(TokenType.Separator, ";");
        } 
        // Assignment: identifier = expression
        else if (
          this.match(TokenType.Operator, "=") ||
          this.match(TokenType.Operator, "+=") ||
          this.match(TokenType.Operator, "-=") ||
          this.match(TokenType.Operator, "*=") ||
          this.match(TokenType.Operator, "/=") ||
          this.match(TokenType.Operator, "%=") ||
          this.match(TokenType.Operator, "&=") ||
          this.match(TokenType.Operator, "|=") ||
          this.match(TokenType.Operator, "^=")
        ) {
          this.parseExpression();
          this.expect(TokenType.Separator, ";");
        } 
        // Unary operations: i++, i--
        else if (
          this.match(TokenType.Operator, "++") ||
          this.match(TokenType.Operator, "--")
        ) {
          this.expect(TokenType.Separator, ";");
        } else {
          throw new Error(
            `Syntax Error at line ${token.line}, column ${token.col}: Unexpected identifier or missing operator`
          );
        }
      } else {
        this.parseExpression();
        this.expect(TokenType.Separator, ";");
      }
    } catch (error) {
      this.errors.push(`${error}`);
      while (this.pos < this.tokens.length) {
        const current = this.peek();
        if (!current) break;
        if (current.type === TokenType.Separator && current.value === ";") {
          this.advance();
          break;
        }
        if (current.type === TokenType.Separator && current.value === "}") {
          break;
        }
        this.advance();
      }
    }
  }

  parseExpression() {
    try {
      if (this.peek()?.type === TokenType.Separator && [";", ")", "}"].includes(this.peek()?.value || "")) {
        return;
      }
      this.parseAssignmentExpression();
    } catch (error) {
      this.errors.push(`${error}`);
      while (this.pos < this.tokens.length) {
        const current = this.peek();
        if (!current) break;
        if (current.type === TokenType.Separator && [";", ")", "}"].includes(current.value)) {
          break;
        }
        this.advance();
      }
    }
  }

  parseAssignmentExpression() {
    const startPos = this.pos;
    if (this.peek()?.type === TokenType.Identifier) {
      this.expect(TokenType.Identifier);
      if (
        this.match(TokenType.Operator, "=") ||
        this.match(TokenType.Operator, "+=") ||
        this.match(TokenType.Operator, "-=") ||
        this.match(TokenType.Operator, "*=") ||
        this.match(TokenType.Operator, "/=") ||
        this.match(TokenType.Operator, "%=") ||
        this.match(TokenType.Operator, "&=") ||
        this.match(TokenType.Operator, "|=") ||
        this.match(TokenType.Operator, "^=")
      ) {
        this.parseExpression();
      } else {
        // If no assignment operator follows, reset position and parse as logical OR
        this.pos = startPos;
        this.parseLogicalOr();
      }
    } else {
      this.parseLogicalOr();
    }
  }

  parseLogicalOr() {
    this.parseLogicalAnd();
    while (this.match(TokenType.Operator, "||")) {
      this.parseLogicalAnd();
    }
  }

  parseLogicalAnd() {
    this.parseEquality();
    while (this.match(TokenType.Operator, "&&")) {
      this.parseEquality();
    }
  }

  parseEquality() {
    this.parseRelational();
    while (this.match(TokenType.Operator, "==") || this.match(TokenType.Operator, "!=")) {
      this.parseRelational();
    }
  }

  parseRelational() {
    this.parseAdditive();
    while (
      this.match(TokenType.Operator, "<") ||
      this.match(TokenType.Operator, ">") ||
      this.match(TokenType.Operator, "<=") ||
      this.match(TokenType.Operator, ">=")
    ) {
      this.parseAdditive();
    }
  }

  parseAdditive() {
    this.parseMultiplicative();
    while (this.match(TokenType.Operator, "+") || this.match(TokenType.Operator, "-")) {
      this.parseMultiplicative();
    }
  }

  parseMultiplicative() {
    this.parseUnary();
    while (
      this.match(TokenType.Operator, "*") ||
      this.match(TokenType.Operator, "/") ||
      this.match(TokenType.Operator, "%")
    ) {
      this.parseUnary();
    }
  }

  parseUnary() {
    // Handle prefix unary operators
    if (
      this.match(TokenType.Operator, "!") ||
      this.match(TokenType.Operator, "-") ||
      this.match(TokenType.Operator, "+") ||
      this.match(TokenType.Operator, "++") ||
      this.match(TokenType.Operator, "--")
    ) {
      this.parseUnary();
    } else {
      this.parsePostfix();
    }
  }

  parsePostfix() {
    this.parsePrimary();
    
    // Handle postfix operations
    while (true) {
      // Postfix increment/decrement
      if (this.match(TokenType.Operator, "++") || this.match(TokenType.Operator, "--")) {
        continue;
      } 
      // Array access
      else if (this.match(TokenType.Separator, "[")) {
        this.parseExpression();
        this.expect(TokenType.Separator, "]");
      } 
      // Function call
      else if (this.match(TokenType.Separator, "(")) {
        if (!this.match(TokenType.Separator, ")")) {
          do {
            this.parseExpression();
          } while (this.match(TokenType.Separator, ","));
          this.expect(TokenType.Separator, ")");
        }
      } 
      // Member access
      else if (this.match(TokenType.Separator, ".") || this.match(TokenType.Operator, "->")) {
        this.expect(TokenType.Identifier);
      } else {
        break;
      }
    }
  }

  parseFunctionCall() {
    this.expect(TokenType.Separator, "(");
    if (!this.match(TokenType.Separator, ")")) {
      do {
        this.parseExpression();
      } while (this.match(TokenType.Separator, ","));
      this.expect(TokenType.Separator, ")");
    }
  }

  parsePrimary() {
    try {
      if (this.match(TokenType.Number) || this.match(TokenType.String)) {
        return;
      } else if (this.match(TokenType.Identifier)) {
        if (this.peek()?.type === TokenType.Separator && this.peek()?.value === "(") {
          this.parseFunctionCall();
        }
        return;
      } else if (this.match(TokenType.Separator, "(")) {
        this.parseExpression();
        this.expect(TokenType.Separator, ")");
      } else {
        const token = this.peek();
        throw new Error(
          `Syntax Error at line ${token?.line || 0}, column ${token?.col || 0}: Expected number, identifier, string, or '('`
        );
      }
    } catch (error) {
      this.errors.push(`${error}`);
      let parenCount = 1;
      while (this.pos < this.tokens.length) {
        const current = this.peek();
        if (!current) break;
        if (current.type === TokenType.Separator) {
          if (current.value === "(") {
            parenCount++;
          } else if (current.value === ")") {
            parenCount--;
            if (parenCount === 0) {
              this.advance();
              break;
            }
          } else if (current.value === ";" && parenCount === 0) {
            break;
          }
        }
        this.advance();
      }
    }
  }
}

// Test code for verification
function testParser() {
  import('./lexical.js').then(module => {
    const { tokenize } = module;
    
    // Test for loop
    const forLoopCode = `
    int main() {
      for(int i = 0; i < 10; i++) {
        printf("Hello");
      }
      return 0;
    }
    `;
    
    // Test increment/decrement operators
    const incrementCode = `
    int main() {
      int x = 5;
      x++;
      ++x;
      return x;
    }
    `;
    
    const tokens1 = tokenize(forLoopCode);
    const parseResult1 = parse(tokens1);
    console.log("For loop test:", parseResult1.success ? "Passed" : "Failed");
    if (!parseResult1.success) {
      console.log("Errors:", parseResult1.errors);
    }
    
    const tokens2 = tokenize(incrementCode);
    const parseResult2 = parse(tokens2);
    console.log("Increment test:", parseResult2.success ? "Passed" : "Failed");
    if (!parseResult2.success) {
      console.log("Errors:", parseResult2.errors);
    }
  });
}

// testParser();