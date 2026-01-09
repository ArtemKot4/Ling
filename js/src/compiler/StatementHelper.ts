import { ELingTokenType } from "./ELingTokenType";
import { LingParser } from "./LingParser";
import { LingToken } from "./LingToken";

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

    export function isFunction(parser: LingParser): boolean {
        let startIndex = parser.match(ELingTokenType.OVERRIDE) ? 1 : 0;
        return parser.match(ELingTokenType.IDENTIFIER, startIndex) && (
            parser.match(ELingTokenType.OPEN_RBRACKET, startIndex + 1) || 
            parser.match(ELingTokenType.COLON, startIndex + 1)
        );
    }

    export function isTranslation(parser: LingParser): boolean {
        return (parser.match(ELingTokenType.IDENTIFIER) || parser.match(ELingTokenType.STRING)) && (
            parser.match(ELingTokenType.EQUAL, 1) || (
                parser.match(ELingTokenType.QUESTION, 1) && 
                parser.match(ELingTokenType.EQUAL, 2)
            )
        )
    }

    export function isValue(tokenType: ELingTokenType): boolean {
        return (
            tokenType == ELingTokenType.IDENTIFIER ||
            tokenType == ELingTokenType.STRING ||
            tokenType == ELingTokenType.NUMBER
        );
    }

    const keywords: Set<ELingTokenType> = new Set([
        ELingTokenType.DEFINE,
        ELingTokenType.PACKAGE,
        ELingTokenType.OVERRIDE
    ]);
    
    export function isKeyword(tokenType: ELingTokenType): boolean {
        return keywords.has(tokenType);
    }

    export function getPackageAndKeyName(name: string): [packageName: string, keyName: string] {
        const splited = name.split(".");
        let packageName, keyName;

        if(splited.length > 1) {
            keyName = splited.pop(), packageName = splited.join(".");
        }
        return [packageName, keyName || name];
    }
}