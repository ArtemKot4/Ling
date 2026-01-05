import { ELingTokenType } from "../ELingTokenType";
import LingToken from "../LingToken";
import SimpleLSPParser from "../SimpleLSPParser";
import { StatementHelper } from "../StatementHelper";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | boolean
}

export interface ILingFunctionNode {
    lang?: string;
    args: Record<string, IArgumentDescription>;
    returnType: "string" | "boolean";
}

export class LingFunctionExpression {
    public lang!: string;
    public args: Record<string, IArgumentDescription> = {};
    public returnType: string | boolean; 
    public tokenID: LingToken;

    public parseArguments(parser: SimpleLSPParser): void {
        while(true) {
            if(parser.currentToken == null || parser.match(ELingTokenType.OPEN_CBRACKET)) {
                parser.throwError("Unclosed function argument statement", this.tokenID.position, this.tokenID.position + this.tokenID.keyword.length);
                return;
            }
            if(parser.match(ELingTokenType.CLOSE_RBRACKET)) {
                break;
            }
            if(parser.match(ELingTokenType.IDENTIFIER)) {
                let value = null;
                let skip = 1;
                if(parser.match(ELingTokenType.EQUAL, 1)) {
                    value = parser.peek(2).keyword;
                    if(value == null) {
                        parser.throwError("Expected value for function argument");
                    }
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

    public parse(parser: SimpleLSPParser): this {
        const name = parser.currentToken.keyword;
        this.tokenID = {...parser.currentToken};

        if(parser.match(ELingTokenType.COLON, 1)) {
            parser.next(2);

            if(!parser.match(ELingTokenType.IDENTIFIER)) {
                parser.throwError("Expected lang for function");
                return;
            }
            StatementHelper.Lang.satisfiesLanguageFormat(parser);
            const firstLangToken = parser.peek(0);
            const secondLangToken = parser.peek(2);
            const lang = firstLangToken.keyword + "-" + secondLangToken.keyword;
            if(parser.langs.includes(lang) == false) {
                parser.throwError(`Cannot register function "${name}" for not defined lang "${lang}"`, firstLangToken.position, firstLangToken.position + lang.length)
            }
            this.lang = lang;
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
            this.returnType = "string";
        }

        //this.returnType.push(new ArithmeticExpression().parse(parser));

        //this.returnType = new ArithmeticExpression().parse(parser, (p) => p.match(ELingTokenType.CLOSE_CBRACKET), this.args);
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected "}"`);
        }
        parser.next();
        return this;
    }
}