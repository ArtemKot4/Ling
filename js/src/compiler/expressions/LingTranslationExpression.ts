import { LingManager } from "../../package_manager/LingManager";
import { ExpressionExecutor } from "../../runtime/ExpressionExecutor";
import { ELingTokenType } from "../ELingTokenType";
import { LingParser } from "../LingParser";
import { LingToken } from "../LingToken";
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
    public errorToken: LingToken;

    public override parse(parser: LingParser, packageName: string): void {
        StatementHelper.applyModifiers(parser, this);

        [this.packageName, this.name] = StatementHelper.getPackageAndKeyName(parser.currentToken.keyword, packageName);

        this.langs ??= LingManager.getLangsFor(this.packageName);
        parser.next();
        
        if(parser.match(ELingTokenType.QUESTION)) {
            this.nullable = true;
            parser.next(); // ?
        }
        if(!parser.match(ELingTokenType.EQUAL)) {
            parser.throwError({ message: `Expected assignment operator "="` });
        }
        parser.next(); // =
        this.expressions = [this.buildExpression(parser)];

        while(parser.match(ELingTokenType.COMMA)) {
            parser.next(); // ,

            if(this.langs.length == this.expressions.length) {
                parser.throwError({ message: `Unexpected language`, reason: `undefined index ${this.expressions.length + 1} of translation`, packageName: this.packageName });
            }
            this.expressions.push(this.buildExpression(parser));
        }
        if(this.expressions.length < this.langs.length) {
            this.errorToken = parser.peek(-1)// || parser.currentToken;
        }
        this.addValuesIfNeeded(parser);
    }

    public override apply(parser: LingParser): void {
        const lingPackage = LingManager.getPackage(this.packageName);
        if(lingPackage == null) {
            parser.throwError({ message: `Unknown package "${this.packageName}" for translation "${this.name}" at package "${this.packageName}"` })
        }
        for(let i = 0; i < this.langs.length; i++) {
            const translations = lingPackage.translations[this.langs[i]] ??= {};
            if(this.name in translations && this.override == null) {
                parser.throwError({ message: `Unexpected repeating of translation "${this.name}" at package "${this.packageName}". You wanted to use override?`, packageName: this.packageName })
            }
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
                parser.throwError({ message: `Expected more translations`, reason: `missing comma to enumerate translations for langs: ${languages}`, packageName: this.packageName, ...this.errorToken });
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
                StatementHelper.hasEndExpression(parser)
            ) {
                parser.next()
                break;
            }
            tokens.push(parser.next());
        }
        return new ExpressionParser(tokens).parse();
    }

    public static find(parser: LingParser): boolean {
        return StatementHelper.isTranslation(parser);
    }
}