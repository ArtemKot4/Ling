import { ELingTokenType } from "./ELingTokenType";
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
        description.packageName ??= "common";
        console.log([
            this.name + ": " + description.message,
            "",
            this.getStackWith(description),
            new Array(this.prefixLength - 2).fill(" ").join("") + "|" +
            `${
                new Array(description.column)
                .fill(" ").join("")}${
                    new Array(
                        (description.keyword?.length ?? 1) + (
                            description.type == ELingTokenType.STRING ||
                            description.type == ELingTokenType.REGEXP ? 2 : 0
                        )
                    )
                    .fill("^").join("")} ${description.reason || "reason"}`,
                    "",
                    `${description.packageName != null ? `at package: "${description.packageName }"` : ""}${description.fileName != null ? "\nat file: " + `"${description.fileName}"` : ""}`,
            ]
        .join("\n"))
        throw ''
    }

    protected acceptLineText(line: string, spaceCount: string): string {
        let text = line;
        for(let i = line.length; i < spaceCount.length; i++) {
            text += " ";
        }
        text += " | ";

        if(this.prefixLength < text.length) {
            this.prefixLength = text.length;
        }
        return text;
    }

    protected getStackWith(token: Partial<LingToken>): string {
        const lineMin = token.line < 7 ? token.line : 7;
        let spaceCount = "";
        const lines = this.lexicalAnalyzer.text.split("\n").filter((lineText, index) => {
            return index >= token.line - lineMin && index <= token.line;
        });
        const findIndex = lines.findIndex((lineText) => lineText.trim().length != 0);
        lines.splice(0, findIndex);

        lines.forEach((lineText, index) => {
            const line = String(token.line + index);
            if(spaceCount.length < line.length) {
                spaceCount = line;
            }
        });
        return lines.map((lineText, index) => { 
            const lineIndexPrefix = this.acceptLineText(String((token.line - lineMin) + (index + findIndex) + 1), spaceCount);
            return `${lineIndexPrefix}` + lineText
        })
        .join("\n");
    }
}


// const text = require("fs").readFileSync("js/src/syntax_check.ling").toString()
// const l = new LingLexicalAnalyzer(text, "syntax_check.ling");
// l.tokenize();
// //ELingTokenType.printTokens(l, 0, 15);
// const p = new LingParser(l);
// p.parse();