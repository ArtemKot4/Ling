import { LingParser } from "../LingParser";

export default abstract class LingExpression {
    abstract parse(parser: LingParser, ...args: any[]): void;
    public apply?(parser: LingParser): void;
    public static find?(parser: LingParser): boolean;
}