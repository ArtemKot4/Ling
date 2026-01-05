"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const SimpleLSPLexicalAnalyzer_1 = __importDefault(require("./SimpleLSPLexicalAnalyzer"));
const ELingTokenType_1 = require("./ELingTokenType");
class SimpleLSPParser {
    constructor(document) {
        this.document = document;
        this.langs = [];
        this.packs = {};
        this.diagnostics = [];
        this.lexicalAnalyzer = new SimpleLSPLexicalAnalyzer_1.default(document);
        this.lexicalAnalyzer.parse();
        this.diagnostics = [...this.lexicalAnalyzer.diagnostics];
    }
    parse() {
        for (this.tokenIndex = 0; this.tokenIndex < this.lexicalAnalyzer.tokens.length; this.tokenIndex++) {
            this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex];
            let matched = false;
            for (const [is, expression] of SimpleLSPParser.expressions) {
                if (is(this)) {
                    new expression().parse(this);
                    matched = true;
                    break;
                }
            }
            console.warn(this.currentToken.keyword + " : " + ELingTokenType_1.ELingTokenType[this.currentToken.type].toLowerCase());
            if (matched == false) {
                this.throwError(`Unexpected ${this.currentToken.keyword ?? "unkown"}`);
            }
            if (this.match(ELingTokenType_1.ELingTokenType.QUESTION, 1)) {
                this.throwWarn("Nullable translations not recommended");
            }
        }
    }
    slice(relativeFrom, relativeTo, addFormat) {
        const list = [];
        if (this.peek(relativeFrom) == null || this.peek(relativeTo) == null) {
            this.throwError("Token cannot be null by slice operation");
        }
        for (let i = relativeFrom; i < relativeTo; i++) {
            const token = this.peek(i);
            const value = addFormat ? addFormat(i, token) : token;
            if (value == null) {
                continue;
            }
            list.push(value);
        }
        return list;
    }
    createPackages(path, packageName) {
        const pack = this.getPackage(path);
        pack[packageName] ?? (pack[packageName] = {});
    }
    getPackage(path) {
        let object = SimpleLSPParser.packages;
        for (const packageName of path) {
            object = (object[packageName] ?? (object[packageName] = {}));
        }
        return object;
    }
    next(index = 1) {
        this.tokenIndex += index;
        return this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex] || null;
    }
    peek(index = 1) {
        return this.lexicalAnalyzer.tokens[this.tokenIndex + index] || null;
    }
    match(type, index = 0) {
        const token = this.peek(index);
        return token != null && token.type == type;
    }
    expect(type, error, position = 1) {
        const token = this.next(position);
        if (token.type != type) {
            this.throwError(error || "Expected another type");
        }
        return token;
    }
    throw(message, severity, posStart, posEnd) {
        const start = this.document.positionAt(posStart ?? this.currentToken.position);
        const end = this.document.positionAt(posEnd ?? (this.currentToken.position + this.currentToken.keyword.length));
        this.diagnostics.push({
            range: { start, end },
            message: message,
            severity: severity,
            source: "ling"
        });
        return null;
    }
    throwError(message, posStart, posEnd) {
        return this.throw(message, node_1.DiagnosticSeverity.Error, posStart, posEnd);
    }
    throwWarn(message, posStart, posEnd) {
        return this.throw(message, node_1.DiagnosticSeverity.Warning, posStart, posEnd);
    }
}
SimpleLSPParser.packages = {};
SimpleLSPParser.expressions = [];
exports.default = SimpleLSPParser;
//# sourceMappingURL=SimpleLSPParser.js.map