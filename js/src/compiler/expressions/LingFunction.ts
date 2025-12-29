import { ELingTokenType } from "../ELingTokenType";
import { LingParser, IBinaryOperationNode } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ArithmeticExpression } from "./ArithmeticExpression";
import LingExpression from "./LingExpression";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface ILingFunctionNode {
    lang?: string;
    args: Record<string, IArgumentDescription>;
    returnType: IBinaryOperationNode[];
}

export class LingFunctionExpression {
    public lang!: string;
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

    public parse(parser: LingParser): this {
        if(parser.match(ELingTokenType.COLON, 1)) {
            parser.next(2);
            StatementHelper.Lang.satisfiesLanguageFormat(parser);
            this.lang = parser.slice(0, 3, (i, token) => token.keyword).join("-");
            parser.next(4);
        } else {
            parser.next(2);
        }
        this.parseArguments(parser);

        if(!parser.match(ELingTokenType.CLOSE_RBRACKET)) {
            parser.throwError(`Expected ")"`);
        } 
        parser.next();
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{"`);
        }
        while(parser.currentToken != null) {
            const token = parser.next();
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                break;
            }
            //console.log(ELingTokenType.getPrintTypeName(token.type));
            this.returnType.push(token); //waiting arithmetic expression
        }
        //this.returnType = new ArithmeticExpression().parse(parser, (p) => p.match(ELingTokenType.CLOSE_CBRACKET), this.args);
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected "}"`);
        }
        parser.next();
        return this;
    }
}