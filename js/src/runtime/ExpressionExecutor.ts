import { ExpressionValue } from "../compiler/expressions/ArithmeticExpression";
import { IProcessingExpression } from "../compiler/expressions/IProcessingExpression";
import { LingFunctionArgumentType, LingFunctionReturnTypes } from "../types";

export class ExpressionExecutor {
    public constructor(public ast: ExpressionValue, public args: Record<string, LingFunctionArgumentType>) {

    }

    public calculate(): LingFunctionReturnTypes {
        throw "Not implemented";
    }
}