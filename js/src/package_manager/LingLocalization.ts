import { LingParser } from "../compiler/LingParser";
import { ArithmeticExpression } from "../compiler/expressions/ArithmeticExpression";
import { IJSLingFunction, ILingFunctionNode } from "../compiler/expressions/LingFunctionExpression";
import { LingFunctionArgumentType, LingFunctionReturnTypes } from "../types";
import { LingManager } from "./LingManager";

export function t(key: string): string {
    const splited = key.split(".");
    const translationKey = splited.pop();
    const packageName = splited.join(".");

    return LingManager.getTranslation(packageName, translationKey);
}

export function tcall(key: string, args: LingFunctionArgumentType[]): LingFunctionReturnTypes {
    const splited = key.split(".");
    const functionKey = splited.pop();
    const packageName = splited.join(".");

    return LingManager.callFunction(packageName, functionKey, args);
}