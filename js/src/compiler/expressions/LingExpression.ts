import { LingParser } from "../LingParser";

export default abstract class LingExpression {
    public override?: boolean;
    public runtime?: boolean;

    abstract parse(parser: LingParser, ...args: any[]): void;
    public apply?(parser: LingParser): void;
    public static find?(parser: LingParser): boolean;
}