import { LingParser } from "../LingParser";
import LingExpression from "./LingExpression";

export class LingTranslationExpression extends LingExpression {
    parse(parser: LingParser): void {
        throw new Error("Method not implemented.");
    }
    
}