import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { ILingFunctionNode, LingFunctionExpression } from "./LingFunctionExpression";

export interface IDefineSettings {
    langs: string[],
    encoding: string,
    unexpected: ILingFunctionNode
}

@ExpressionStatement
export class LingDefineExpression extends LingExpression implements IDefineSettings {
    public langs!: string[];
    public encoding!: string;
    public unexpected!: ILingFunctionNode;

    public isValidLanguageFormat(parser: LingParser): boolean {
        return (
            parser.match(ELingTokenType.IDENTIFIER) && 
            parser.match(ELingTokenType.MINUS, 1) && 
            parser.match(ELingTokenType.IDENTIFIER, 2) && 
            parser.peek(2)?.keyword == parser.peek(2)?.keyword.toUpperCase()
        );
    }

    public parseLangs(parser: LingParser): string[] {
        const langs = [];

        while(true) {
            if(!this.isValidLanguageFormat(parser)) {
                break;
            }
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
                this.langs = this.parseLangs(parser);
                return;
            } 
            if(id == "encoding") {
                this.encoding = parser.expect(ELingTokenType.STRING, "Encoding expected string", 0).keyword;
                return;
            } 
            parser.throwError(`Unexpected key "${id}"`)
        } else {
            if(id != "unexpected") {
                parser.throwError(`Expected unexpected function`)
            }
            if(!parser.match(ELingTokenType.OPEN_RBRACKET, 1)) {
                parser.throwError(`Expected "("`);
            }
            this.unexpected = new LingFunctionExpression().parse(parser);
        }
    }

    public parseWithStatement(parser: LingParser): void {
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER)) {
            parser.throwError(`Unexpected "${parser.currentToken}"`);
        }

        if(parser.match(ELingTokenType.EQUAL, 1)) {
            const set = ["langs", "encoding"]
            while(true) {
                if(!set.includes(parser.currentToken.keyword)) {
                    break;
                }
                if(parser.currentToken.keyword == "langs") {
                    parser.next(2)
                    this.langs = this.parseLangs(parser);
                }
                if(parser.currentToken.keyword == "encoding") {
                    parser.next(2);
                    if(!parser.match(ELingTokenType.STRING)) {
                        parser.throwError("Excepted string literal for encoding definition");
                    }
                    this.encoding = parser.currentToken.keyword;
                    parser.next();
                }
            }
        } 
        if(parser.match(ELingTokenType.OPEN_RBRACKET, 1)) {
            if(parser.currentToken.keyword != "unexpected") {
                parser.throwError(`Unexpected method expected, but got "${parser.currentToken.keyword}"`);
            } else {
                this.unexpected = new LingFunctionExpression().parse(parser);
            }
        }

        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected closing bracket, but got "${parser.currentToken.keyword}"`);
        }
    }

    public applySettings(parser: LingParser): void {
        if(this.langs != null) {
            parser.settings.langs = parser.settings.langs.concat(this.langs);
        }
        if(this.encoding != null) {
            parser.settings.encoding = this.encoding;
        }
        if(this.unexpected != null) {
            parser.settings.unexpected = this.unexpected;
        }  
    }

    public override parse(parser: LingParser): void {
        parser.next();

        if(parser.match(ELingTokenType.IDENTIFIER)) {
            this.parseWithKey(parser);
        } else if(parser.match(ELingTokenType.OPEN_CBRACKET)) {
            this.parseWithStatement(parser);
        } else parser.throwError("Unexpected format for definitions");
        
        this.applySettings(parser);   
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.DEFINE);
    }
}