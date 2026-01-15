import { ELingTokenType } from "./ELingTokenType";
import { LingParser } from "./LingParser";
import { LingToken } from "./LingToken";
import LingExpression from "./expressions/LingExpression";

export namespace StatementHelper {
    export namespace Lang {
        export function buildLanguage(parser: LingParser): string | null {
            let language = "";
            let token = parser.currentToken;
            
            if(token == null || token.type != ELingTokenType.IDENTIFIER) {
                return null;
            }
            language += token.keyword;
            token = parser.next();

            while(parser.match(ELingTokenType.MINUS)) {
                language += "-";
                token = parser.next();
                if(!parser.match(ELingTokenType.IDENTIFIER)) {
                    break;
                }
                language += token.keyword;
                parser.next();
            }

            if(token == null) {
                return null;
            }
            return language;
        }
    }

    function getSkippedModifierIndex(parser: LingParser): number {
        let index = 0;
        let token = parser.peek(index);

        while(token != null && isValue(token.type) == false) {
            index++;
            token = parser.peek(index);   
        }
        return index;
    }

    export function isFunction(parser: LingParser): boolean {
        const index = getSkippedModifierIndex(parser);

        return parser.match(ELingTokenType.IDENTIFIER, index) && (
            parser.match(ELingTokenType.OPEN_RBRACKET, index + 1) || 
            parser.match(ELingTokenType.COLON, index + 1)
        );
    }

    export function isTranslation(parser: LingParser): boolean {
        let index = getSkippedModifierIndex(parser);
        
        if(isValue(parser.peek(index).type)) {
            if(parser.match(ELingTokenType.QUESTION, index + 1)) {
                index++;
            }
        }
        return parser.match(ELingTokenType.EQUAL, index + 1)
    }

    export function isValue(tokenType: ELingTokenType): boolean {
        return (
            tokenType == ELingTokenType.IDENTIFIER ||
            tokenType == ELingTokenType.STRING ||
            tokenType == ELingTokenType.NUMBER
        );
    }

    const mathOperators: Set<ELingTokenType> = new Set([
        ELingTokenType.PLUS,
        ELingTokenType.MINUS,
        ELingTokenType.ASTERISK,
        ELingTokenType.SLASH,
        ELingTokenType.PERCENT
    ]);

    const boolOperators: Set<ELingTokenType> = new Set([
        ELingTokenType.EQUAL,
        ELingTokenType.OPEN_ABRACKET,
        ELingTokenType.CLOSE_ABRACKET,
        ELingTokenType.IN,
        ELingTokenType.NOT,
        ELingTokenType.TRUE,
        ELingTokenType.FALSE
    ]);

    const keywords: Set<ELingTokenType> = new Set([
        ELingTokenType.DEFINE,
        ELingTokenType.PACKAGE,
        ELingTokenType.OVERRIDE,
        ELingTokenType.RUNTIME
    ]);
    
    export function isKeyword(tokenType: ELingTokenType): boolean {
        return keywords.has(tokenType);
    }

    export function isMathOperator(tokenType: ELingTokenType): boolean {
        return mathOperators.has(tokenType);
    }

    export function isBoolOperator(tokenType: ELingTokenType): boolean {
        return boolOperators.has(tokenType);
    }

    export function getPackageAndKeyName(name: string): [packageName: string, keyName: string] {
        const splited = name.split(".");
        let packageName, keyName;

        if(splited.length > 1) {
            keyName = splited.pop(), packageName = splited.join(".");
        }
        return [packageName, keyName || name];
    }

    export function applyModifiers<T extends LingExpression>(parser: LingParser, expression: T): void {
        if(parser.match(ELingTokenType.RUNTIME)) {
            expression.runtime = true;
            console.log("runtime: " + expression["name"]);
            parser.next();
        }
        if(parser.match(ELingTokenType.OVERRIDE)) {
            expression.override = true;
            console.log("override: " + expression["name"]);
            parser.next();
        }
    }

    export function hasEndExpression(parser: LingParser): boolean {
        return StatementHelper.isValue(parser.peek(0).type) && (StatementHelper.isValue(parser.peek(1).type) || (
            StatementHelper.isKeyword(parser.peek(1).type) || !StatementHelper.isBoolOperator(parser.peek(1).type) && !StatementHelper.isMathOperator(parser.peek(1).type)
        ));
    }
}