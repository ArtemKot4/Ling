import { LingManager } from "../../package_manager/LingManager";
import { ExpressionExecutor } from "../../runtime/ExpressionExecutor";
import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ExpressionParser, ExpressionValue } from "./ExpressionParser";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";

@ExpressionStatement
export class LingTranslationExpression extends LingExpression {
    public nullable?: boolean;
    public name: string;
    public langs: string[];
    public packageName: string;
    public expressions: ExpressionValue[];

    public override parse(parser: LingParser, packageName: string): void {
        if(parser.currentToken.keyword.includes(".")) {
            [this.packageName, this.name] = StatementHelper.getPackageAndKeyName(parser.currentToken.keyword);
        } else {
            this.packageName = packageName, this.name = parser.currentToken.keyword;
        }
        this.langs ??= LingManager.getLangsFor(this.packageName);
        parser.next();
        
        if(parser.match(ELingTokenType.QUESTION)) {
            this.nullable = true;
            parser.next(); //?
        }
        if(!parser.match(ELingTokenType.EQUAL)) {
            parser.throwError(`Expected assignment operator "=" for translation "${this.name}" at package "${this.packageName}"`);
        }
        parser.next(); //=
        this.expressions = [this.buildExpression(parser)];

        while(parser.match(ELingTokenType.COMMA)) {
            parser.next(); //,
            if(this.langs.length == this.expressions.length) {
                parser.throwError(`Unexpected language for translation "${this.name}" and enumeration ${this.expressions.length + 1}`)
            }
            this.expressions.push(this.buildExpression(parser));
        }
        this.addValuesIfNeeded(parser);
    }

    public override apply(parser: LingParser): void {
        const lingPackage = LingManager.getPackage(this.packageName);
        if(lingPackage == null) {
            parser.throwError(`Unknown package "${this.packageName}" for translation "${this.name}"`)
        }
        for(let i = 0; i < this.langs.length; i++) {
            const translations = lingPackage.translations[this.langs[i]] ??= {};
            translations[this.name] = String(new ExpressionExecutor(this.expressions[i], {}).calculate());
        }
    }

    public addValuesIfNeeded(parser: LingParser): void {
        if(this.expressions.length < this.langs.length) {
            let languages = "";
            for(let i = this.expressions.length; i < this.langs.length; i++) {
                languages += `"${this.langs[i]}"` + ", ";
                this.expressions.push(null);
            }
            languages = languages.slice(0, -2);
            if(this.nullable == null && languages.length > 0) {
                parser.throwError(`Expected translations for langs ${languages} by translation "${this.name}" at package "${this.packageName}"`);
            }
            parser.throwWarning(`Nullable values for langs ${languages} by translation "${this.name}" at package "${this.packageName}" not recommended`)
        }
    } 

    public buildExpression(parser: LingParser): ExpressionValue {
        const tokens = [parser.currentToken];
        while(parser.currentToken != null) {
            if(parser.match(ELingTokenType.COMMA)) {
                break;
            } 
            if(parser.match(ELingTokenType.SEMICOLON)) {
                parser.next();
                break;
            }
            if(
                StatementHelper.isValue(parser.peek(0).type) && (StatementHelper.isValue(parser.peek(1).type) || StatementHelper.isKeyword(parser.peek(1).type))
            ) {
                tokens.push(parser.next());
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