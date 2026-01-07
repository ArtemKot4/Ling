import { ELingTokenType } from "../ELingTokenType";
import { LingManager } from "../../package_manager/LingManager";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { ILingFunctionNode, LingFunctionExpression } from "./LingFunctionExpression";
import { LingPackageExpression } from "./LingPackageExpression";

@ExpressionStatement
export class LingDefineExpression extends LingExpression {
    public static settingList: string[] = ["langs", "encoding", "unexpected"];
    public packageName!: string;
    public mainPackage: string;
    public langs: string[] = [];
    public unexpectedFunctions: LingFunctionExpression[] = [];

    public override parse(parser: LingParser, packageName: string = "common"): void {
        parser.next();
        this.packageName = packageName;

        if(parser.match(ELingTokenType.IDENTIFIER)) {
            this.parseWithKey(parser);
        } else if(parser.match(ELingTokenType.OPEN_CBRACKET)) {
            this.parseWithStatement(parser);
        } else parser.throwError("Unexpected format for definitions");
    }

    public apply(parser: LingParser): void {
        LingManager.applyLangs(parser, this.packageName, this.langs);
        this.unexpectedFunctions.forEach(unexpected => unexpected.apply(parser, this.packageName));
    }

    public parseLangs(parser: LingParser): void {
        do {
            if(parser.match(ELingTokenType.COMMA)) {
                parser.next();
            }
            let lang = StatementHelper.Lang.buildLanguage(parser);
            if(lang == null) {
                break;
            }
            if(this.langs.includes(lang)) {
                parser.throwError(`Unexpected repeating of lang "${lang}"`);
            }
            this.langs.push(lang);
        } while (parser.match(ELingTokenType.COMMA));
    }

    public parseWithKey(parser: LingParser): void {
        const id = parser.currentToken.keyword;

        if(parser.match(ELingTokenType.EQUAL, 1)) {
            parser.next(2);
            if(id == "langs") {
                this.parseLangs(parser);
                return;
            } 
            if(id == "encoding") {
                //this.applyEncoding(parser, parser.expect(ELingTokenType.STRING, "Encoding expected string", 0).keyword);
                return;
            } 
            const validKeysEnumeration = LingDefineExpression.settingList.reduce((pV, cV, cI) => pV += cV + ", ", "").slice(0, -3);
            parser.throwError(`Unexpected key "${id}". Are you mean something of ${validKeysEnumeration}?`)
        } else {
            if(id != "unexpected") {
                parser.throwError(`Expected unexpected function`)
            }
            if(!StatementHelper.isFunction(parser)) {
                parser.throwError(`Expected function`);
            }
            this.parseUnexpected(parser);
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
                parser.next(2);
                this.parseLangs(parser);
            }
            if(parser.currentToken.keyword == "encoding") {
                parser.next(2);
                if(!parser.match(ELingTokenType.STRING)) {
                    parser.throwError("Excepted string literal for encoding definition");
                }
                //this.applyEncoding(parser, parser.currentToken.keyword);
                parser.next();
            }
            if(StatementHelper.isFunction(parser)) {
                if(parser.currentToken.keyword != "unexpected") {
                    parser.throwError(`Unexpected method expected, but got "${parser.currentToken.keyword}"`);
                } else {
                    this.parseUnexpected(parser);
                }
            }
        }
        
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected closing bracket, but got "${parser.currentToken.keyword}"`);
        }
    }

    public parseUnexpected(parser: LingParser): void {
        const unexpected = new LingFunctionExpression();
        unexpected.parse(parser, this.packageName);
        this.unexpectedFunctions.push(unexpected);
    }

    // public applyEncoding(parser: LingParser, encoding: string): void {
    //     parser.settings.encoding = encoding;
    // }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.DEFINE);
    }
}