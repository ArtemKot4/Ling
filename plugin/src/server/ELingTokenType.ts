export enum ELingTokenType {
    /**
     * `{`
     */
    OPEN_CBRACKET,
    /**
     * `}`
     */
    CLOSE_CBRACKET,
    /**
     * `[`
     */
    OPEN_SBRACKET,
    /**
     * `]`
     */
    CLOSE_SBRACKET,
    /**
     * `(`
     */
    OPEN_RBRACKET,
    /**
     * `)`
     */
    CLOSE_RBRACKET,
    /**
     * `<`
     */
    OPEN_ABRACKET,
    /**
     * `>`
     */
    CLOSE_ABRACKET,
    /**
     * `=`
     */
    EQUAL,
    /**
     * `,`
     */
    COMMA,
    /**
     * `define`
     */
    DEFINE,
    /**
     * `package`
     */
    PACKAGE,
    /**
     * `"any"`
     */
    STRING,
    /**
     * `/any/`
     */
    REGEXP,
    /**
     * `[0-9]`
     */
    NUMBER,
    /**
     * method: `process_ex(a, b) {}` -> `process_ex = IDENTIFIER;`, translation: `a = "hello", b { "hello" }` -> `a = IDENTIFIER, b = IDENTIFIER`
     */
    IDENTIFIER,
    /**
     * `*`
     */
    ASTERISK,
    /**
     * `+`
     */
    PLUS,
    /**
     * `-`
     */
    MINUS,
    /**
     * `;`
     */
    SEMICOLON,
    /**
     * `:`
     */
    COLON,
    /**
     * `%`
     */
    PERCENT,
    /**
     * `|`
     */
    PIPE,
    /**
     * `/`
     */
    SLASH,
    /**
     * `match`
     */
    MATCH,
    /**
     * `and`
     */
    AND,
    /**
     * `or`
     */
    OR,
    /**
     * `not`
     */
    NOT,
    /**
     * `in`
     */
    IN,
    QUESTION,
    DOCUMENTATION
}

export namespace ELingTokenType {
    export type WHITESPACES = " " | "\n" | "\t" | "\r"

    export const operators = {
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

    export const keywords = {
        "define": ELingTokenType.DEFINE,
        "package": ELingTokenType.PACKAGE,
        "match": ELingTokenType.MATCH,
        "and": ELingTokenType.AND,
        "or": ELingTokenType.OR,
        "not": ELingTokenType.NOT,
        "in": ELingTokenType.IN
    };

    export function isOperator(text: string): boolean {
        return text in operators;
    }

    export function isKeyword(text: string): boolean {
        return text in keywords;
    }
    
    export function getOperatorToken(text: string): ELingTokenType | null {
        return operators[text] ?? null;
    }

    export function getKeywordToken(text: string): ELingTokenType | null {
        return keywords[text] ?? null;
    }

    export function getTypeName(type: ELingTokenType): string {
        const typeName = ELingTokenType[type];
        if(typeName == null) {
            throw new ReferenceError(`ELingTokenType: type "${type}" is not exists`);
        }
        return typeName;
    }
}