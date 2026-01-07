import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { LingParser } from "../LingParser";
import { LingToken } from "../LingToken";

export interface IProcessingExpression {
    parse(tokens: LingToken[]);
}