import { ExpressionValue } from "../compiler/expressions/ExpressionParser";
import { IProcessingExpression } from "../compiler/expressions/IProcessingExpression";
import { LingFunctionArgumentType, LingFunctionReturnTypes } from "../types";

export class ExpressionExecutor {
    public constructor(public ast: ExpressionValue, public args: Record<string, LingFunctionArgumentType>) {

    }

    public calculate(): LingFunctionReturnTypes {
        return JSON.stringify(this.ast); //will be implemented;
    }
}