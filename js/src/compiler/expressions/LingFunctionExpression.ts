import { ELingTokenType } from "../ELingTokenType";
import { LingManager } from "../../package_manager/LingManager";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ExpressionParser, ExpressionValue, IBinaryOperationNode } from "./ExpressionParser";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { ExpressionExecutor } from "../../runtime/ExpressionExecutor";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface ILingFunctionNode {
    args: Record<string, IArgumentDescription>;
    returnType: ExpressionValue;
}

export interface IJSLingFunction<LingReturnType extends LingFunctionReturnTypes = string> {
    (...args: unknown[]): LingReturnType
}

@ExpressionStatement
export class LingFunctionExpression extends LingExpression implements ILingFunctionNode {
    public name: string;
    public packageName: string;
    public lang!: string;
    public args: Record<string, IArgumentDescription> = {};
    public returnType: ExpressionValue; 
    public override?: boolean;

    public constructor(ast?: ILingFunctionNode) {
        super();
        if(ast != null) {
            this.args = ast.args;
            this.returnType = ast.returnType;
        }
    }

    public override parse(parser: LingParser, packageName: string): void {
        if(parser.match(ELingTokenType.OVERRIDE)) {
            this.override = true;
            parser.next();
        }
        if(parser.currentToken.keyword.includes(".")) {
            [this.packageName, this.name] = StatementHelper.getPackageAndKeyName(parser.currentToken.keyword);
        } else {
            this.packageName = packageName || "common", this.name = parser.currentToken.keyword;
        }
        parser.next(); //name

        if(parser.match(ELingTokenType.COLON)) {
            parser.next(1); //:
            const lang = StatementHelper.Lang.buildLanguage(parser);
            if(lang == null) {
                parser.throwError(`Expected language for function overload of "${this.name}" at package "${this.packageName}"`);
            }
            this.lang = lang;
        }
        this.parseArguments(parser);
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{"`);
        }
        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError(`Function "${this.name}" at package "${this.packageName}" must return expression`);
        }
        this.parseBody(parser);       
        parser.next();
    }

    public override apply(parser: LingParser): void {
        const lingPackage = LingManager.getPackage(this.packageName);
        if(lingPackage == null) {
            parser.throwError(`Cannot create function for undefined package "${this.packageName}"`)
        }
        this.checkSignature(parser);

        const lingFunctions = lingPackage.functions ??= {};
        const currentFunction = lingFunctions[this.lang || "default"] ??= {};
        const name = this.name;
        
        currentFunction[name] = {
            args: this.args,
            returnType: this.returnType
        };
    }

    public parseBody(parser: LingParser): void {
        let token = parser.next();
        const tokens = [];

        while(parser.currentToken != null) {
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                break;
            }
            tokens.push(token);
            token = parser.next();
            //console.log(ELingTokenType.getPrintTypeName(token.type));
        }
        this.returnType = new ExpressionParser(tokens).parse();
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected "}"`);
        }
    }

    public buildArgumentExpression(parser: LingParser): ExpressionValue | null {
        let tokens = [];
        do {
            tokens.push(parser.next());
        } while (parser.currentToken != null && (!parser.match(ELingTokenType.COMMA) && !parser.match(ELingTokenType.CLOSE_RBRACKET)));
        return new ExpressionParser(tokens).parse();
    }

    public parseArguments(parser: LingParser): void {
        if(!parser.match(ELingTokenType.OPEN_RBRACKET)) {
            parser.throwError(`Expected "("`);
        }
        parser.next(1) //(
        while(true) {
            if(parser.currentToken.type == ELingTokenType.IDENTIFIER) {
                let value = null;
                const argName = parser.currentToken.keyword;
                parser.next(1);

                if(parser.match(ELingTokenType.EQUAL)) {
                    value = this.buildArgumentExpression(parser);
                }
                this.args[argName] = value;
            }
            if(parser.currentToken.type == ELingTokenType.COMMA) {
                parser.next(); //,
            }
            else if(parser.currentToken.type == ELingTokenType.CLOSE_RBRACKET) {
                break;
            } else {
                parser.throwError(`Unexpected "${parser.currentToken.keyword}"`)
            }
        }
        if(!parser.match(ELingTokenType.CLOSE_RBRACKET)) {
            parser.throwError(`Expected ")"`);
        } 
        parser.next(); //)
    }

    public checkSignature(parser: LingParser): void {
        const defaultFunction = LingManager.getFunction<ILingFunctionNode>(this.packageName, this.name, "default");
        if(defaultFunction != null) {
            const defaultArgs = Object.keys(defaultFunction.args);
            const args = Object.keys(this.args);

            if(args.length != defaultArgs.length) {
                parser.throwWarning(`Not recommended to create function overloads of "${this.name}" for lang "${this.lang}" at package "${this.packageName}" with signatures that differ from the default signature: ${
                    "count of arguments " + (args.length < defaultArgs.length ? "smaller" : "bigger") + " than default" 
                }`);
            }
        }
        if(this.lang != null && LingManager.hasLang(this.packageName, this.lang) == false) {
            parser.throwError(`Cannot register function "${this.name}" for not defined lang "${this.lang}"`)
        }
        if(LingManager.hasFunction(this.packageName, this.name, this.lang) == true && this.override == null) {
            parser.throwError(`Unexpected repeating of function "${this.name}" with lang "${this.lang}" at package "${this.packageName}"`);
        }
    }

    public call(args?: LingFunctionArgumentType[]): LingFunctionReturnTypes {
        const argsKeys = Object.keys(this.args);
        const namedArgs = args.reduce((pV, cV, cI) => {
            pV[argsKeys[cI]] = cV;
            return pV;
        }, {});
        return new ExpressionExecutor(this.returnType, namedArgs).calculate();
    }

    public static find(parser: LingParser): boolean {
        return StatementHelper.isFunction(parser);
    }
}