import { ELingTokenType } from "./ELingTokenType";
import { LingParser } from "./LingParser";

export namespace StatementHelper {
    export namespace Lang {
        export function isValidLanguageFormat(parser: LingParser): boolean {
            return (
                parser.match(ELingTokenType.IDENTIFIER) && 
                parser.match(ELingTokenType.MINUS, 1) && 
                parser.match(ELingTokenType.IDENTIFIER, 2)
            );
        }

        export function satisfiesLanguageFormat(parser: LingParser): boolean {
            if(!parser.match(ELingTokenType.IDENTIFIER)) {
                parser.throwError(`Expected identifier of language name like "en"`);
            }
            if(!parser.match(ELingTokenType.MINUS, 1)) {
                parser.throwError(`Expected enumeration operator '-' for language`);
            }
            if(!parser.match(ELingTokenType.IDENTIFIER, 2)) {
                parser.throwError(`Expected two part of identifier of language like "US"`);
            }
            return true;
        }
    }

    export function isFunction(parser: LingParser): boolean {
        return parser.match(ELingTokenType.IDENTIFIER) && (
            parser.match(ELingTokenType.OPEN_RBRACKET,1) || 
            parser.match(ELingTokenType.OPEN_RBRACKET, 5)
        )
    }
}