import { ELingTokenType } from "./ELingTokenType";
import { LingFormatter } from "./LingFormatter";
import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingParser } from "./LingParser";
import { LingToken } from "./LingToken";

export class LingError {
    protected prefixLength: number = 0;

    public constructor(public name: string, public lexicalAnalyzer: LingLexicalAnalyzer) {}
    
    public throw(description: {
        message: string,
        reason?: string, 
        line?: number,
        column?: number,
        keyword?: string,
        type?: ELingTokenType,
        packageName?: string,
        fileName?: string
    }): void {
        description ??= {
            message: "Unknown error"
        };
        description.packageName ??= "common";
        console.log(LingFormatter.getStackTraceFrom(description, this.name, this.lexicalAnalyzer.text));
        throw ''
    }
}


// const text = require("fs").readFileSync("js/src/syntax_check.ling").toString()
// const l = new LingLexicalAnalyzer(text, "syntax_check.ling");
// l.tokenize();
// //ELingTokenType.printTokens(l, 0, 15);
// const p = new LingParser(l);
// p.parse();