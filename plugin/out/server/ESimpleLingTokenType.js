"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESimpleLingTokenType = void 0;
var ESimpleLingTokenType;
(function (ESimpleLingTokenType) {
    ESimpleLingTokenType[ESimpleLingTokenType["DEFINE"] = 0] = "DEFINE";
    ESimpleLingTokenType[ESimpleLingTokenType["TRANSLATION"] = 1] = "TRANSLATION";
    ESimpleLingTokenType[ESimpleLingTokenType["DOCUMENTATION"] = 2] = "DOCUMENTATION";
    ESimpleLingTokenType[ESimpleLingTokenType["OPERATOR"] = 3] = "OPERATOR";
    ESimpleLingTokenType[ESimpleLingTokenType["IDENTIFIER"] = 4] = "IDENTIFIER";
    ESimpleLingTokenType[ESimpleLingTokenType["STRING"] = 5] = "STRING";
    ESimpleLingTokenType[ESimpleLingTokenType["REGEXP"] = 6] = "REGEXP";
    ESimpleLingTokenType[ESimpleLingTokenType["NUMBER"] = 7] = "NUMBER";
})(ESimpleLingTokenType || (exports.ESimpleLingTokenType = ESimpleLingTokenType = {}));
(function (ESimpleLingTokenType) {
    const operators = [
        "+", "-", "*", "/", ">", "<", "=", "in", "and", "or", "not", "[", "]", "{", "}", "(", ")", ",", ":"
    ];
    function isOperator(text) {
        return operators.includes(text);
    }
    ESimpleLingTokenType.isOperator = isOperator;
})(ESimpleLingTokenType || (exports.ESimpleLingTokenType = ESimpleLingTokenType = {}));
//# sourceMappingURL=ESimpleLingTokenType.js.map