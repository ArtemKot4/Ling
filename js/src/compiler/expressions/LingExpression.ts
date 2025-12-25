import { LingParser } from "../LingParser";

export default abstract class LingExpression {
    public type?: string;
    abstract parse(parser: LingParser, ...args: any[]): void;
    public static find?(parser: LingParser): boolean;
}