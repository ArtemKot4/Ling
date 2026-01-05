import { TextDocument } from 'vscode-languageserver-textdocument';
import LingToken from "./LingToken";
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { ELingTokenType } from './ELingTokenType';
import { Diagnostic } from 'vscode-languageserver/node';

export default class SimpleLSPLexicalAnalyzer {
    public static FLAGS_REGEXP: RegExp = /i|g|m|s|u|y|d/;
    
    public currentChar: string;
    public line: number = 0;
    public position: number = 0;
    public column: number = 0;
    public text: string;
    public keyword!: string;
    public tokens: LingToken[] = [];
    public diagnostics: Diagnostic[] = [];

    public constructor(public document: TextDocument) {
        this.text = document.getText();
        this.currentChar = this.text[0] || null;
    }

    public parse(): void {  
        let stop;
        do { stop = this.next() }while(stop !== null)
    }

    public isWhitespace(char): boolean {
        return char == null || char == " " || char == "\n" || char == "\t" || char == "\r";
    } 

    public skipWhitespace(): void {
        while(this.isWhitespace(this.currentChar)) {
            this.advance();
        }
    }

    public parseDocumentation(): string {
        let documentation = "";
    
        while(this.currentChar != null) {
            if(this.currentChar == "*" && this.peek() == "/") {
                this.advance(2);
                break;
            }
            documentation += this.currentChar;
            this.advance();
        }
        return documentation.trim();
    }

    public tokenizeRegexp(): void | null {
        this.advance();
        let regexp = "";
        while(true) {
            if(this.currentChar == null) {
                this.throwError("Unclosed regular expression");
                return;
            }
            if(this.currentChar == "/") {
                this.advance();
                regexp += "|";
                while(this.currentChar != null && !this.isWhitespace(this.currentChar)) {
                    if(!SimpleLSPLexicalAnalyzer.FLAGS_REGEXP.test(this.currentChar)) {
                        this.throwError(`Expected valid regular expression flag, not "${this.currentChar}"`);
                        return;
                    }
                    regexp += this.currentChar;
                    this.advance();
                }
                break;
            }
            regexp += this.currentChar;
            this.advance();
        }
        this.addToken(ELingTokenType.REGEXP, regexp);
    }

    public tokenizeString(): void | null {
        this.advance();
        let string = "";
        
        while(true) {
            if(this.currentChar == null) {
                this.throwError(`Unclosed string`);
                return;
            }
            if(this.currentChar == `"`) {
                this.advance();
                break;
            }
            string += this.currentChar;
            this.advance();
        }
        this.addToken(ELingTokenType.STRING, string);
    }

    public tokenizeNumber(): void | null {
        let numberLiteral = "";
        let hasDot = false;
        
        while(this.currentChar && (this.isDigit(this.currentChar) || this.currentChar == "." || this.currentChar == "_")) {
            if(this.currentChar == ".") {
                if(hasDot == true) {
                    this.throwError("Expected one dot in number literal");
                    return;
                }
                hasDot = true;
            }
            if(this.currentChar != "_") {
                numberLiteral += this.currentChar;
            }
            this.advance();
        }
        this.addToken(ELingTokenType.NUMBER, numberLiteral);
    }

    public isValidNumber(): boolean {
        return this.isDigit(this.currentChar) || ((this.currentChar == "." || this.currentChar == "_") && this.isDigit(this.peek()));
    }

    public next(): unknown {
        if(this.currentChar == null) {
            return null;
        }
        this.skipWhitespace();
    
        if(this.currentChar == "/") {
            if(this.peek() == "/") {
                this.skipLine();
                console.log("line_com")
                return this.next();
            }
            if(this.peek() == "*") {
                if(this.peek(2) == "*") {
                    this.advance(3); // /**
                    const documentation = this.parseDocumentation();
                    if(documentation.length > 0) {
                        this.addToken(ELingTokenType.DOCUMENTATION, documentation);
                    }
                    console.log("doc")
                    return;
                } else {
                    this.skipLongComment();
                    console.log("long_com")
                    return this.next();
                }
            }
            console.log("regexp")
            return this.tokenizeRegexp();
        }

        if(this.isValidNumber()) {
            return this.tokenizeNumber();
        }

        if(ELingTokenType.isOperator(this.currentChar)) {
            this.addToken(ELingTokenType.getOperatorToken(this.currentChar), this.currentChar);
            this.advance();
            console.log("op")
            return;
        }

        if(this.currentChar == `"`) {
            return this.tokenizeString();
        }
        const keyword = this.buildKeyword().trim(); 

        if(keyword == null) {
            return null;
        }

        if(ELingTokenType.isKeyword(keyword)) {
            this.addToken(ELingTokenType.getKeywordToken(keyword), this.keyword);
            console.log("keyword");
            return;
        }
        
        if(!this.isValidWord(keyword)) {
            return null;
        }
        this.addToken(ELingTokenType.IDENTIFIER, keyword);    
        console.log("id")    
    }

    public addToken(type: ELingTokenType, value: string = ""): LingToken {
        const token = new LingToken(
            this.line,
            this.position - value.length, 
            type,
            value,
        );
        this.tokens.push(token);
        return token;
    }
    
    public buildKeyword(): string | null {
        if(this.currentChar == null) {
            return null;
        }
        let keyword = "";
        
        while(!this.isWhitespace(this.currentChar) && !ELingTokenType.isOperator(this.currentChar)) {
            keyword += this.currentChar;
            this.advance();
        }
        
        if(keyword.length > 0) {
            this.keyword = keyword;
            return keyword;
        }
        return null;
    }

    public isValidWord(word: string): boolean {
        if(this.isDigit(word[0])) {
            this.throwError("Unexpected number");
            return false;
        }
        if(word.startsWith(".")) {
            this.throwError("Expected name of packet");
            return false;
        }
        if(!/^[a-zA-Z0-9_.]*$/.test(word)) {
            this.throwError(`Unexpected ${word}`);
            return false;
        }
        if(word.endsWith(".")) {
            this.throwError(`Unexpected last point at "${word}"`);
            return false;
        }
        return true;
    }

    public isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
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
        this.advance(2); // */
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
        this.currentChar = this.position < this.text.length ? this.text[this.position] : null;
    }

    public throw(message: string, severity: DiagnosticSeverity, posStart?: number, posEnd?: number): void {
        const start = this.document.positionAt((posStart ?? this.position) - this.keyword.length);
        const end = this.document.positionAt(posEnd ?? (this.position + this.keyword.length));

        this.diagnostics.push({
            range: { start, end },
            message: message,
            severity: severity,
            source: "ling"
        });
        return null;
    }

    public throwError(message: string, posStart?: number, posEnd?: number): void {
        return this.throw(message, DiagnosticSeverity.Error, posStart, posEnd);
    }

    public throwWarn(message: string, posStart?: number, posEnd?: number): void {
        return this.throw(message, DiagnosticSeverity.Warning, posStart, posEnd);
    }
}