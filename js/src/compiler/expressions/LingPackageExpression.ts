import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import LingToken from "../LingToken";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingFunctionExpression } from "./LingFunction";

@ExpressionStatement
export class LingPackageExpression extends LingExpression {
    public path: string[] = [];
    public currentPackage: ReturnType<typeof this.getPackage>;
    public name: string;

    public override parse(parser: LingParser): void {
        this.name = parser.expect(ELingTokenType.IDENTIFIER, "Expected packet name").keyword;
        parser.next();
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{", but got "${parser.peek(0).keyword}"`);
        }
        this.createPackages(parser, this.name.split("."), this.name);
        this.parseBlockStatement(parser);
    }

    public parseBlockStatement(parser: LingParser): void {
        while(true) {
            if(parser.currentToken == null) {
                parser.throwError(`Unclosed statement of package "${this.name}"`);
            }
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                this.path.pop();
                parser.next();
                break;
            }
            if(StatementHelper.isFunction(parser)) {
                this.addFunction(parser);
                continue;
            }
            if(parser.match(ELingTokenType.PACKAGE)) {
                this.addPackage(parser);
                continue;
            }
            parser.next();
        }
    }

    public appendPath(name: string): void {
        this.path.push(name);
    }

    public addFunction(parser: LingParser): void {
        this.currentPackage.functions ??= {};
        const lingFunctionPath = this.currentPackage.functions[parser.currentToken.keyword] ??= {}
        const lingFunction = new LingFunctionExpression().parse(parser);

        if(lingFunction.lang != null) {
            lingFunctionPath[lingFunction.lang] = lingFunction;
        } else {
            lingFunctionPath.main = lingFunction;
        }
    }

    public addPackage(parser: LingParser): void {
        this.appendPath(this.name);
        this.parse(parser);
    }

    public createPackages(parser: LingParser, path: string[], id: string): void {
        if(path.length >= 2) {
            const name = path.pop();
            this.path = this.path.concat(path);
            parser.createPackages(this.path, name);
            this.currentPackage = this.getPackage(parser, name);
        } else {
            parser.createPackages(this.path, id);
            this.currentPackage = this.getPackage(parser, id);
        }
        parser.next();
    }

    public getPackage(parser: LingParser, name: string): Record<string, any> {
        return parser.getPackage([...this.path, name]);
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}