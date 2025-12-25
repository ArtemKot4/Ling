import { ELingTokenType } from "./ELingTokenType";
import { IDefineSettings } from "./expressions/LingDefineExpression";
import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import LingToken from "./LingToken";
import LingExpression from "./expressions/LingExpression";

export type LingPacket = Record<string, string | Record<string, string>>;

export interface IBinaryOperationNode {
    left: ExpressionValue;
    right: ExpressionValue;
    operation: ELingTokenType; // PLUS, MINUS, ASTERISK, SLASH
}

export type ExpressionValue = 
    | { type: "string"; value: string }
    | { type: "number"; value: number }
    | { type: "argument"; name: string }
    | { type: "package"; name: string }
    | IBinaryOperationNode; 

export class LingParser {
    public static expressions: [typeof LingExpression.find, new (...args: any[]) => LingExpression][] = []
    public static packets: LingPacket = {};
    public tokenIndex: number;
    public currentToken: LingToken;
    public openedField: boolean;
    public settings: IDefineSettings;

    public constructor(public lexicalAnalyzer: LingLexicalAnalyzer, public langs: string[] = []) {
        this.openedField = false;
        this.settings = {
            langs: langs,
            encoding: "utf-8",
            unexpected: null
        };
    }

    public throwError(text: string) {
        throw `LingParser: ${text} on line ${this.currentToken.line} and position ${this.currentToken.column}`;
    }

    public createPackages(path: string[], packageName: string): void {
        const pack = this.getPackage(path);  
        pack[packageName] ??= {}
    }

    public getPackage(path: string[]): LingPacket {
        let object = LingParser.packets;
        for(const packageName of path) {
            object = (object[packageName] ??= {}) as LingPacket;
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

    public match(type: ELingTokenType, index: number = 0) {
        const token = this.peek(index);
        return token != null && token.type == type;
    }

    public isConstantBeginning(): boolean {
        return this.match(ELingTokenType.IDENTIFIER) && this.match(ELingTokenType.EQUAL, 1);
    }

    public expect(type: ELingTokenType, error?: string, position: number = 1): LingToken {
        const token = this.next(position);
        if(token.type != type) {
            this.throwError(error || "Expected another type");
        }
        return token;
    }

    public parse(): void {
        for(this.tokenIndex = 0; this.tokenIndex < this.lexicalAnalyzer.tokens.length; this.tokenIndex++) {
            this.currentToken = this.lexicalAnalyzer.tokens[this.tokenIndex];

            for(const [is, expression] of LingParser.expressions) {
                if(is(this)) {
                    new expression().parse(this);
                }
            }
        }
    }
}