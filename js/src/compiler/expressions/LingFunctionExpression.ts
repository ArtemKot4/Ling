import { ELingTokenType } from "../ELingTokenType";
import { LingManager } from "../../package_manager/LingManager";
import { LingParser } from "../LingParser";
import { StatementHelper } from "../StatementHelper";
import { ExpressionParser, ExpressionValue, IBinaryOperationNode } from "./ExpressionParser";
import ExpressionStatement from "./ExpressionStatement";
import LingExpression from "./LingExpression";
import { LingFunctionReturnTypes, LingFunctionArgumentType } from "../../types";
import { ExpressionExecutor } from "../../runtime/ExpressionExecutor";
import { LingToken } from "../LingToken";

export interface IArgumentDescription {
    type: ELingTokenType, value: string | IBinaryOperationNode
}

export interface IMatchNode {
    expression: ExpressionValue,
    returnType: ExpressionValue,
    matches: IMatchNode[]
}

export interface ILingFunctionNode {
    args: Record<string, IArgumentDescription>;
    matches?: IMatchNode[];
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
    public matches?: IMatchNode[] = [];
    public returnType: ExpressionValue; 

    public nameTokenIndex: number;

    public constructor(ast?: ILingFunctionNode) {
        super();
        if(ast != null) {
            this.args = ast.args;
            this.returnType = ast.returnType;
        }
    }

    public override parse(parser: LingParser, packageName: string): void {
        StatementHelper.applyModifiers(parser, this);
        if(parser.currentToken.keyword.includes(".")) {
            [this.packageName, this.name] = StatementHelper.getPackageAndKeyName(parser.currentToken.keyword);
        } else {
            this.packageName = packageName || "common", this.name = parser.currentToken.keyword;
        }
        this.nameTokenIndex = parser.tokenIndex;
        parser.next(); //name
        //console.log(`name: ${this.packageName}${this.name}, override: ${this.override}, runtime: ${this.runtime}`)

        if(parser.match(ELingTokenType.COLON)) {
            parser.next(1); //:
            const lang = StatementHelper.Lang.buildLanguage(parser);
            if(lang == null) {
                parser.throwError({ message: `Expected language for function overload of "${this.name}"`, packageName: this.packageName});
            }
            this.lang = lang;
        }
        this.parseArguments(parser);
        if(!parser.match(ELingTokenType.OPEN_CBRACKET)) {
            parser.throwError({ message: `Expected "{"` });
        }
        if(parser.match(ELingTokenType.CLOSE_CBRACKET, 1)) {
            parser.throwError({ message: `Function "${this.name}" must return expression`, packageName: this.packageName });
        }
        this.parseBody(parser);       
        parser.next();
    }

    public override apply(parser: LingParser): void {
        const lingPackage = LingManager.getPackage(this.packageName);
        if(lingPackage == null) {
            parser.throwError({ message: `Cannot create function for undefined package "${this.packageName}"` })
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
            if(parser.match(ELingTokenType.MATCH)) {
                this.parseMatch(parser);
                continue;
            }
            tokens.push(token);
            token = parser.next();
            //console.log(ELingTokenType.getPrintTypeName(token.type));
        }
        this.returnType = new ExpressionParser(tokens).parse();
        if(!parser.match(ELingTokenType.CLOSE_CBRACKET)) {
            parser.throwError({ message: `Expected "}"` });
        }
    }

    public parseMatch(parser: LingParser): IMatchNode {
        parser.next();
        let expectEnd: ELingTokenType;
        if(parser.match(ELingTokenType.OPEN_RBRACKET)) {
            parser.next();
            expectEnd = ELingTokenType.CLOSE_RBRACKET;
        } else expectEnd = ELingTokenType.COLON;

        if(
            !StatementHelper.isValue(parser.currentToken.type) && 
            !StatementHelper.isBoolOperator(parser.currentToken.type) && 
            !StatementHelper.isMathOperator(parser.currentToken.type)
        ) {
            parser.throwError({ message: "Expected value for expression inside match block", packageName: this.packageName });
        }
        let tokens = [parser.currentToken];

        while(parser.currentToken != null) {
            if(parser.match(expectEnd)) {
                parser.next();
                break;
            }
            tokens.push(parser.next());
        }
        return null;
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
            parser.throwError({ message: `Expected "("` });
        }
        parser.next(1) //(
        while(true) {
            if(parser.currentToken.type == ELingTokenType.IDENTIFIER) {
                const argName = parser.currentToken.keyword;
                if(argName in this.args) {
                    parser.throwError({ message: `Cannot use repeating name for new argument in one function`, reason: `argument by name "${argName}" already defined`, packageName: this.packageName });
                }
                let value = null;
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
                parser.throwError({message: `Unexpected "${ parser.currentToken.keyword }"`})
            }
        }
        if(!parser.match(ELingTokenType.CLOSE_RBRACKET)) {
            parser.throwError({ message: `Expected ")"` });
        } 
        parser.next(); //)
    }

    public checkSignature(parser: LingParser): void {
        const token = parser.get(this.nameTokenIndex);
        const defaultFunction = LingManager.getFunction<ILingFunctionNode>(this.packageName, this.name, "default");
        
        if(defaultFunction != null) {
            const defaultArgs = Object.keys(defaultFunction.args);
            const args = Object.keys(this.args);

            if(args.length != defaultArgs.length) {
                parser.throwWarning(`Not recommended to create function overloads of "${this.name}" for lang "${this.lang}" at package "${this.packageName}" where ${
                    "count of arguments " + (args.length < defaultArgs.length ? "smaller" : "bigger") + " than default" 
                }`);
            }
        }
        if(this.lang != null && LingManager.hasLang(this.packageName, this.lang) == false) {
            parser.throwError({ message: `Cannot register function for not defined lang`, reason: `lang "${this.lang}" not defined`, ...parser.get(this.nameTokenIndex + 2), keyword: this.lang, packageName: this.packageName })
        }
        if(LingManager.hasFunction(this.packageName, this.name, this.lang) == true && this.override == null) {
            parser.throwError({ message: `Unexpected repeating of function. You wanted to use override?`, reason: `some function for lang "${this.lang}" already defined`, ...token, packageName: this.packageName });
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