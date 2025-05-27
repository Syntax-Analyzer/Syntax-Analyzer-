<<<<<<< HEAD
# Syntax Analyzer for a Subset of C
This project implements a syntax analyzer (parser) for a subset of the C programming language. It follows the classical compiler front-end design with three main components:
## 1. Tokenizer (Lexical Analyzer)
- Converts raw C code into a stream of tokens (e.g., keywords, identifiers, operators, symbols).
- Handles removal of whitespace and comments.
- Can be built manually or using tools like Lex/Flex.
## 2. Grammar Definition
- Defines a Context-Free Grammar (CFG) for a chosen subset of C.
- Covers syntax rules for expressions, control structures, function declarations, etc.
##  3. Syntax Analyzer (Parser)
- Parses the token stream based on the grammar.
- Verifies syntax correctness and builds a parse tree or abstract syntax tree (AST).
- Implemented using techniques like recursive descent parsing or parser generators (e.g., YACC/Bison).
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 34f326e (first commit)
