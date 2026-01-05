import { ELingTokenType } from "./ELingTokenType";
import SimpleLSPParser from "./SimpleLSPParser";

export namespace StatementHelper {
    export namespace Lang {
        export function isValidLanguageFormat(parser: SimpleLSPParser): boolean {
            return (
                parser.match(ELingTokenType.IDENTIFIER) && 
                parser.match(ELingTokenType.MINUS, 1) && 
                parser.match(ELingTokenType.IDENTIFIER, 2)
            );
        }

        export function satisfiesLanguageFormat(parser: SimpleLSPParser): boolean {
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

    export function isFunction(parser: SimpleLSPParser): boolean {
        return parser.match(ELingTokenType.IDENTIFIER) && (
            parser.match(ELingTokenType.OPEN_RBRACKET,1) || 
            parser.match(ELingTokenType.OPEN_RBRACKET, 5)
        )
    }
}