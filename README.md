## Syntax Analyzer for a Subset of C
This project implements a syntax analyzer (parser) for a subset of the C programming language. It follows the classical compiler front-end design with three main components:
# 1. Tokenizer (Lexical Analyzer)
- Converts raw C code into a stream of tokens (e.g., keywords, identifiers, operators, symbols).
- Handles removal of whitespace and comments.
- Can be built manually or using tools like Lex/Flex.
# 2. Grammar Definition
- Defines a Context-Free Grammar (CFG) for a chosen subset of C.
- Covers syntax rules for expressions, control structures, function declarations, etc.
#  3. Syntax Analyzer (Parser)
- Parses the token stream based on the grammar.
- Verifies syntax correctness and builds a parse tree or abstract syntax tree (AST).
- Implemented using techniques like recursive descent parsing or parser generators (e.g., YACC/Bison).
