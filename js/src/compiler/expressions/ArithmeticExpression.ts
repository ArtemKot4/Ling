import { ELingTokenType } from "../ELingTokenType";
import LingLexicalAnalyzer from "../LingLexicalAnalyzer";
import { LingParser } from "../LingParser";
import LingToken from "../LingToken";

export class ArithmeticExpression {
    public parse(parser: LingParser) {
        //final boss
    }
}

const lA: LingLexicalAnalyzer = new LingLexicalAnalyzer(`
"hello" + 1
`);
lA.tokenize();
ELingTokenType.printTokens(lA);

const parser = new LingParser(lA)
const exp = new ArithmeticExpression().parse(parser);
console.log(exp);
