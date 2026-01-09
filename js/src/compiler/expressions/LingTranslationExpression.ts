import { LingManager } from "../../package_manager/LingManager";
import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ExpressionParser, ExpressionValue } from "./ExpressionParser";
import LingExpression from "./LingExpression";

export class LingTranslationExpression extends LingExpression {
    public nullable?: boolean;
    public name: string;
    public langs: string[];
    public packageName: string;

    public override parse(parser: LingParser, packageName: string = "common"): void {
        this.packageName = packageName || "common";
        this.name = parser.currentToken.keyword;

        if(packageName == "common") {
            const path = this.name.split(".");
            if(path.length > 1) {
                this.name = path.pop();
                packageName = path.join(".");
            }
        }
        const lingPackage = LingManager.getPackage(packageName);
        parser.next();
        
        if(parser.match(ELingTokenType.QUESTION)) {
            this.nullable = true;
            parser.next(); //?
        }
        if(!parser.match(ELingTokenType.EQUAL)) {
            parser.throwError(`Expected assignment operator "=" for translation "${this.name}"`);
        }
        parser.next(); //=

        const values = [this.buildValue(parser)]; // первое значение
        while(parser.match(ELingTokenType.COMMA)) {
            parser.next(); // съедаем запятую
            values.push(this.buildValue(parser));
        }
    }

    public buildValue(parser: LingParser): ExpressionValue {
        const tokens = [parser.currentToken];
        while(parser.currentToken != null) {
            if(parser.match(ELingTokenType.COMMA)) {
                break;
            } 
            if(
                parser.match(ELingTokenType.SEMICOLON) ||
                StatementHelper.isValue(parser) && StatementHelper.isValue(parser, 1)
            ) {
                break;
            }
            const token = parser.next();
            tokens.push(token);
        }
        return new ExpressionParser(tokens).parse();
    }

    public static find(parser: LingParser): boolean {
        return StatementHelper.isTranslation(parser);
    }
}