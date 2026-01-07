import { ELingTokenType } from "./ELingTokenType";
import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingToken } from "./LingToken";
import LingExpression from "./expressions/LingExpression";
import { LingFunctionExpression } from "./expressions/LingFunctionExpression";
import { ArithmeticExpression } from "./expressions/ArithmeticExpression";

export class LingParser {
    public static expressions: [typeof LingExpression.find, new (...args: any[]) => LingExpression][] = []
    
    public tokenIndex: number;
    public currentToken: LingToken;
    public openedField: boolean;

    public constructor(public lexicalAnalyzer: LingLexicalAnalyzer, public langs: string[] = []) {
        this.openedField = false;
    }

    public throwError(text: string): void {
        throw `Ling SyntaxError: ${text} on line ${this.currentToken.line} and position ${this.currentToken.column}${this.lexicalAnalyzer.fileName ? " at file: " + this.lexicalAnalyzer.fileName.split(".").slice(-2).join(".") : ""}`;
    }

    public throwWarning(text: string): void {
        console.log(`Ling SyntaxWarning: ${text} on line ${this.currentToken.line} and position ${this.currentToken.column}${this.lexicalAnalyzer.fileName ? " at file: " + this.lexicalAnalyzer.fileName.split(".").slice(-2).join(".") : ""}`);
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
        
        while(this.tokenIndex < this.lexicalAnalyzer.tokens.length) {
            this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex];
            let applied = false;
            
            for(const [is, expression] of LingParser.expressions) {
                if(is(this)) {
                    const expressionInstance = new expression();
                    expressionInstance.parse(this);
                    expressionInstance.apply(this);
                    applied = true;
                    break;
                }
            }

            if(applied == false) {
                this.tokenIndex++;
            }
        }
    }
}