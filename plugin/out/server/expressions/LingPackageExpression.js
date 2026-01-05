"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LingPackageExpression = void 0;
const ELingTokenType_1 = require("../ELingTokenType");
const StatementHelper_1 = require("../StatementHelper");
const LingExpression_1 = __importDefault(require("./LingExpression"));
const LingFunction_1 = require("./LingFunction");
//@ExpressionStatement
class LingPackageExpression extends LingExpression_1.default {
    constructor() {
        super(...arguments);
        this.path = [];
    }
    parse(parser) {
        this.name = parser.expect(ELingTokenType_1.ELingTokenType.IDENTIFIER, "Expected packet name").keyword;
        parser.next();
        if (!parser.match(ELingTokenType_1.ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{", but got "${parser.peek(0).keyword}"`);
        }
        this.createPackages(parser, this.name.split("."), this.name);
        this.parseBlockStatement(parser);
        console.log("pack parsed");
    }
    parseBlockStatement(parser) {
        while (true) {
            if (parser.currentToken == null) {
                parser.throwError(`Unclosed statement of package "${this.name}"`);
            }
            if (parser.match(ELingTokenType_1.ELingTokenType.CLOSE_CBRACKET)) {
                this.path.pop();
                parser.next();
                break;
            }
            if (StatementHelper_1.StatementHelper.isFunction(parser)) {
                this.addFunction(parser);
                continue;
            }
            if (parser.match(ELingTokenType_1.ELingTokenType.PACKAGE)) {
                this.addPackage(parser);
                continue;
            }
            parser.next();
        }
    }
    appendPath(name) {
        this.path.push(name);
    }
    addFunction(parser) {
        var _a, _b, _c;
        (_a = this.currentPackage).functions ?? (_a.functions = {});
        const lingFunctionPath = (_b = this.currentPackage.functions)[_c = parser.currentToken.keyword] ?? (_b[_c] = {});
        const lingFunction = new LingFunction_1.LingFunctionExpression().parse(parser);
        if (lingFunction.lang != null) {
            lingFunctionPath[lingFunction.lang] = lingFunction;
        }
        else {
            lingFunctionPath.main = lingFunction;
        }
    }
    addPackage(parser) {
        this.appendPath(this.name);
        this.parse(parser);
    }
    createPackages(parser, path, id) {
        if (path.length >= 2) {
            const name = path.pop();
            this.path = this.path.concat(path);
            parser.createPackages(this.path, name);
            this.currentPackage = this.getPackage(parser, name);
        }
        else {
            parser.createPackages(this.path, id);
            this.currentPackage = this.getPackage(parser, id);
        }
        parser.next();
    }
    getPackage(parser, name) {
        return parser.getPackage([...this.path, name]);
    }
    static find(parser) {
        return parser.match(ELingTokenType_1.ELingTokenType.PACKAGE);
    }
}
exports.LingPackageExpression = LingPackageExpression;
//# sourceMappingURL=LingPackageExpression.js.map