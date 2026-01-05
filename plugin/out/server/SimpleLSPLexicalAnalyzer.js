"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LingToken_1 = __importDefault(require("./LingToken"));
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const ELingTokenType_1 = require("./ELingTokenType");
class SimpleLSPLexicalAnalyzer {
    constructor(document) {
        this.document = document;
        this.line = 0;
        this.position = 0;
        this.column = 0;
        this.tokens = [];
        this.diagnostics = [];
        this.text = document.getText();
        this.currentChar = this.text[0] || null;
    }
    parse() {
        let stop;
        do {
            stop = this.next();
        } while (stop !== null);
    }
    isWhitespace(char) {
        return char == null || char == " " || char == "\n" || char == "\t" || char == "\r";
    }
    skipWhitespace() {
        while (this.isWhitespace(this.currentChar)) {
            this.advance();
        }
    }
    parseDocumentation() {
        let documentation = "";
        while (this.currentChar != null) {
            if (this.currentChar == "*" && this.peek() == "/") {
                this.advance(2);
                break;
            }
            documentation += this.currentChar;
            this.advance();
        }
        return documentation.trim();
    }
    tokenizeRegexp() {
        this.advance();
        let regexp = "";
        while (true) {
            if (this.currentChar == null) {
                this.throwError("Unclosed regular expression");
                return;
            }
            if (this.currentChar == "/") {
                this.advance();
                regexp += "|";
                while (this.currentChar != null && !this.isWhitespace(this.currentChar)) {
                    if (!SimpleLSPLexicalAnalyzer.FLAGS_REGEXP.test(this.currentChar)) {
                        this.throwError(`Expected valid regular expression flag, not "${this.currentChar}"`);
                        return;
                    }
                    regexp += this.currentChar;
                    this.advance();
                }
                break;
            }
            regexp += this.currentChar;
            this.advance();
        }
        this.addToken(ELingTokenType_1.ELingTokenType.REGEXP, regexp);
    }
    tokenizeString() {
        this.advance();
        let string = "";
        while (true) {
            if (this.currentChar == null) {
                this.throwError(`Unclosed string`);
                return;
            }
            if (this.currentChar == `"`) {
                this.advance();
                break;
            }
            string += this.currentChar;
            this.advance();
        }
        this.addToken(ELingTokenType_1.ELingTokenType.STRING, string);
    }
    tokenizeNumber() {
        let numberLiteral = "";
        let hasDot = false;
        while (this.currentChar && (this.isDigit(this.currentChar) || this.currentChar == "." || this.currentChar == "_")) {
            if (this.currentChar == ".") {
                if (hasDot == true) {
                    this.throwError("Expected one dot in number literal");
                    return;
                }
                hasDot = true;
            }
            if (this.currentChar != "_") {
                numberLiteral += this.currentChar;
            }
            this.advance();
        }
        this.addToken(ELingTokenType_1.ELingTokenType.NUMBER, numberLiteral);
    }
    isValidNumber() {
        return this.isDigit(this.currentChar) || ((this.currentChar == "." || this.currentChar == "_") && this.isDigit(this.peek()));
    }
    next() {
        if (this.currentChar == null) {
            return null;
        }
        this.skipWhitespace();
        if (this.currentChar == "/") {
            if (this.peek() == "/") {
                this.skipLine();
                console.log("line_com");
                return this.next();
            }
            if (this.peek() == "*") {
                if (this.peek(2) == "*") {
                    this.advance(3); // /**
                    const documentation = this.parseDocumentation();
                    if (documentation.length > 0) {
                        this.addToken(ELingTokenType_1.ELingTokenType.DOCUMENTATION, documentation);
                    }
                    console.log("doc");
                    return;
                }
                else {
                    this.skipLongComment();
                    console.log("long_com");
                    return this.next();
                }
            }
            console.log("regexp");
            return this.tokenizeRegexp();
        }
        if (this.isValidNumber()) {
            return this.tokenizeNumber();
        }
        if (ELingTokenType_1.ELingTokenType.isOperator(this.currentChar)) {
            this.addToken(ELingTokenType_1.ELingTokenType.getOperatorToken(this.currentChar), this.currentChar);
            this.advance();
            console.log("op");
            return;
        }
        if (this.currentChar == `"`) {
            return this.tokenizeString();
        }
        const keyword = this.buildKeyword().trim();
        if (keyword == null) {
            return null;
        }
        if (ELingTokenType_1.ELingTokenType.isKeyword(keyword)) {
            this.addToken(ELingTokenType_1.ELingTokenType.getKeywordToken(keyword), this.keyword);
            console.log("keyword");
            return;
        }
        if (!this.isValidWord(keyword)) {
            return null;
        }
        this.addToken(ELingTokenType_1.ELingTokenType.IDENTIFIER, keyword);
        console.log("id");
    }
    addToken(type, value = "") {
        const token = new LingToken_1.default(this.line, this.position - value.length, type, value);
        this.tokens.push(token);
        return token;
    }
    buildKeyword() {
        if (this.currentChar == null) {
            return null;
        }
        let keyword = "";
        while (!this.isWhitespace(this.currentChar) && !ELingTokenType_1.ELingTokenType.isOperator(this.currentChar)) {
            keyword += this.currentChar;
            this.advance();
        }
        if (keyword.length > 0) {
            this.keyword = keyword;
            return keyword;
        }
        return null;
    }
    isValidWord(word) {
        if (this.isDigit(word[0])) {
            this.throwError("Unexpected number");
            return false;
        }
        if (word.startsWith(".")) {
            this.throwError("Expected name of packet");
            return false;
        }
        if (!/^[a-zA-Z0-9_.]*$/.test(word)) {
            this.throwError(`Unexpected ${word}`);
            return false;
        }
        if (word.endsWith(".")) {
            this.throwError(`Unexpected last point at "${word}"`);
            return false;
        }
        return true;
    }
    isDigit(char) {
        return char >= "0" && char <= "9";
    }
    skipLine() {
        while (this.currentChar != null && this.currentChar != "\n") {
            this.advance();
        }
        this.advance();
    }
    skipLongComment() {
        while (this.currentChar != null && !(this.currentChar == "*" && this.peek() == "/")) {
            this.advance();
        }
        this.advance(2); // */
    }
    peek(index = 1) {
        const pos = this.position + index;
        return pos < this.text.length ? this.text[pos] : null;
    }
    advance(index = 1) {
        if (this.currentChar == '\n') {
            this.line++;
            this.column = 0;
        }
        else {
            this.column += index;
        }
        this.position += index;
        this.currentChar = this.position < this.text.length ? this.text[this.position] : null;
    }
    throw(message, severity, posStart, posEnd) {
        const start = this.document.positionAt((posStart ?? this.position) - this.keyword.length);
        const end = this.document.positionAt(posEnd ?? (this.position + this.keyword.length));
        this.diagnostics.push({
            range: { start, end },
            message: message,
            severity: severity,
            source: "ling"
        });
        return null;
    }
    throwError(message, posStart, posEnd) {
        return this.throw(message, vscode_languageserver_types_1.DiagnosticSeverity.Error, posStart, posEnd);
    }
    throwWarn(message, posStart, posEnd) {
        return this.throw(message, vscode_languageserver_types_1.DiagnosticSeverity.Warning, posStart, posEnd);
    }
}
SimpleLSPLexicalAnalyzer.FLAGS_REGEXP = /i|g|m|s|u|y|d/;
exports.default = SimpleLSPLexicalAnalyzer;
//# sourceMappingURL=SimpleLSPLexicalAnalyzer.js.map