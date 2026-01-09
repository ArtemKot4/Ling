import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { ELingTokenType } from "../ELingTokenType";
import LingLexicalAnalyzer from "../LingLexicalAnalyzer";
import { LingParser } from "../LingParser";
import { LingToken } from "../LingToken";
import { IProcessingExpression } from "./IProcessingExpression";

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

export class ExpressionParser {
    private pos = 0;
    
    public constructor(private tokens: LingToken[]) {}

    private current(): LingToken | null {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }
    
    private consume(type?: ELingTokenType): LingToken {
        const token = this.current();
        if(!token) {
            throw new Error("Unexpected end of expression");
        }
        if(type && token.type != type) {
            throw new Error(`Expected ${type}, got ${token.type}`);
        }
        this.pos++;
        return token;
    }
    
    public parse(): ExpressionValue {
        let left = this.parseTerm();
        
        while(true) {
            const op = this.current();
            if(op?.type === ELingTokenType.PLUS || op?.type === ELingTokenType.MINUS) {
                this.consume();
                const right = this.parseTerm();
                left = {
                    type: "binary",
                    left,  
                    right,
                    operation: op.type
                } as IBinaryOperationNode; 
            } else {
                break;
            }
        }
        
        return left;
    }
    
    private parseTerm(): ExpressionValue {
        let left = this.parseFactor();
        
        while(true) {
            const op = this.current();
            if(op?.type == ELingTokenType.ASTERISK || op?.type == ELingTokenType.SLASH) {
                this.consume();
                const right = this.parseFactor();
                left = {
                    type: "binary",
                    left,
                    right,
                    operation: op.type
                } as IBinaryOperationNode;
            } else {
                break;
            }
        }
        return left;
    }
    
    private parseFactor(): ExpressionValue {
        const token = this.current();
        if(!token) {
            throw new Error("Unexpected end of expression");
        }
        
        switch(token.type) {
            case ELingTokenType.NUMBER: {
                this.consume();
                return { type: "number", value: Number(token.keyword) };
            }

            case ELingTokenType.STRING: {
                this.consume();
                return { type: "string", value: token.keyword };
            }

            case ELingTokenType.IDENTIFIER: {
                this.consume();
                return { type: "argument", name: token.keyword };
            }

            case ELingTokenType.OPEN_RBRACKET: {
                this.consume(ELingTokenType.OPEN_RBRACKET);
                const expr = this.parse();
                this.consume(ELingTokenType.CLOSE_RBRACKET);
                return expr;
            }

            default: {
                throw new Error(`Unexpected token in factor: ${token.type}`);
            }
        }
    }
}

// console.log(new ArithmeticExpression([
// new LingToken(1, 1, ELingTokenType.NUMBER, "2"),
// new LingToken(1, 1, ELingTokenType.PLUS),
// new LingToken(1, 1, ELingTokenType.NUMBER, "3"),
// new LingToken(1, 1, ELingTokenType.ASTERISK),
// new LingToken(1, 1, ELingTokenType.NUMBER, "4")
// ]).parse())

const lA: LingLexicalAnalyzer = new LingLexicalAnalyzer(`
package funcs {
    isAbs(a, b) {
        a > 0 and b > 0
    }
    regexp(a) {
        a in /[0-9]/uig
    }
}

package vars {
    ex = ${'"hello ${"Artem" + "!"}" + 1'}
}
`);
// lA.tokenize();
// ELingTokenType.printTokens(lA);

// const parser = new LingParser(lA)
// const exp = new ArithmeticExpression().parse(parser);
// console.log(exp);
