import { ELingTokenType } from "./ELingTokenType"
import { LingToken } from "./LingToken";

export namespace LingFormatter {
    export interface ICodeMessage {
        message: string,
        reason?: string, 
        line?: number,
        column?: number,
        keyword?: string,
        type?: ELingTokenType,
        packageName?: string,
        fileName?: string
    }

    export function getStackTraceFrom(description: ICodeMessage, prefixName: string, text: string): string {
        const codeField = new CodeField(text);
        const codeText = codeField.buildFrom(description);
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
        public constructor(public codeText: string, public linesCount: number = 7) {}
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

        public buildFrom(description: ICodeMessage): string {
            const lineMin = description.line < this.linesCount ? description.line : this.linesCount;
            let spaceCount = "";
            const lines = this.codeText.split("\n").filter((lineText, index) => {
                return index >= description.line - lineMin && index <= description.line;
            });
            const findIndex = lines.findIndex((lineText) => lineText.trim().length != 0);
            lines.splice(0, findIndex);
    
            lines.forEach((lineText, index) => {
                const line = String(description.line + index);
                if(spaceCount.length < line.length) {
                    spaceCount = line;
                }
            });
            return lines.map((lineText, index) => { 
                return `${this.acceptLineText(String((description.line - lineMin) + (index + findIndex) + 1), spaceCount)}` + lineText
            })
            .join("\n");
        }
    }
}