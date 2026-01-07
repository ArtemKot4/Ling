import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { LingParser } from "../LingParser";

export interface IProcessingExpression {
    parse(parser: LingParser);
    calculate<LingReturnType extends LingFunctionReturnTypes>(args?: LingFunctionArgumentType[]): LingReturnType;
}