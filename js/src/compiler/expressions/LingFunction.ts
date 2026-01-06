import { ELingTokenType } from "../ELingTokenType";
import { ILingPackage, LingFunctionArgumentType, LingManager } from "../LingLocalization";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ArithmeticExpression, IBinaryOperationNode } from "./ArithmeticExpression";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingPackageExpression } from "./LingPackageExpression";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface ILingFunctionNode {
    lang?: string;
    args: Record<string, IArgumentDescription>;
    returnType: ArithmeticExpression;
}

export interface IJSLingFunction<LingReturnType extends string | boolean = string> {
    (...args: unknown[]): LingReturnType
}

@ExpressionStatement
export class LingFunction extends LingExpression {
    public name: string;
    public lang!: string;
    public args: Record<string, IArgumentDescription> = {};
    public returnType: ArithmeticExpression; 

    public override parse(parser: LingParser, packageName: string = "common"): void {
        this.name = parser.currentToken.keyword;

        if(parser.match(ELingTokenType.COLON, 1)) {
            parser.next(2);
            StatementHelper.Lang.satisfiesLanguageFormat(parser);
            const lang = parser.slice(0, 3, (i, token) => token.keyword).join("-");
            this.lang = lang;
            parser.next(4);
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
        currentFunction[this.name] = this;
        delete this.name, this.lang;
    }

    public checkSignature(parser: LingParser, packageName: string): void {
        const defaultFunction = LingManager.getFunction(packageName, this.name, "default");
        if(defaultFunction != null) {
            const defaultArgs = Object.keys(defaultFunction);
            const args = Object.keys(this.args);

            if(args.length != defaultArgs.length) {
                parser.throwWarning(`Not recommended to create function overloads of "${this.name}" for lang "${this.lang}" at pack "${packageName}" with signatures that differ from the default signature: ${
                    "count of arguments " + (args < defaultArgs ? "smaller" : "bigger") + " than default" 
                }`);
            }
        }
        if(this.lang != null && LingManager.hasLang(packageName, this.lang) == false) {
            console.log(LingManager.getLangsFor(packageName));
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