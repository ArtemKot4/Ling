"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELingTokenType = void 0;
var ELingTokenType;
(function (ELingTokenType) {
    /**
     * `{`
     */
    ELingTokenType[ELingTokenType["OPEN_CBRACKET"] = 0] = "OPEN_CBRACKET";
    /**
     * `}`
     */
    ELingTokenType[ELingTokenType["CLOSE_CBRACKET"] = 1] = "CLOSE_CBRACKET";
    /**
     * `[`
     */
    ELingTokenType[ELingTokenType["OPEN_SBRACKET"] = 2] = "OPEN_SBRACKET";
    /**
     * `]`
     */
    ELingTokenType[ELingTokenType["CLOSE_SBRACKET"] = 3] = "CLOSE_SBRACKET";
    /**
     * `(`
     */
    ELingTokenType[ELingTokenType["OPEN_RBRACKET"] = 4] = "OPEN_RBRACKET";
    /**
     * `)`
     */
    ELingTokenType[ELingTokenType["CLOSE_RBRACKET"] = 5] = "CLOSE_RBRACKET";
    /**
     * `<`
     */
    ELingTokenType[ELingTokenType["OPEN_ABRACKET"] = 6] = "OPEN_ABRACKET";
    /**
     * `>`
     */
    ELingTokenType[ELingTokenType["CLOSE_ABRACKET"] = 7] = "CLOSE_ABRACKET";
    /**
     * `=`
     */
    ELingTokenType[ELingTokenType["EQUAL"] = 8] = "EQUAL";
    /**
     * `,`
     */
    ELingTokenType[ELingTokenType["COMMA"] = 9] = "COMMA";
    /**
     * `define`
     */
    ELingTokenType[ELingTokenType["DEFINE"] = 10] = "DEFINE";
    /**
     * `package`
     */
    ELingTokenType[ELingTokenType["PACKAGE"] = 11] = "PACKAGE";
    /**
     * `"any"`
     */
    ELingTokenType[ELingTokenType["STRING"] = 12] = "STRING";
    /**
     * `/any/`
     */
    ELingTokenType[ELingTokenType["REGEXP"] = 13] = "REGEXP";
    /**
     * `[0-9]`
     */
    ELingTokenType[ELingTokenType["NUMBER"] = 14] = "NUMBER";
    /**
     * method: `process_ex(a, b) {}` -> `process_ex = IDENTIFIER;`, translation: `a = "hello", b { "hello" }` -> `a = IDENTIFIER, b = IDENTIFIER`
     */
    ELingTokenType[ELingTokenType["IDENTIFIER"] = 15] = "IDENTIFIER";
    /**
     * `*`
     */
    ELingTokenType[ELingTokenType["ASTERISK"] = 16] = "ASTERISK";
    /**
     * `+`
     */
    ELingTokenType[ELingTokenType["PLUS"] = 17] = "PLUS";
    /**
     * `-`
     */
    ELingTokenType[ELingTokenType["MINUS"] = 18] = "MINUS";
    /**
     * `;`
     */
    ELingTokenType[ELingTokenType["SEMICOLON"] = 19] = "SEMICOLON";
    /**
     * `:`
     */
    ELingTokenType[ELingTokenType["COLON"] = 20] = "COLON";
    /**
     * `%`
     */
    ELingTokenType[ELingTokenType["PERCENT"] = 21] = "PERCENT";
    /**
     * `|`
     */
    ELingTokenType[ELingTokenType["PIPE"] = 22] = "PIPE";
    /**
     * `/`
     */
    ELingTokenType[ELingTokenType["SLASH"] = 23] = "SLASH";
    /**
     * `match`
     */
    ELingTokenType[ELingTokenType["MATCH"] = 24] = "MATCH";
    /**
     * `and`
     */
    ELingTokenType[ELingTokenType["AND"] = 25] = "AND";
    /**
     * `or`
     */
    ELingTokenType[ELingTokenType["OR"] = 26] = "OR";
    /**
     * `not`
     */
    ELingTokenType[ELingTokenType["NOT"] = 27] = "NOT";
    /**
     * `in`
     */
    ELingTokenType[ELingTokenType["IN"] = 28] = "IN";
    ELingTokenType[ELingTokenType["QUESTION"] = 29] = "QUESTION";
    ELingTokenType[ELingTokenType["DOCUMENTATION"] = 30] = "DOCUMENTATION";
})(ELingTokenType || (exports.ELingTokenType = ELingTokenType = {}));
(function (ELingTokenType) {
    ELingTokenType.operators = {
        "{": ELingTokenType.OPEN_CBRACKET,
        "}": ELingTokenType.CLOSE_CBRACKET,
        "[": ELingTokenType.OPEN_SBRACKET,
        "]": ELingTokenType.CLOSE_SBRACKET,
        "(": ELingTokenType.OPEN_RBRACKET,
        ")": ELingTokenType.CLOSE_RBRACKET,
        "=": ELingTokenType.EQUAL,
        ",": ELingTokenType.COMMA,
        "*": ELingTokenType.ASTERISK,
        "+": ELingTokenType.PLUS,
        "-": ELingTokenType.MINUS,
        ";": ELingTokenType.SEMICOLON,
        "%": ELingTokenType.PERCENT,
        ":": ELingTokenType.COLON,
        "|": ELingTokenType.PIPE,
        "/": ELingTokenType.SLASH,
        ">": ELingTokenType.OPEN_ABRACKET,
        "<": ELingTokenType.CLOSE_ABRACKET,
        "?": ELingTokenType.QUESTION
        //"_": ELingTokenType.UNDERSCORE
    };
    ELingTokenType.keywords = {
        "define": ELingTokenType.DEFINE,
        "package": ELingTokenType.PACKAGE,
        "match": ELingTokenType.MATCH,
        "and": ELingTokenType.AND,
        "or": ELingTokenType.OR,
        "not": ELingTokenType.NOT,
        "in": ELingTokenType.IN
    };
    function isOperator(text) {
        return text in ELingTokenType.operators;
    }
    ELingTokenType.isOperator = isOperator;
    function isKeyword(text) {
        return text in ELingTokenType.keywords;
    }
    ELingTokenType.isKeyword = isKeyword;
    function getOperatorToken(text) {
        return ELingTokenType.operators[text] ?? null;
    }
    ELingTokenType.getOperatorToken = getOperatorToken;
    function getKeywordToken(text) {
        return ELingTokenType.keywords[text] ?? null;
    }
    ELingTokenType.getKeywordToken = getKeywordToken;
    function getTypeName(type) {
        const typeName = ELingTokenType[type];
        if (typeName == null) {
            throw new ReferenceError(`ELingTokenType: type "${type}" is not exists`);
        }
        return typeName;
    }
    ELingTokenType.getTypeName = getTypeName;
})(ELingTokenType || (exports.ELingTokenType = ELingTokenType = {}));
//# sourceMappingURL=ELingTokenType.js.map