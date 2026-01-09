import { LingParser } from "../compiler/LingParser";
import { IJSLingFunction, ILingFunctionNode, LingFunctionExpression } from "../compiler/expressions/LingFunctionExpression";
import { ILingPackage, LingFunctionArgumentType } from "../types";

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
        try {
            const lingPackage = LingManager.getPackage(packageName);
            if(lingPackage == null) {
                console.warn(`Unknown package "${packageName}"`);
                return `Unknown package "${packageName}" for call "${key}"`;
            }
            const langFunctions = lingPackage.functions?.[lang];
            const defaultFunctions = lingPackage.functions?.default;
            const lingFunction = langFunctions?.[key] ?? defaultFunctions?.[key];
            
            if(lingFunction == null) {
                console.warn(`Unknown lang "${lang}" for function call "${packageName}"`);
                return "Unknown call: " + key;
            } 
            if(typeof lingFunction == "function") {
                return lingFunction(...args);
            }
            return new LingFunctionExpression(lingFunction).call(args);
        } catch (error) {
            return error;
        }
    }

    export function getTranslation(packageName: string, key: string, lang: string = currentLang): string {
        const lingPackage = getPackage(packageName);
        const translation = lingPackage?.translations[lang][key];

        if(lingPackage == null || translation == null) {
            const functions = findNearestPackBy(packageName, (lingPackage) => "unexpected" in lingPackage.functions)?.functions;
            const unexpected = functions.unexpected[lang] || functions.unexpected.default;
            return unexpected != null ? new LingFunctionExpression(unexpected as ILingFunctionNode).call([key]) as string : "Unknown key: " + key;
        }
        return translation; //будем вычислять выражения на этапе компиляции
    }

    export function getFunction<FunctionFormat extends ILingFunctionNode | IJSLingFunction = ILingFunctionNode>(packageName: string, functionName: string, lang: string = "default"): FunctionFormat {
        return getPackage(packageName)?.functions?.[lang]?.[functionName] as FunctionFormat;
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
        return lang in (lingPackage.translations || LingManager.getCommonPackage().translations);
    }

    export function applyLangs(parser: LingParser, packageName: string, langs: string[]): void {
        const lingPackage = LingManager.getPackage(packageName);

        if(lingPackage == null) {
            parser.throwError(`Cannot apply languages: " + langs + " for undefined package "${packageName}"`)
        }
        for(const lang of langs) {
            lingPackage.translations[lang] ??= {};
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