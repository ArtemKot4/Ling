import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { ILingFunctionNode, LingFunction } from "./LingFunction";

export interface IDefineSettings {
    langs: string[],
    encoding: string,
    unexpected: Record<string, ILingFunctionNode>
}

@ExpressionStatement
export class LingDefineExpression extends LingExpression {
    public static settingList: string[] = ["langs", "encoding", "unexpected"];

    public parseLangs(parser: LingParser): string[] {
        const langs = [];

        while(StatementHelper.Lang.isValidLanguageFormat(parser)) {
            const lang = parser.peek(0).keyword + "-" + parser.peek(2).keyword;
            if(parser.settings.langs.includes(lang)) {
                parser.throwError(`Unexpected repeating of lang "${lang}"`);
            }
            langs.push(lang);
            parser.next(3);
            if(parser.match(ELingTokenType.COMMA)) {
                parser.next();
                continue;
            }
        }
        return langs;
    }

    public parseWithKey(parser: LingParser): void {
        const id = parser.currentToken.keyword;

        if(parser.match(ELingTokenType.EQUAL, 1)) {
            parser.next(2);
            if(id == "langs") {
                this.applyLangs(parser, this.parseLangs(parser));
                return;
            } 
            if(id == "encoding") {
                this.applyEncoding(parser, parser.expect(ELingTokenType.STRING, "Encoding expected string", 0).keyword);
                return;
            } 
            parser.throwError(`Unexpected key "${id}"`)
        } else {
            if(id != "unexpected") {
                parser.throwError(`Expected unexpected function`)
            }
            if(!StatementHelper.isFunction(parser)) {
                parser.throwError(`Expected function`);
            }
            this.applyUnexpected(parser, new LingFunction().parse(parser));
        }
    }

    public parseWithStatement(parser: LingParser): void {
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER)) {
            parser.throwError(`Unexpected "${parser.currentToken}"`);
        }

        while(true) {
            if(!LingDefineExpression.settingList.includes(parser.currentToken.keyword)) {
                break;
            }
            if(parser.currentToken.keyword == "langs") {
                parser.next(2)
                this.applyLangs(parser, this.parseLangs(parser));
            }
            if(parser.currentToken.keyword == "encoding") {
                parser.next(2);
                if(!parser.match(ELingTokenType.STRING)) {
                    parser.throwError("Excepted string literal for encoding definition");
                }
                this.applyEncoding(parser, parser.currentToken.keyword);
                parser.next();
            }
            if(StatementHelper.isFunction(parser)) {
                if(parser.currentToken.keyword != "unexpected") {
                    parser.throwError(`Unexpected method expected, but got "${parser.currentToken.keyword}"`);
                } else {
                    this.applyUnexpected(parser, new LingFunction().parse(parser));
                }
            }
        }
        
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected closing bracket, but got "${parser.currentToken.keyword}"`);
        }
    }

    public applyLangs(parser: LingParser, langs: string[]) {
        parser.settings.langs = parser.settings.langs.concat(langs);
    }

    public applyEncoding(parser: LingParser, encoding: string): void {
        parser.settings.encoding = encoding;
    }

    public applyUnexpected(parser: LingParser, unexpected: ILingFunctionNode): void {
        parser.settings.unexpected[unexpected.lang || "default"] = unexpected;
    }

    public override parse(parser: LingParser): void {
        parser.next();

        if(parser.match(ELingTokenType.IDENTIFIER)) {
            this.parseWithKey(parser);
        } else if(parser.match(ELingTokenType.OPEN_CBRACKET)) {
            this.parseWithStatement(parser);
        } else parser.throwError("Unexpected format for definitions");
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.DEFINE);
    }
}