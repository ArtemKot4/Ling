import SimpleLSPParser from "../SimpleLSPParser";

export default abstract class LingExpression {
    abstract parse(parser: SimpleLSPParser, ...args: any[]): void;
    public static find?(parser: SimpleLSPParser): boolean;
}