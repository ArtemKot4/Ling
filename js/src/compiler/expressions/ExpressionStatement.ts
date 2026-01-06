import LingExpression from "./LingExpression";
import { LingParser } from "../LingParser";

export default function ExpressionStatement<T extends new (...args: any[]) => LingExpression>(target: T): T {
    const find = (target as typeof LingExpression).find;
    if(find == null) {
        throw `Ling ExpressionDecorator: expression class "${target.name}" can't haven't static function "find"`;
    }
    if(!(target.prototype as LingExpression).apply) {
        console.warn(`Ling ExpressionDecorator: expression class "${target.name}" should have function "apply"`)
    }
    LingParser.expressions.push([(target as typeof LingExpression).find, target as any]);
    return target;
}