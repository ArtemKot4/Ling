import { ELingTokenType } from "../ELingTokenType";
import { LingManager } from "../../package_manager/LingManager";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ArithmeticExpression, IBinaryOperationNode } from "./ArithmeticExpression";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingPackageExpression } from "./LingPackageExpression";
import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { IProcessingExpression } from "./IProcessingExpression";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface ILingFunctionNode {
    args: Record<string, IArgumentDescription>;
    returnType: ArithmeticExpression;
}

export interface IJSLingFunction<LingReturnType extends LingFunctionReturnTypes = string> {
    (...args: unknown[]): LingReturnType
}

@ExpressionStatement
export class LingFunctionExpression extends LingExpression {
    public name: string;
    public lang!: string;
    public args: Record<string, IArgumentDescription> = {};
    public returnType: IProcessingExpression; 

    public constructor(ast?: ILingFunctionNode) {
        super();
        if(ast != null) {
            this.args = ast.args;
            this.returnType = ast.returnType;
        }
    }

    public override parse(parser: LingParser, packageName: string = "common"): void {
        this.name = parser.currentToken.keyword;

        if(parser.match(ELingTokenType.COLON, 1)) {
            parser.next(2);
            const lang = StatementHelper.Lang.buildLanguage(parser);
            if(lang == null) {
                parser.throwError(`Expected language for function overload of "${this.name}"`);
            }
            this.lang = lang;
            parser.next(1);
        } else {
            parser.next(2);
        }
        this.parseArguments(parser);

        parser.next();
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError(`Expected "{"`);
        }
        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError(`Function "${this.name}" must return expression`);
        }
        
        this.parseBody(parser);

        //this.returnType.push(new ArithmeticExpression().parse(parser));

        //this.returnType = new ArithmeticExpression().parse(parser, (p) => p.match(ELingTokenType.CLOSE_CBRACKET), this.args);
        
        parser.next();
    }

    public parseBody(parser: LingParser): void {
        while(parser.currentToken != null) {
            const token = parser.next();
            if(parser.match(ELingTokenType.CLOSE_CBRACKET)) {
                break;
            }
            //console.log(ELingTokenType.getPrintTypeName(token.type));
            this.returnType = new ArithmeticExpression();//this.returnType.push(token); //waiting arithmetic expression
        }
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError(`Expected "}"`);
        }
    }

    public parseArguments(parser: LingParser): void {
        while(parser.currentToken && parser.currentToken.type != ELingTokenType.CLOSE_RBRACKET) {
            if(parser.currentToken.type == ELingTokenType.IDENTIFIER) {
                let value = null;
                let skip = 1;
                if(parser.match(ELingTokenType.IDENTIFIER) && parser.match(ELingTokenType.EQUAL, 1)) {
                    value = parser.peek(2).keyword; //need do parse expressions
                    skip = 3;
                }
                this.args[parser.currentToken.keyword] = { type: parser.currentToken.type, value: value };
                parser.next(skip);
            }
            if(parser.currentToken.type == ELingTokenType.COMMA) {
                parser.next();
            }
        }
        if(!parser.match(ELingTokenType.CLOSE_RBRACKET)) {
            parser.throwError(`Expected ")"`);
        } 
    }

    public override apply(parser: LingParser, packageName: string = "common"): void {
        const lingPackage = LingManager.getPackage(packageName);
        if(lingPackage == null) {
            parser.throwError(`Cannot create function for undefined package "${packageName}"`)
        }
        this.checkSignature(parser, packageName);

        const lingFunctions = lingPackage.functions ??= {};
        const currentFunction = lingFunctions[this.lang || "default"] ??= {};
        const name = this.name;
        
        delete this.name, this.lang;
        currentFunction[name] = this;
    }

    public checkSignature(parser: LingParser, packageName: string): void {
        const defaultFunction = LingManager.getFunction(packageName, this.name, "default");
        if(defaultFunction != null) {
            const defaultArgs = Object.keys(defaultFunction);
            const args = Object.keys(this.args);

            if(args.length != defaultArgs.length) {
                parser.throwWarning(`Not recommended to create function overloads of "${this.name}" for lang "${this.lang}" at pack "${packageName}" with signatures that differ from the default signature: ${
                    "count of arguments " + (args.length < defaultArgs.length ? "smaller" : "bigger") + " than default" 
                }`);
            }
        }
        if(this.lang != null && LingManager.hasLang(packageName, this.lang) == false) {
            parser.throwError(`Cannot register function "${this.name}" for not defined lang "${this.lang}"`)
        }
        if(LingManager.hasFunction(packageName, this.name, this.lang) == true) {
            parser.throwError(`Unexpected repeating of function "${this.name}" with lang "${this.lang}" at package "${packageName}"`);
        }
    }

    public call(args?: LingFunctionArgumentType[]): ReturnType<IJSLingFunction> {
        return this.returnType.calculate(args);
    }

    public static find(parser: LingParser): boolean {
        return StatementHelper.isFunction(parser);
    }
}