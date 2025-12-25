import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import LingToken from "../LingToken";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";

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
        
        this.matchFunction();
        if(parser.match(ELingTokenType.PACKAGE)) {
            this.appendPath(tokenID);
            this.parse(parser);
        }
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Unclosed statement of package "${tokenID.keyword}"`);
        }
        this.path.pop();
    }

    public matchFunction(): void {
        //not implemented
    }

    public appendPath(token: LingToken): void {
        this.path.push(token.keyword);
    }

    public static find(parser: LingParser): boolean {
        return parser.match(ELingTokenType.PACKAGE);
    }
}