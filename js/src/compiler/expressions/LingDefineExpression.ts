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

    public static get settingListString(): string {
        return LingDefineExpression.settingList.reduce((pV, cV, cI) => pV += `"${cV}"` + ", ", "").slice(0, -2);
    }

    public override parse(parser: LingParser, packageName: string = "common"): void {
        parser.next();
        this.packageName = packageName;

        if(parser.match(ELingTokenType.IDENTIFIER)) {
            this.parseWithKey(parser);
        } else if(parser.match(ELingTokenType.OPEN_CBRACKET)) {
            this.parseWithStatement(parser);
        } else parser.throwError({ message: "Unexpected format for definitions" });
    }

    public apply(parser: LingParser): void {
        LingManager.applyLangs(parser, this.packageName, this.langs);
        this.unexpectedFunctions.forEach(unexpected => unexpected.apply(parser));
    }

    public parseLangs(parser: LingParser): void {
        let column = parser.currentToken.column;
        const line = parser.currentToken.line;

        do {
            if(parser.match(ELingTokenType.COMMA)) {
                parser.next();
            }
            let lang = StatementHelper.Lang.buildLanguage(parser);
            column += lang.length;
            if(lang == null) {
                break;
            }
            if(this.langs.includes(lang)) {
                parser.throwError({ message: `Unexpected repeating of lang at one definition`, reason: `lang already defined`, line: line, column: column - 1, keyword: lang, packageName: this.packageName });
            }
            this.langs.push(lang);
        } while (parser.match(ELingTokenType.COMMA));
    }

    public parseWithKey(parser: LingParser): void {
        const column = parser.currentToken.column;
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
            parser.throwError({ message: `Unexpected key "${id}". Are you mean something of ${LingDefineExpression.settingListString}?`, reason: "now allowed", column, keyword: id, packageName: this.packageName })
        } else {
            if(StatementHelper.isFunction(parser)) {
                return this.parseUnexpected(parser);
            }
            parser.throwError({ message: `Invalid format for key "${id}" inside definition` });            
        }
    }

    public parseWithStatement(parser: LingParser): void {
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER)) {
            parser.throwError({ message: `Unexpected "${parser.currentToken}"` });
        }

        while(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            if(!LingDefineExpression.settingList.includes(parser.currentToken.keyword)) {
                parser.throwError({ message: `Unexpected key "${parser.currentToken.keyword}". Are you mean something of ${LingDefineExpression.settingListString}?`, reason: "now allowed", column: parser.currentToken.column, keyword: parser.currentToken.keyword, packageName: this.packageName });
            }
            if(parser.currentToken.keyword == "langs") {
                parser.next(2);
                this.parseLangs(parser);
            }
            if(parser.currentToken.keyword == "encoding") {
                parser.next(2);
                if(!parser.match(ELingTokenType.STRING)) {
                    parser.throwError({ message: "Expected string literal for encoding definition" });
                }
                //this.applyEncoding(parser, parser.currentToken.keyword);
                parser.next();
            }
            if(StatementHelper.isFunction(parser)) {
                this.parseUnexpected(parser);
            }
        }
        parser.expect(ELingTokenType.CLOSE_CBRACKET, `Expected closing bracket, but got "${parser.currentToken.keyword}"`, 0);
    }

    public parseUnexpected(parser: LingParser): void {
        const unexpected = new LingFunctionExpression();
        unexpected.parse(parser, this.packageName);
        if(unexpected.name != "unexpected") {
            const token = parser.get(unexpected.nameTokenIndex)
            parser.throwError({ message: `Expected another function name`, reason: `Rename function to it will be "unexpected"`, column: token.column, keyword: token.keyword });
        }
        this.unexpectedFunctions.push(unexpected);
    }

    // public applyEncoding(parser: LingParser, encoding: string): void {
    //     parser.settings.encoding = encoding;
    // }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.DEFINE);
    }
}