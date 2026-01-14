import { ELingTokenType } from "./ELingTokenType";
import { LingError } from "./LingError";
import { LingToken } from "./LingToken";

export default class LingLexicalAnalyzer {
    public static VALID_WORD_REGEXP: RegExp = /^[a-zA-Z0-9_.]*$/;
    public static FLAGS_REGEXP: RegExp = /i|g|m|s|u|y|d/;
    public line: number = 0;
    public position: number = 0;
    public column: number = 0;
    public currentChar!: string;
    public tokens: LingToken[] = [];

    protected startColumn: number;
    protected startLine: number;
    
    //string keys
    public hasOpenedStringExpression: boolean = false;
    
    public constructor(public text: string, public fileName?: string) {}

    public tokenize(): void {
        this.currentChar = this.text[0];
        let token;
        do { token = this.next(); } while(token != null);
    }

    protected newToken(type: ELingTokenType, keyword?: string): LingToken {
        return new LingToken(this.startLine, this.startColumn, type, keyword);
    }

    protected addToken(type: ELingTokenType, keyword?: string): LingToken {
        const token = this.newToken(type, keyword);
        this.tokens.push(token);
        return token;
    }

    public throwError(description: {
        message: string,
        reason?: string, 
        line?: number,
        column?: number,
        keyword?: string,
        type?: ELingTokenType,
        packageName?: string,
        fileName?: string
    }): void {
        description.column ??= this.column;
        description.line ??= this.line;
        description.fileName = this.fileName;
        new LingError("Ling ReferenceError", this).throw(description);
    }

    protected isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    protected tokenizeRegexp(): LingToken {
        this.advance();
        let regexp = "";
        while(true) {
            if(this.currentChar == null) {
                this.throwError({ 
                    message: "Unclosed regular expression", 
                    column: this.startColumn, 
                    line: this.startLine,
                    keyword: regexp  
                });
            }
            if(this.currentChar == "/") {
                this.advance();
                regexp += "|";
                while(this.currentChar != null && !this.isWhitespace(this.currentChar)) {
                    if(!LingLexicalAnalyzer.FLAGS_REGEXP.test(this.currentChar)) {
                        this.throwError({
                            message: `Invalid regular expression`, 
                            reason: `Expected valid regular flag, not "${this.currentChar}"`,
                            keyword: regexp,
                            column: this.startColumn
                        });
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

    protected tokenizeString(): LingToken {
        this.advance();
        let string = "";
        
        while(true) {
            if(this.currentChar == null) {
                this.throwError({ 
                    message: `Unclosed string`, 
                    column: this.startColumn, 
                    line: this.startLine,
                    keyword: string 
                });
            }
            if(this.hasOpenedStringExpression == false && this.peek(-1) != "\\" && this.currentChar == "$" && this.peek() == "{") {
                this.hasOpenedStringExpression = true;
                this.addToken(ELingTokenType.STRING, string);
                this.addToken(ELingTokenType.PLUS);
                this.addToken(ELingTokenType.OPEN_RBRACKET);
                this.advance(2); // ${
                let token;
                while(true) {
                    if(this.currentChar == "}" as any) {
                        if(token == null) {
                            this.throwError({ message: "Inside string expression cannot be empty" });
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
                    token = this.next();
                    
                    if(token == null) {
                        this.throwError({ message: "Unexpected end of inside string expression" });
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

    protected tokenizeNumber(): LingToken {
        let numberLiteral = "";
        let hasDot = false;
        
        while(this.currentChar && (this.isDigit(this.currentChar) || this.currentChar == "." || this.currentChar == "_")) {
            if(this.currentChar == ".") {
                if(hasDot == true) {
                    this.throwError({ message: "Expected one dot in number literal" });
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

    protected tokenizeOperator(): LingToken {
        const token = this.addToken(ELingTokenType.getOperatorToken(this.currentChar));
        this.advance();
        return token;
    }

    protected skipLine(): void {
        while(this.currentChar != null && this.currentChar != "\n") {
            this.advance();
        }
        this.advance();
    }

    protected skipLongComment(): void {
        while(this.currentChar != null && !(this.currentChar == "*" && this.peek() == "/")) {
            this.advance();
        }
        this.advance(2); // /*
    }

    protected isValidNumber(): boolean {
        return this.isDigit(this.currentChar) || ((this.currentChar == "." || this.currentChar == "_") && this.isDigit(this.peek()));
    }

    protected next(): LingToken {
        this.skipWhitespace();

        if(!this.currentChar) {
            return null;
        }

        this.startColumn = this.column; 
        this.startLine = this.line;

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
        
        if(this.isValidNumber()) {
            return this.tokenizeNumber();
        }
        if(this.currentChar == `"`) {
            return this.tokenizeString();
        }
        if(ELingTokenType.isOperator(this.currentChar)) {
            return this.tokenizeOperator();
        }
        const word = this.buildID().trimStart();
        if(ELingTokenType.isKeyword(word)) {
            return this.tokenizeKeyword(word);
        } else {
            if(!this.isValidWord(word)) {
                return null;
            }
            return this.tokenizeIdentifier(word);
        }
    }

    protected tokenizeIdentifier(text: string): LingToken {
        return this.addToken(ELingTokenType.IDENTIFIER, text);
    }

    protected tokenizeKeyword(keyword: string): LingToken {
        return this.addToken(ELingTokenType.getKeywordToken(keyword));
    }

    protected buildID(): string {
        let string = "";

        while(this.currentChar != null && this.isValidIdentifierChar(this.currentChar)) {
            string += this.currentChar;
            this.advance();
        }
        return string;
    }

    protected isValidIdentifierChar(char: string): boolean {
        return !this.isWhitespace(char) && !ELingTokenType.isOperator(char) //&& /[a-zA-Z0-9_.\-]/i.test(char);
    } 

    protected isValidWord(word: string): boolean {
        if(this.isDigit(word[0])) {
            this.throwError({ message: "Unexpected number" });
            return false;
        }
        if(word.startsWith(".")) {
            this.throwError({ message: "Expected name of packet", column: this.startColumn });
            return false;
        }
        if(!LingLexicalAnalyzer.VALID_WORD_REGEXP.test(word)) {
            this.throwError({ message: `Unexpected ${word}`, keyword: word, column: this.startColumn });
            return false;
        }
        if(word.endsWith(".")) {
            this.throwError({ message: `Unexpected last point at "${word}"` });
            return false;
        }
        return true;
    }

    protected isLineComment(): boolean {
        return this.currentChar == "/" && this.peek() == "/";
    }

    protected isLongComment(): boolean {
        return this.currentChar == "/" && this.peek() == "*";
    }

    protected isWhitespace(char): char is ELingTokenType.WHITESPACES {
        return char == " " || char == "\n" || char == "\t" || char == "\r";
    } 

    protected skipWhitespace(): void {
        while(this.isWhitespace(this.currentChar)) {
            this.advance();
        }
    }

    protected peek(index = 1): string {
        const pos = this.position + index;
        return pos < this.text.length ? this.text[pos] : null;
    }

    protected advance(index = 1): void {
        for(let i = 0; i < index; i++) {
            if(this.currentChar == '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            
            this.position++;
            this.currentChar = this.position < this.text.length ? this.text[this.position] : null;
        }
    }
}
