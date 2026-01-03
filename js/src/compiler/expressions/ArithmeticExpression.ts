import { ELingTokenType } from "../ELingTokenType";
import LingLexicalAnalyzer from "../LingLexicalAnalyzer";
import { LingParser } from "../LingParser";
import LingToken from "../LingToken";

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

export class ArithmeticExpression {
    public parse(parser: LingParser) {
        //final boss
    }
}

const lA: LingLexicalAnalyzer = new LingLexicalAnalyzer(`
package funcs {
    isAbs(a, b) {
        a > 0 and b > 0
    }
    regexp(a) {
        a in /[0-9]/uiwg
    }
}

package vars {
    ex = ${'"hello ${"Artem" + "!"}" + 1'}
}
`);
lA.tokenize();
ELingTokenType.printTokens(lA);

const parser = new LingParser(lA)
const exp = new ArithmeticExpression().parse(parser);
console.log(exp);
