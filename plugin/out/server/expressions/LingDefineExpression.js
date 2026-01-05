"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LingDefineExpression_1;
Object.defineProperty(exports, "__esModule", { value: true });
const ELingTokenType_1 = require("../ELingTokenType");
const StatementHelper_1 = require("../StatementHelper");
const ExpressionStatement_1 = __importDefault(require("./ExpressionStatement"));
const LingExpression_1 = __importDefault(require("./LingExpression"));
const LingFunction_1 = require("./LingFunction");
let LingDefineExpression = LingDefineExpression_1 = class LingDefineExpression extends LingExpression_1.default {
    parse(parser) {
        parser.next();
        if (parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER)) {
            console.log("def identifier");
            this.parseWithKey(parser);
        }
        else if (parser.match(ELingTokenType_1.ELingTokenType.OPEN_CBRACKET)) {
            console.log("def statement");
            this.parseWithStatement(parser);
        }
        else
            parser.throwError("Unexpected format for definitions");
    }
    parseLangs(parser) {
        while (StatementHelper_1.StatementHelper.Lang.isValidLanguageFormat(parser)) {
            console.log("lang loop");
            const errorStart = parser.currentToken.position;
            const lang = parser.peek(0).keyword + "-" + parser.peek(2).keyword;
            parser.next(3);
            if (parser.langs.includes(lang)) {
                parser.throwError(`Unexpected repeating of lang "${lang}"`, errorStart, errorStart + lang.length);
            }
            else
                parser.langs.push(lang);
            if (parser.match(ELingTokenType_1.ELingTokenType.COMMA)) {
                parser.next();
                continue;
            }
        }
    }
    parseWithKey(parser) {
        const id = parser.currentToken.keyword;
        if (parser.match(ELingTokenType_1.ELingTokenType.EQUAL, 1)) {
            parser.next(2);
            if (id == "langs") {
                this.parseLangs(parser);
                return;
            }
            if (id == "encoding") {
                return;
            }
            return parser.throwError(`Unexpected key "${id}" of definition. Did you mean "langs" or "encoding"?`);
        }
        else {
            if (id != "unexpected") {
                parser.throwError(`Expected unexpected function`);
            }
            if (!StatementHelper_1.StatementHelper.isFunction(parser)) {
                parser.throwError(`Expected function`);
                return;
            }
            new LingFunction_1.LingFunctionExpression().parse(parser);
        }
    }
    parseWithStatement(parser) {
        parser.next();
        if (!parser.match(ELingTokenType_1.ELingTokenType.IDENTIFIER)) {
            parser.throwError(`Unexpected "${parser.currentToken}"`);
        }
        while (true) {
            if (!LingDefineExpression_1.settingList.includes(parser.currentToken.keyword)) {
                break;
            }
            if (parser.currentToken.keyword == "langs") {
                parser.next(2); //langs = 
                this.parseLangs(parser);
            }
            if (parser.currentToken.keyword == "encoding") {
                parser.next(2); //encoding =
                if (!parser.match(ELingTokenType_1.ELingTokenType.STRING)) {
                    parser.throwError("Excepted string literal for encoding definition");
                }
                parser.next();
            }
            if (StatementHelper_1.StatementHelper.isFunction(parser)) {
                if (parser.currentToken.keyword != "unexpected") {
                    parser.throwError(`Unexpected method expected, but got "${parser.currentToken.keyword}"`);
                }
                else {
                    new LingFunction_1.LingFunctionExpression().parse(parser);
                }
            }
        }
        if (!parser.match(ELingTokenType_1.ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected closing bracket, but got "${parser.currentToken.keyword}"`);
        }
    }
    static find(parser) {
        return parser.match(ELingTokenType_1.ELingTokenType.DEFINE);
    }
};
LingDefineExpression.settingList = ["langs", "encoding", "unexpected"];
LingDefineExpression = LingDefineExpression_1 = __decorate([
    ExpressionStatement_1.default
], LingDefineExpression);
exports.default = LingDefineExpression;
//# sourceMappingURL=LingDefineExpression.js.map