import { ELingTokenType } from "../ELingTokenType";
import { LingManager } from "../../package_manager/LingManager";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ExpressionParser, ExpressionValue } from "./ExpressionParser";
import ExpressionStatement from "./ExpressionStatement";
import { LingDefineExpression } from "./LingDefineExpression";
import LingExpression from "./LingExpression";
import { LingFunctionExpression } from "./LingFunctionExpression";
import { ILingPackage } from "../../types";
import { LingTranslationExpression } from "./LingTranslationExpression";

@ExpressionStatement
export class LingPackageExpression extends LingExpression {
    public mainExpression: LingPackageExpression;
    public functions: LingFunctionExpression[] = [];
    public translations: LingTranslationExpression[] = [];
    public langs: string[];
    public packageExpressions: LingPackageExpression[] = [];
    public name!: string;

    public override parse(parser: LingParser): void {
        this.mainExpression ??= this;
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER) && !parser.match(ELingTokenType.STRING)) {
            parser.throwError({ message: `Expected package name` });
            return;
        }
        this.name ??= parser.currentToken.keyword;
        parser.expect(ELingTokenType.OPEN_CBRACKET, `Expected "{", but got "${parser.peek(0).keyword}"`)

        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError({ message: `Package "${this.name}" is empty` });
        }
        parser.next();
        this.langs ??= this.mainExpression.langs || LingManager.getLangsFor("common");
        this.parseBlockStatement(parser);
        this.mainExpression.packageExpressions.push(this);
    }

    public override apply(parser: LingParser): void {
        for(const expression of this.packageExpressions) {
            LingManager.createPackage(expression.name);
            LingManager.applyLangs(parser, expression.name, expression.langs);
            LingPackageExpression.applyFunctions(parser, expression);
            LingPackageExpression.applyTranslations(parser, expression);
        }
    }

    public parseBlockStatement(parser: LingParser): void {
        while(true) {
            if(parser.currentToken == null) {
                parser.throwError({ message: `Unclosed statement of package "${this.name}"` });
            }
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                parser.next();
                return;
            }
            if(parser.match(ELingTokenType.DEFINE)) {
                const defineExpression = new LingDefineExpression();
                defineExpression.parse(parser, this.name);
                this.langs = defineExpression.langs;
                continue;
            }
            if(parser.match(ELingTokenType.PACKAGE)) {
                const nestedPackage = new LingPackageExpression();
                nestedPackage.name = `${this.name}.${parser.peek(1).keyword}`;
                nestedPackage.mainExpression = this.mainExpression;
                nestedPackage.langs = this.langs;
                nestedPackage.parse(parser);
                continue;
            }
            if(StatementHelper.isTranslation(parser)) {
                const translationExpression = new LingTranslationExpression();
                translationExpression.langs = this.langs;
                translationExpression.parse(parser, this.name);
                
                this.translations.push(translationExpression);
                continue;
            }
            if(StatementHelper.isFunction(parser)) {
                const currentFunction = new LingFunctionExpression();
                currentFunction.parse(parser, this.name);
                this.functions.push(currentFunction);
                continue;
            }
            parser.next();
        }
    }

    public getPackage(): ILingPackage {
        return LingManager.getPackage(this.name);
    }

    public getFunction(name: string, lang: string) {
        return this.functions?.[name]?.[lang];
    }

    public static applyFunctions(parser: LingParser, expression: LingPackageExpression): void {
        for(const lingFunction of expression.functions) {
            lingFunction.apply(parser);
        }
    }

    public static applyTranslations(parser: LingParser, expression: LingPackageExpression): void {
        for(const lingTranslation of expression.translations) {
            lingTranslation.apply(parser);
        }
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}