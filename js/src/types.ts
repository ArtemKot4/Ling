import { ArithmeticExpression } from "./compiler/expressions/ArithmeticExpression";
import { IJSLingFunction, ILingFunctionNode } from "./compiler/expressions/LingFunctionExpression";

export type LingFunctionArgumentType = string | boolean | number;
export type LingFunctionReturnTypes = string | boolean | number;

interface IPackageFunction<FunctionType extends IJSLingFunction | ILingFunctionNode = ILingFunctionNode> {
    default?: FunctionType,
    [lang: string]: FunctionType
}

export interface ILingPackage {
    functions?: {
        unexpected?: IPackageFunction,
        [functionName: string]: IPackageFunction<IJSLingFunction | ILingFunctionNode>
    },
    translations: {
        [lang: string]: {
            [translationName: string]: string
        }
    }
}