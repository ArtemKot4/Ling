import { ELingTokenType } from "../ELingTokenType";
import { ILingPackage, LingManager } from "../LingLocalization";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ArithmeticExpression } from "./ArithmeticExpression";
import ExpressionStatement from "./ExpressionStatement";
import { LingDefineExpression } from "./LingDefineExpression";
import LingExpression from "./LingExpression";
import { LingFunction } from "./LingFunction";

@ExpressionStatement
export class LingPackageExpression extends LingExpression {
    public mainExpression: LingPackageExpression;
    public functions: Record<string, { [lang: string]: LingFunction }> = {};
    public translations: {
        [lang: string]: {
            [translationName: string]: string | ArithmeticExpression
        }
    }
    public langs: string[];
    public packageExpressions: LingPackageExpression[] = [];
    public name!: string;

    public override parse(parser: LingParser): void {
        this.mainExpression ??= this;
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER) && !parser.match(ELingTokenType.STRING)) {
            parser.throwError(`Expected package name`);
        }
        this.name ??= parser.currentToken.keyword;
        parser.expect(ELingTokenType.OPEN_CBRACKET, `Expected "{", but got "${parser.peek(0).keyword}"`)

        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError(`Package "${this.name}" is empty`);
        }
        parser.next();
        this.langs = this.mainExpression.langs || LingManager.getLangsFor("common");
        this.parseBlockStatement(parser);
        this.mainExpression.packageExpressions.push(this);
    }

    public override apply(parser: LingParser): void {
        for(const expression of this.packageExpressions) {
            LingManager.createPackage(expression.name);
            LingManager.applyLangs(parser, expression.name, expression.langs);
            this.applyFunctions(expression.getPackage(), expression, parser);
        }
    }

    public applyFunctions(lingPackage: ILingPackage, expression: LingPackageExpression, parser: LingParser): void {
        for(const expressionFunctionName in expression.functions) {
            const expressionFunction = expression.functions[expressionFunctionName];

            for(const lang in expressionFunction) {
                expressionFunction[lang].apply(parser, expression.name);
            }
        }
    }

    public parseBlockStatement(parser: LingParser): void {
        while(true) {
            if(parser.currentToken == null) {
                parser.throwError(`Unclosed statement of package "${this.name}"`);
            }
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                parser.next();
                return;
            }
            if(parser.match(ELingTokenType.PACKAGE)) {
                const nestedPackage = new LingPackageExpression();
                nestedPackage.name = `${this.name}.${parser.peek(1).keyword}`;
                nestedPackage.mainExpression = this.mainExpression;
                nestedPackage.parse(parser);
                continue;
            }
            if(parser.match(ELingTokenType.DEFINE)) {
                const define = new LingDefineExpression();
                define.parse(parser, this.name);
                this.langs = define.langs;
                continue;
            }
            if(StatementHelper.isFunction(parser)) {
                this.parseFunction(parser);
                continue;
            }
            parser.next();
        }
    }

    public parseTranslations(): void {

    }

    public parseFunction(parser: LingParser): void {
        const currentFunctionName = parser.peek(0).keyword;
        const currentFunction = new LingFunction();
        currentFunction.parse(parser, this.name);
        const lingFunctionObject = this.functions[currentFunctionName] ??= {};

        lingFunctionObject[currentFunction.lang ?? "default"] = currentFunction;
    }

    public getPackage(): ILingPackage {
        return LingManager.getPackage(this.name);
    }

    public getFunction(name: string, lang: string) {
        return this.functions?.[name]?.[lang];
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}