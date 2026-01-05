"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExpressionStatement;
const SimpleLSPParser_1 = __importDefault(require("../SimpleLSPParser"));
function ExpressionStatement(target) {
    const find = target.find;
    if (find == null) {
        throw `Ling Expression decorator: expression class can't haven't static function "find"`;
    }
    SimpleLSPParser_1.default.expressions.push([target.find, target]);
    return target;
}
//# sourceMappingURL=ExpressionStatement.js.map