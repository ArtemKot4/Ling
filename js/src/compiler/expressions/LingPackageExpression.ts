import { ELingTokenType } from "../ELingTokenType";
import { ILingPackage, LingManager } from "../LingLocalization";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingFunction } from "./LingFunction";

@ExpressionStatement
export class LingPackageExpression extends LingExpression {
    public currentPackage: ReturnType<typeof this.getPackage>;
    public name: string;

    public override parse(parser: LingParser): void {
        parser.next();
        if(!parser.match(ELingTokenType.IDENTIFIER) && !parser.match(ELingTokenType.STRING)) {
            parser.throwError(`Expected package name`);
        }
        this.name ??= parser.currentToken.keyword;
        parser.expect(ELingTokenType.OPEN_CBRACKET, `Expected "{", but got "${parser.peek(0).keyword}"`)

        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError(`Package "${this.name}" is empty`);
        }
        this.createPackages(parser);
        this.parseBlockStatement(parser);
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
                nestedPackage.parse(parser);
                continue;
            }
            if(StatementHelper.isFunction(parser)) {
                this.addFunction(parser);
                continue;
            }
            parser.next();
        }
    }

    public addFunction(parser: LingParser): void {
        const functionName = parser.peek(0).keyword;
        const packageFunctions = this.currentPackage.functions ??= {};
        const currentFunction = new LingFunction().parse(parser);
        const functionObject = packageFunctions[functionName] ??= {};

        functionObject[currentFunction.lang ?? "default"] = currentFunction;
    }

    public createPackages(parser: LingParser): void {
        this.currentPackage = LingManager.createPackage(this.name)
        parser.next();
    }

    public getPackage(): ILingPackage {
        return LingManager.getPackage(this.name);
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}