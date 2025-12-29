import { ELingTokenType } from "./ELingTokenType";
import LingToken from "./LingToken";

export default class LingLexicalAnalyzer {
    public line: number = 0;
    public position: number = 0;
    public column: number = 0;
    public currentChar!: string;
    public langs: string[] = [];
    public tokens: LingToken[] = [];
    
    public constructor(public text: string) {}

    public tokenize(): void {
        this.currentChar = this.text[0];
        let token;
        do { token = this.next(); } while(token != null);
    }

    public addToken(type: ELingTokenType, keyword?: string): LingToken {
        const token = new LingToken(this.line, this.column, type, keyword);
        this.tokens.push(token);
        return token;
    }

    public throwError(text: string): void {
        throw `LingLexicalAnalyzer: ${text} on line ${this.line} and position ${this.position}`;
    }

    public isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    public tokenizeString(): LingToken {
        this.advance()
        let string = "";
        
        while(true) {
            if(!this.currentChar) {
                this.throwError(`Unclosed string`);
                break;
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
        this.advance();
        this.advance();
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
            //return this.next();
        }
        
        if(this.isDigit(this.currentChar) || ((this.currentChar == "." || this.currentChar == "_") && this.isDigit(this.peek()))) {
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
            const token = this.tokenizeIdentifier(word);
            if(token != null) {
                return token;
            }
        }
        this.throwError(`Unexpected ${this.currentChar}`)
    }

    public tokenizeIdentifier(text: string): LingToken {
        if(this.isValidWord(text)) {
            return this.addToken(ELingTokenType.IDENTIFIER, text);
        } 
        return null;
    }

    public tokenizeKeyword(keyword: string): LingToken {
        return this.addToken(ELingTokenType.getKeywordToken(keyword));
    }

    public buildID(): string {
        let string = "";

        while(this.currentChar && this.isValidIdentifierChar(this.currentChar)) {
            string += this.currentChar;
            this.advance();
        }
        return string;
    }

    public isValidIdentifierChar(char: string): boolean {
        return !this.isWhitespace(char) && !ELingTokenType.isOperator(char) && /[a-zA-Z0-9_.\-]/i.test(char);
    } 

    public isValidWord(word: string): boolean {
        if(this.isDigit(word[0])) {
            this.throwError("Unexpected number");
        }
        if(word.endsWith(".")) {
            this.throwError(`Unexpected last point in package name: "${word}"`);
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

    public peek(): string {
        const pos = this.position + 1;
        return pos < this.text.length ? this.text[pos] : null;
    }

    public advance(): void {
        if(this.currentChar == '\n') {
            this.line++;
            this.column = 0;
        } else {
            this.column++;
        }

        this.position++;
        this.currentChar = this.text[this.position] || null;
    }
}