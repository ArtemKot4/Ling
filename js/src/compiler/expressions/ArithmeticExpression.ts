import { ELingTokenType } from "../ELingTokenType";
import { ExpressionValue, IBinaryOperationNode, LingParser } from "../LingParser";
import { IArgumentDescription } from "./LingFunctionExpression";
import LingExpression from "./LingExpression";
import LingLexicalAnalyzer from "../LingLexicalAnalyzer";

export class ArithmeticExpression extends LingExpression {
    public stopPredicate!: (parser: LingParser) => boolean;

    public override parse(parser: LingParser,  stopPredicate?: (parser: LingParser) => boolean, args: Record<string, IArgumentDescription> = {}): ExpressionValue {
        this.stopPredicate = stopPredicate;
        return this.parseExpression(parser, args);
    }
    
    private parseExpression(parser: LingParser, args: Record<string, IArgumentDescription>): ExpressionValue {
        if(this.stopPredicate(parser)) {
            parser.throwError("Unexpected empty body of arithmetic expression");
        }
        return this.parseAddSub(parser, args);
    }

    public parseAddSub(parser: LingParser, args: Record<string, IArgumentDescription>): ExpressionValue {
        
        return null
    }
}

let a = `aboba  + 2 * 5 + 2 lol`;
const la = new LingLexicalAnalyzer(a);
la.tokenize();
// const lp = new LingParser(la);
// console.log("?")
ELingTokenType.printTokens(la);