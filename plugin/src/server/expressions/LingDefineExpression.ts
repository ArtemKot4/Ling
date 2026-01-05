import { ELingTokenType } from "../ELingTokenType";import SimpleLSPParser from "../SimpleLSPParser";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { ILingFunctionNode, LingFunctionExpression } from "./LingFunction";

@ExpressionStatement
export default class LingDefineExpression extends LingExpression {
    public override parse(parser: SimpleLSPParser): void {
        parser.next();

        if(parser.match(ELingTokenType.IDENTIFIER)) {
            console.log("def identifier")
            this.parseWithKey(parser);
        } else if(parser.match(ELingTokenType.OPEN_CBRACKET)) {
            console.log("def statement");
            this.parseWithStatement(parser);
        } else parser.throwError("Unexpected format for definitions");
    }

    public static settingList: string[] = ["langs", "encoding", "unexpected"];

    public parseLangs(parser: SimpleLSPParser): void {
        while(StatementHelper.Lang.isValidLanguageFormat(parser)) {
            console.log("lang loop")
            const errorStart = parser.currentToken.position;
            const lang = parser.peek(0).keyword + "-" + parser.peek(2).keyword;
            parser.next(3);

            if(parser.langs.includes(lang)) {
                parser.throwError(`Unexpected repeating of lang "${lang}"`, errorStart, errorStart + lang.length);
            } else parser.langs.push(lang);

            if(parser.match(ELingTokenType.COMMA)) {
                parser.next();
                continue;
            }
        }
    }

    public parseWithKey(parser: SimpleLSPParser): void {
        const id = parser.currentToken.keyword;

        if(parser.match(ELingTokenType.EQUAL, 1)) {
            parser.next(2);
            if(id == "langs") {
                this.parseLangs(parser);
                return;
            } 
            if(id == "encoding") {
                return;
            } 
            return parser.throwError(`Unexpected key "${id}" of definition. Did you mean "langs" or "encoding"?`);
        } else {
            if(id != "unexpected") {
                parser.throwError(`Expected unexpected function`)
            }
            if(!StatementHelper.isFunction(parser)) {
                parser.throwError(`Expected function`);
                return;
            }
            new LingFunctionExpression().parse(parser);
        }
    }

    public parseWithStatement(parser: SimpleLSPParser): void {
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER)) {
            parser.throwError(`Unexpected "${parser.currentToken}"`);
        }

        while(true) {
            if(!LingDefineExpression.settingList.includes(parser.currentToken.keyword)) {
                break;
            }
            if(parser.currentToken.keyword == "langs") {
                parser.next(2); //langs = 
                this.parseLangs(parser);
            }
            if(parser.currentToken.keyword == "encoding") {
                parser.next(2); //encoding =
                if(!parser.match(ELingTokenType.STRING)) {
                    parser.throwError("Excepted string literal for encoding definition");
                }
                parser.next();
            }
            if(StatementHelper.isFunction(parser)) {
                if(parser.currentToken.keyword != "unexpected") {
                    parser.throwError(`Unexpected method expected, but got "${parser.currentToken.keyword}"`);
                } else {
                    new LingFunctionExpression().parse(parser);
                }
            }
        }
        
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected closing bracket, but got "${parser.currentToken.keyword}"`);
        }
    }

    public static find(parser: SimpleLSPParser): boolean {
        return parser.match(ELingTokenType.DEFINE);
    }
}