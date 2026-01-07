import { ELingTokenType } from "./ELingTokenType";
import { LingParser } from "./LingParser";
import { LingToken } from "./LingToken";

export namespace StatementHelper {
    export namespace Lang {
        export function buildLanguage(parser: LingParser, stopPredicate?: () => boolean): string | null {
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
        return parser.match(ELingTokenType.IDENTIFIER) && (
            parser.match(ELingTokenType.OPEN_RBRACKET,1) || 
            parser.match(ELingTokenType.OPEN_RBRACKET, 5)
        )
    }
}