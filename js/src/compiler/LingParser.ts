import { ELingTokenType } from "./ELingTokenType";
import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingToken } from "./LingToken";
import LingExpression from "./expressions/LingExpression";
import { LingFunctionExpression } from "./expressions/LingFunctionExpression";
import { ExpressionParser } from "./expressions/ExpressionParser";
import { LingError } from "./LingError";

export class LingParser {
    public static expressions: [typeof LingExpression.find, new (...args: any[]) => LingExpression][] = []
    
    public tokenIndex: number;
    public currentToken: LingToken;
    public openedField: boolean;

    public constructor(public lexicalAnalyzer: LingLexicalAnalyzer, public langs: string[] = []) {
        this.openedField = false;
    }

    public throwError(description: {
        message: string,
        reason?: string, 
        line?: number,
        column?: number,
        keyword?: string,
        type?: ELingTokenType,
        packageName?: string,
        fileName?: string
    }): void {
        const token = this.currentToken || this.peek(1) || this.peek(-1);

        description.column ??= token.column;
        description.line ??= token.line;
        description.keyword ??= token.keyword;
        description.type ??= token.type;
        description.fileName = this.lexicalAnalyzer.fileName;
        new LingError("Ling SyntaxError", this.lexicalAnalyzer).throw(description);
    }

    public throwWarning(text: string): void {
        console.log(`Ling SyntaxWarning: ${text} on line ${this.currentToken.line} and position ${this.currentToken.column}${this.lexicalAnalyzer.fileName ? " at file: " + this.lexicalAnalyzer.fileName.split(".").slice(-2).join(".") : ""}`);
    }

    public next(index: number = 1): LingToken {
        this.tokenIndex += index;
        return this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex] || null;
    }

    public peek(index: number = 1): LingToken | null {
        return this.get(this.tokenIndex + index) || null;
    }

    public get(index: number): LingToken | null {
        return this.lexicalAnalyzer.tokens[index] || null
    }

    public match(type: ELingTokenType, index: number = 0): boolean {
        const token = this.peek(index);
        return token != null && token.type == type;
    }

    public expect(type: ELingTokenType, error?: string, index: number = 1): LingToken {
        const token = this.next(index);
        if(token.type != type) {
            this.throwError({ message: error || "Expected another type" });
        }
        return token;
    }

    public slice<T extends (index: number, token: LingToken) => unknown>(relativeFrom: number, relativeTo: number, addFormat?: T): ReturnType<T>[] {
        const list = [];
        if(this.peek(relativeFrom) == null || this.peek(relativeTo) == null) {
            this.throwError({ message: "Token cannot be null by slice operation" });
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