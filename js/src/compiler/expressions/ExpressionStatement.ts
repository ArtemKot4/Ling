import LingExpression from "./LingExpression";
import { LingParser } from "../LingParser";

export default function ExpressionStatement<T extends new (...args: any[]) => LingExpression>(target: T): T {
    const find = (target as typeof LingExpression).find;
    if(find == null) {
        throw `Ling Expression decorator: expression class can't haven't static function "find"`;
    }
    LingParser.expressions.push([(target as typeof LingExpression).find, target as any]);
    return target;
}