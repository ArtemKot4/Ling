import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import LingToken from "../LingToken";
import { StatementHelper } from "../StatementHelper";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingFunctionExpression } from "./LingFunction";

@ExpressionStatement
export class LingPackageExpression extends LingExpression {
    public override type?: string = "package";
    public path: string[] = [];

    public override parse(parser: LingParser): void {
        const tokenID = parser.expect(ELingTokenType.IDENTIFIER, "Expected packet name");
        parser.next();
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{", but got "${parser.peek(0).keyword}"`);
        }
        const includedPath = tokenID.keyword.split(".");
        if(includedPath.length >= 2) {
            const name = includedPath.pop();
            this.path = this.path.concat(includedPath);
            parser.createPackages(this.path, name);
        } else {
            parser.createPackages(this.path, tokenID.keyword);
        }
        parser.next();
        const currentPackage = this.getPackage(parser, includedPath[includedPath.length - 1]);
        
        while(true) {
            if(parser.currentToken == null) {
                parser.throwError(`Unclosed statement of package "${tokenID.keyword}"`);
            }
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                this.path.pop();
                parser.next();
                break;
            }
            if(StatementHelper.isFunction(parser)) {
                currentPackage.functions ??= {};
                const lingFunctionPath = currentPackage.functions[parser.currentToken.keyword] ??= {}
                const lingFunction = new LingFunctionExpression().parse(parser);
    
                if(lingFunction.lang != null) {
                    lingFunctionPath[lingFunction.lang] = lingFunction;
                } else {
                    lingFunctionPath.main = lingFunction;
                }
                continue;
            }
            if(parser.match(ELingTokenType.PACKAGE)) {
                this.appendPath(tokenID);
                this.parse(parser);
                continue;
            }
            parser.next();
        }
    }

    public getPackage(parser: LingParser, name: string): Record<string, any> {
        return parser.getPackage([...this.path, name]);
    }

    public appendPath(token: LingToken): void {
        this.path.push(token.keyword);
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}