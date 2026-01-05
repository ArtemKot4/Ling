"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatementHelper = void 0;
const ELingTokenType_1 = require("./ELingTokenType");
var StatementHelper;
(function (StatementHelper) {
    let Lang;
    (function (Lang) {
        function isValidLanguageFormat(parser) {
            return (parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER) &&
                parser.match(ELingTokenType_1.ELingTokenType.MINUS, 1) &&
                parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER, 2));
        }
        Lang.isValidLanguageFormat = isValidLanguageFormat;
        function satisfiesLanguageFormat(parser) {
            if (!parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER)) {
                parser.throwError(`Expected identifier of language name like "en"`);
            }
            if (!parser.match(ELingTokenType_1.ELingTokenType.MINUS, 1)) {
                parser.throwError(`Expected enumeration operator '-' for language`);
            }
            if (!parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER, 2)) {
                parser.throwError(`Expected two part of identifier of language like "US"`);
            }
            return true;
        }
        Lang.satisfiesLanguageFormat = satisfiesLanguageFormat;
    })(Lang = StatementHelper.Lang || (StatementHelper.Lang = {}));
    function isFunction(parser) {
        return parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER) && (parser.match(ELingTokenType_1.ELingTokenType.OPEN_RBRACKET, 1) ||
            parser.match(ELingTokenType_1.ELingTokenType.OPEN_RBRACKET, 5));
    }
    StatementHelper.isFunction = isFunction;
})(StatementHelper || (exports.StatementHelper = StatementHelper = {}));
//# sourceMappingURL=StatementHelper.js.map