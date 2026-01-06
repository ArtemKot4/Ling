import { LingParser } from "./LingParser";
import { ArithmeticExpression } from "./expressions/ArithmeticExpression";
import { IJSLingFunction, LingFunction } from "./expressions/LingFunction";

interface IPackageFunction<FunctionType extends IJSLingFunction | LingFunction = LingFunction> {
    default?: FunctionType,
    [lang: string]: FunctionType
}

export interface ILingPackage {
    functions?: {
        unexpected?: IPackageFunction,
        [functionName: string]: IPackageFunction<IJSLingFunction | LingFunction>
    },
    translations: {
        [lang: string]: {
            [translationName: string]: string | ArithmeticExpression
        }
    }
}

export type LingFunctionArgumentType = string | boolean | number;
export type LingFunctionReturnTypes = string | boolean | number;

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

export namespace LingManager {
    export const packages: Record<string, ILingPackage> = {};
    export let currentLang: string = "en-US";

    export function setUserLang(lang: string) {
        this.currentLang = lang;
    }

    export function findNearestPackBy(packageName: string, predicate: (lingPackage: ILingPackage,name: string) => boolean): ILingPackage | null {
        const packagePath = packageName.split(".");
        while(packagePath.length > 0) {
            const buildedPackageName = packagePath.join(".");
            if(buildedPackageName in packages && predicate(packages[buildedPackageName], buildedPackageName) == true) {
                return packages[buildedPackageName];
            }
            packagePath.pop(); 
        }
        console.log(`LingManager: package "${packageName}" does not exists`);
        return null;
    }

    export function getPackage(packageName: string): ILingPackage {
        return packages[packageName];
    }

    export function getCommonPackage(): ILingPackage {
        return packages["common"]
    }

    export function createPackage(packageName: string): ILingPackage {
        return packages[packageName] ??= {
            translations: {}
        }
    }

    export function callFunction(packageName: string, key: string, args: LingFunctionArgumentType[], lang: string = currentLang): LingFunctionArgumentType {
        const lingFunctions = LingManager.getPackage(packageName)?.functions || {};
        const lingFunction = lingFunctions?.[lang][key] || lingFunctions?.[lang]["default"];
        
        if(lingFunction == null) {
            return "Unknown call: " + key;
        } 
        if(typeof lingFunction == "function") {
            return lingFunction(...args);
        }
        return lingFunction.call(args);
    }

    export function getTranslation(packageName: string, key: string, lang: string = currentLang): string {
        const lingPackage = getPackage(packageName);
        const translation = lingPackage?.translations[lang][key];

        if(lingPackage == null || translation == null) {
            const functions = findNearestPackBy(packageName, (lingPackage) => "unexpected" in lingPackage.functions)?.functions;
            const unexpected = functions.unexpected[lang] || functions.unexpected.default;
            return unexpected != null ? unexpected.call([key]) : "Unknown key: " + key;
        }
        return (translation as ArithmeticExpression)?.calculate();
    }

    export function getFunction(packageName: string, functionName: string, lang: string): IJSLingFunction<string> | LingFunction {
        return getPackage(packageName)?.functions?.[lang]?.[functionName];
    }

    export function hasFunction(packageName: string, functionName: string, lang: string): boolean {
        return getFunction(packageName, functionName, lang) != null;
    }
    
    export function getLangsFor(packageName: string): string[] {
        const langs = [];
        const lingPackage = LingManager.getPackage(packageName);
        if(lingPackage == null) {
            return langs;
        }
        return Object.keys(lingPackage.translations || LingManager.getPackage("common").translations);
    }

    export function hasLang(packageName: string, lang: string): boolean {
        const lingPackage = LingManager.getPackage(packageName);
        if(lingPackage == null) {
            console.log("debug: package " + packageName + " not defined")
        }
        return lang in (lingPackage.translations || LingManager.getCommonPackage().translations);
    }

    export function applyLangs(parser: LingParser, packageName: string, langs: string[]): void {
        const lingPackage = LingManager.getPackage(packageName);

        if(lingPackage == null) {
            parser.throwError(`Cannot apply languages: " + langs + " for undefined package "${packageName}"`)
        }
        for(const i in langs) {
            //console.log(lang);
            lingPackage.translations[langs[i]] ??= {};
        }
    }

    export function clearLangs(parser: LingParser, packageName: string, langs?: string[]): void {
        const lingPackage = LingManager.getPackage(packageName);

        if(lingPackage == null) {
            parser.throwError(`Cannot clear languages: " + langs + " for undefined package "${packageName}"`)
        }
        for(const lang of (langs != null ? langs : Object.keys(lingPackage.translations))) {
            delete lingPackage.translations[lang], lingPackage.functions?.[lang];
        }
    }

    createPackage("common");
}