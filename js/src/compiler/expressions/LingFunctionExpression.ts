import { ELingTokenType } from "../ELingTokenType";
import { LingParser, IBinaryOperationNode } from "../LingParser";
import { ArithmeticExpression } from "./ArithmeticExpression";
import LingExpression from "./LingExpression";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface ILingFunctionNode {
    args: Record<string, IArgumentDescription>
    returnType: IBinaryOperationNode[];
}

//@ExpressionStatement
export class LingFunctionExpression extends LingExpression {
    public override type: string = "function";
    public args: Record<string, IArgumentDescription> = {};
    public returnType = []; 

    public parseArguments(parser: LingParser): void {
        while(parser.currentToken && parser.currentToken.type != ELingTokenType.CLOSE_RBRACKET) {
            if(parser.currentToken.type == ELingTokenType.IDENTIFIER) {
                let value = null;
                let skip = 1;
                if(parser.match(ELingTokenType.IDENTIFIER) && parser.match(ELingTokenType.EQUAL, 1)) {
                    value = parser.peek(2).keyword; //need do parse expressions
                    skip = 3;
                }
                this.args[parser.currentToken.keyword] = { type: parser.currentToken.type, value: value };
                parser.next(skip);
            }
            if(parser.currentToken.type == ELingTokenType.COMMA) {
                parser.next();
            }
        }
    }

    public override parse(parser: LingParser): this {
        parser.next(2);
        this.parseArguments(parser);

        if(!parser.match(ELingTokenType.CLOSE_RBRACKET)) {
            parser.throwError(`Expected ")"`);
        } 
        parser.next();
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{"`);
        }
        while(parser.currentToken && !parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            this.returnType.push(parser.next()); //waiting arithmetic expression
        }
        //this.returnType = new ArithmeticExpression().parse(parser, (p) => p.match(ELingTokenType.CLOSE_CBRACKET), this.args);
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected "}"`);
        }
        parser.next();
        return this;
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.IDENTIFIER) && parser.match(ELingTokenType.OPEN_RBRACKET, 1);
    }
}