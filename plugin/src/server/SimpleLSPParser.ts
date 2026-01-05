import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import LingToken from "./LingToken";
import SimpleLSPLexicalAnalyzer from "./SimpleLSPLexicalAnalyzer";
import { ELingTokenType } from './ELingTokenType';
import LingExpression from './expressions/LingExpression';

interface LingFunction {
    name: string;
    params: string[];
    package?: string;
    line: number;
    documentation?: string;
}

export type LingPackage = Record<string, string | Record<string, string>>;

export default class SimpleLSPParser {
    public static packages: LingPackage = {};
    public static expressions: [typeof LingExpression.find, new (...args: any[]) => LingExpression][] = []
    
    public langs: string[] = [];
    public packs: Record<string, LingPackage> = {};
    public diagnostics: Diagnostic[] = [];
    public lexicalAnalyzer: SimpleLSPLexicalAnalyzer;
    public currentToken!: LingToken;
    public tokenIndex: number;

    public constructor(public document: TextDocument) {
        this.lexicalAnalyzer = new SimpleLSPLexicalAnalyzer(document);
        this.lexicalAnalyzer.parse();
        this.diagnostics = [...this.lexicalAnalyzer.diagnostics];
    }

    public parse(): void {
        for(this.tokenIndex = 0; this.tokenIndex < this.lexicalAnalyzer.tokens.length; this.tokenIndex++) {
            this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex];
            let matched = false;

            for(const [is, expression] of SimpleLSPParser.expressions) {
                if(is(this)) {
                    new expression().parse(this);
                    matched = true;
                    break;
                }
            }

            console.warn(this.currentToken.keyword + " : " + ELingTokenType[this.currentToken.type].toLowerCase());

            if(matched == false) {
                this.throwError(`Unexpected ${this.currentToken.keyword ?? "unkown"}`);
            }
            
            if(this.match(ELingTokenType.QUESTION, 1)) {
                this.throwWarn("Nullable translations not recommended");
            }
        }
    }

    public slice<T extends (index: number, token: LingToken) => unknown>(relativeFrom: number, relativeTo: number, addFormat?: T): ReturnType<T>[] {
        const list = [];
        if(this.peek(relativeFrom) == null || this.peek(relativeTo) == null) {
            this.throwError("Token cannot be null by slice operation");
        }
        for(let i = relativeFrom; i < relativeTo; i++) {
            const token = this.peek(i);
            const value = addFormat ? addFormat(i, token) : token;
            if(value == null) {
                continue;
            }
            list.push(value);
        }
        return list;
    }

    public createPackages(path: string[], packageName: string): void {
        const pack = this.getPackage(path);  
        pack[packageName] ??= {}
    }

    public getPackage(path: string[]): LingPackage {
        let object = SimpleLSPParser.packages;
        for(const packageName of path) {
            object = (object[packageName] ??= {}) as LingPackage;
        }
        return object;
    }

    public next(index: number = 1): LingToken {
        this.tokenIndex += index;
        return this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex] || null;
    }

    public peek(index: number = 1): LingToken | null {
        return this.lexicalAnalyzer.tokens[this.tokenIndex + index] || null;
    }

    public match(type: ELingTokenType, index: number = 0): boolean {
        const token = this.peek(index);
        return token != null && token.type == type;
    }

    public expect(type: ELingTokenType, error?: string, position: number = 1): LingToken {
        const token = this.next(position);
        if(token.type != type) {
            this.throwError(error || "Expected another type");
        }
        return token;
    }

    public throw(message: string, severity: DiagnosticSeverity, posStart?: number, posEnd?: number): null {
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

    public throwError(message: string, posStart?: number, posEnd?: number): null {
        return this.throw(message, DiagnosticSeverity.Error, posStart, posEnd);
    }

    public throwWarn(message: string, posStart?: number, posEnd?: number): null {
        return this.throw(message, DiagnosticSeverity.Warning, posStart, posEnd);
    }
}