import { ELingTokenType } from "./ELingTokenType"
import { LingToken } from "./LingToken";

export namespace LingFormatter {
    export function getStackTraceFrom(description: {
        message: string,
        reason?: string, 
        line?: number,
        column?: number,
        keyword?: string,
        type?: ELingTokenType,
        packageName?: string,
        fileName?: string
    }, prefixName: string, text: string): string {
        const codeField = new CodeField();
        const codeText = codeField.buildFrom(description, text);
        return [
            prefixName + ": " + description.message,
            "",
            codeText,
            new Array(codeField.prefixLength - 2).fill(" ").join("") + "|" +
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
        ].join("\n");
    }

    export class CodeField {
        public constructor(public linesCount: number = 7) {}
        public prefixLength: number = 0;

        public acceptLineText(line: string, spaceCount: string): string {
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

        public buildFrom(token: Partial<LingToken>, text: string): string {
            const lineMin = token.line < this.linesCount ? token.line : this.linesCount;
            let spaceCount = "";
            const lines = text.split("\n").filter((lineText, index) => {
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
                return `${this.acceptLineText(String((token.line - lineMin) + (index + findIndex) + 1), spaceCount)}` + lineText
            })
            .join("\n");
        }
    }
}