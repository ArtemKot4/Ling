import { ExpressionParser } from "./compiler/expressions/ExpressionParser";
import { IJSLingFunction, ILingFunctionNode } from "./compiler/expressions/LingFunctionExpression";

export type LingFunctionArgumentType = string | boolean | number;
export type LingFunctionReturnTypes = string | boolean | number;


export interface ILingPackage {
    functions?: {
        [lang: string | "default"]: {
            [functionName: string]: IJSLingFunction | ILingFunctionNode
            unexpected?: ILingFunctionNode
        }
    },
    translations: {
        [lang: string]: {
            [translationName: string]: string
        }
    }
}