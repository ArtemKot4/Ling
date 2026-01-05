import { ELingTokenType } from "./ELingTokenType";
import { IDefineSettings } from "./expressions/LingDefineExpression";
import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingToken } from "./LingToken";
import LingExpression from "./expressions/LingExpression";
import { LingFunction } from "./expressions/LingFunction";
import { ArithmeticExpression } from "./expressions/ArithmeticExpression";

export class LingParser {
    public static expressions: [typeof LingExpression.find, new (...args: any[]) => LingExpression][] = []
    
    public tokenIndex: number;
    public currentToken: LingToken;
    public openedField: boolean;
    public settings: IDefineSettings;

    public constructor(public lexicalAnalyzer: LingLexicalAnalyzer, public langs: string[] = []) {
        this.openedField = false;
        this.settings = {
            encoding: "utf-8",
            langs: [],
            unexpected: {}
        }
    }

    public throwError(text: string): void {
        throw `Ling SyntaxError: ${text} on line ${this.currentToken.line} and position ${this.currentToken.column}${this.lexicalAnalyzer.fileName ? " at file: " + this.lexicalAnalyzer.fileName.split(".").slice(-2).join(".") : ""}`;
    }

    public warn(text: string): void {
        console.log("Ling syntax warn: " + text);
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

    public parse(): void {
        this.tokenIndex = 0;
        
        while (this.tokenIndex < this.lexicalAnalyzer.tokens.length) {
            this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex];
            
            let parsed = false;
            
            for(const [is, expression] of LingParser.expressions) {
                if(is(this)) {
                    new expression().parse(this);
                    parsed = true;
                    break;
                }
            }
            
            if (!parsed) {
                // Если ни одно выражение не совпало, пропускаем токен
                this.tokenIndex++;
            }
            // Если выражение совпало, НЕ инкрементируем tokenIndex!
            // expression.parse() сам продвинет парсер
        }
    }
}