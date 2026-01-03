import { ELingTokenType } from "./ELingTokenType";
import { LingToken } from "./LingToken";

export default class LingLexicalAnalyzer {
    public static FLAGS_REGEXP: RegExp = /i|g|m|s|u|y|d/;
    public line: number = 0;
    public position: number = 0;
    public column: number = 0;
    public currentChar!: string;
    public langs: string[] = [];
    public tokens: LingToken[] = [];
    
    //string keys
    public hasOpenedStringExpression: boolean = false;
    
    public constructor(public text: string, public fileName?: string) {}

    public tokenize(): void {
        this.currentChar = this.text[0];
        let token;
        do { token = this.next(); } while(token != null);
    }

    public newToken(type: ELingTokenType, keyword?: string): LingToken {
        return new LingToken(this.line, this.column, type, keyword);
    }

    public addToken(type: ELingTokenType, keyword?: string): LingToken {
        const token = this.newToken(type, keyword);
        this.tokens.push(token);
        return token;
    }

    public throwError(text: string): void {
        throw `Ling ReferenceError: ${text} on line ${this.line} and position ${this.position}${this.fileName ? " at file: " + this.fileName.split(".").slice(-2).join(".") : ""}`;
    }

    public isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    public tokenizeRegexp(): LingToken {
        this.advance();
        let regexp = "";
        while(true) {
            if(this.currentChar == null) {
                this.throwError("Unclosed regular expression");
            }
            if(this.currentChar == "/") {
                this.advance();
                regexp += "|";
                while(this.currentChar != null && !this.isWhitespace(this.currentChar)) {
                    if(!LingLexicalAnalyzer.FLAGS_REGEXP.test(this.currentChar)) {
                        this.throwError(`Expected valid regular expression flag, not "${this.currentChar}"`)
                    }
                    regexp += this.currentChar;
                    this.advance();
                }
                break;
            }
            regexp += this.currentChar;
            this.advance();
        }
        return this.addToken(ELingTokenType.REGEXP, regexp);
    }

    public tokenizeString(): LingToken {
        this.advance();
        let string = "";
        
        while(true) {
            if(this.currentChar == null) {
                this.throwError(`Unclosed string`);
            }
            if(this.hasOpenedStringExpression == false && this.peek(-1) != "\\" && this.currentChar == "$" && this.peek() == "{") {
                this.hasOpenedStringExpression = true;
                this.addToken(ELingTokenType.STRING, string);
                this.addToken(ELingTokenType.PLUS);
                this.addToken(ELingTokenType.OPEN_RBRACKET);
                this.advance(2); // ${
                const startTokenLength = this.tokens.length;
                while(true) {
                    if(this.currentChar == "}" as any) {
                        if(this.tokens.length == startTokenLength) {
                            this.throwError("Inside string expression cannot be empty");
                        }
                        this.hasOpenedStringExpression = false;
                        const closeToken = this.addToken(ELingTokenType.CLOSE_RBRACKET);
                        this.advance(); // }
                        string = "";
                        if(this.currentChar != `"` as any) {
                            this.addToken(ELingTokenType.PLUS);
                            break;
                        }
                        this.advance(); // "
                        return closeToken;
                    }
                    const token = this.next();
                    
                    if(token == null) {
                        this.throwError("Unexpected end of inside string expression");
                    } 
                }
            }
            if(this.currentChar == `"`) {
                this.advance();
                break;
            }
            string += this.currentChar;
            this.advance();
        }
        return this.addToken(ELingTokenType.STRING, string);
    }

    public tokenizeNumber(): LingToken {
        let numberLiteral = "";
        let hasDot = false;
        
        while(this.currentChar && (this.isDigit(this.currentChar) || this.currentChar == "." || this.currentChar == "_")) {
            if(this.currentChar == ".") {
                if(hasDot == true) {
                    this.throwError("Expected one dot in number literal");
                }
                hasDot = true;
            }
            if(this.currentChar != "_") {
                numberLiteral += this.currentChar;
            }
            this.advance();
        }
        
        return this.addToken(ELingTokenType.NUMBER, numberLiteral);
    }

    public tokenizeOperator(): LingToken {
        const token = this.addToken(ELingTokenType.getOperatorToken(this.currentChar));
        this.advance();
        return token;
    }

    public skipLine(): void {
        while(this.currentChar != null && this.currentChar != "\n") {
            this.advance();
        }
        this.advance();
    }

    public skipLongComment(): void {
        while(this.currentChar != null && !(this.currentChar == "*" && this.peek() == "/")) {
            this.advance();
        }
        this.advance(2); // /*
    }

    public isValidNumber(): boolean {
        return this.isDigit(this.currentChar) || ((this.currentChar == "." || this.currentChar == "_") && this.isDigit(this.peek()));
    }

    public next(): LingToken {
        this.skipWhitespace();

        if(!this.currentChar) {
            return null;
        }
        if(this.currentChar == "/") {
            if(this.isLineComment()) {
                this.skipLine();
                return this.next();
            }
            if(this.isLongComment()) {
                this.skipLongComment();
                return this.next();
            }
            return this.tokenizeRegexp();
        }
        // if(this.currentChar == "\\" && this.peek() == "\\") {
        //     this.advance(2);
        // }
        
        if(this.isValidNumber()) {
            return this.tokenizeNumber();
        }
        if(this.currentChar == `"`) {
            return this.tokenizeString();
        }
        if(ELingTokenType.isOperator(this.currentChar)) {
            return this.tokenizeOperator();
        }
        const word = this.buildID();
        if(ELingTokenType.isKeyword(word)) {
            return this.tokenizeKeyword(word);
        } else {
            if(!this.isValidWord(word)) {
                this.throwError(`Unexpected ${word}`);
            }
            return this.tokenizeIdentifier(word);
        }
    }

    public tokenizeIdentifier(text: string): LingToken {
        return this.addToken(ELingTokenType.IDENTIFIER, text);
    }

    public tokenizeKeyword(keyword: string): LingToken {
        return this.addToken(ELingTokenType.getKeywordToken(keyword));
    }

    public buildID(): string {
        let string = "";

        while(this.currentChar != null && this.isValidIdentifierChar(this.currentChar)) {
            string += this.currentChar;
            this.advance();
        }
        return string;
    }

    public isValidIdentifierChar(char: string): boolean {
        return !this.isWhitespace(char) && !ELingTokenType.isOperator(char) //&& /[a-zA-Z0-9_.\-]/i.test(char);
    } 

    public isValidWord(word: string): boolean {
        if(this.isDigit(word[0])) {
            this.throwError("Unexpected number");
        }
        if(!/^[a-zA-Z0-9_]*$/.test(word)) {
            return false;
        }
        if(word.endsWith(".")) {
            this.throwError(`Unexpected last point at "${word}"`);
        }
        return true;
    }

    public isLineComment(): boolean {
        return this.currentChar == "/" && this.peek() == "/";
    }

    public isLongComment(): boolean {
        return this.currentChar == "/" && this.peek() == "*";
    }

    public isWhitespace(char): char is ELingTokenType.WHITESPACES {
        return char == " " || char == "\n" || char == "\t" || char == "\r";
    } 

    public skipWhitespace(): void {
        while(this.isWhitespace(this.currentChar)) {
            this.advance();
        }
    }

    public peek(index = 1): string {
        const pos = this.position + index;
        return pos < this.text.length ? this.text[pos] : null;
    }

    public advance(index = 1): void {
        if(this.currentChar == '\n') {
            this.line++;
            this.column = 0;
        } else {
            this.column += index;
        }

        this.position += index;
        this.currentChar = this.text[this.position] || null;
    }
}

const text = `

package aboba {
    hello(a=10) {
        a
    }
    ${'c = "hello ${10 + 5}! ${"lol${hi hi}" + 10}"'}
}

package heh {

}

`

// const la = new LingLexicalAnalyzer(text, "aboba.ling");
// la.tokenize();
// ELingTokenType.printTokens(la);