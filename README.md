# Lexical and Syntax Analyzer 
This project implements a real-time lexical and syntax analyzer (parser). It follows the classical compiler front-end design with three main components:
## 1. Tokenizer (Lexical Analyzer)
- Converts raw C (also other languages than are included) code into a stream of tokens (e.g., keywords, identifiers, operators, symbols, etc).
- Handles removal of whitespace and comments.
- Can be built manually or using tools like Lex/Flex.
## 2. Grammar Definition
- Defines a Context-Free Grammar (CFG).
- Covers syntax rules for expressions, control structures, function declarations, etc.
##  3. Syntax Analyzer (Parser)
- Parses the token stream based on the grammar.
- Verifies syntax correctness.
- Implemented using techniques like recursive descent parsing or parser generators (e.g., YACC/Bison).
