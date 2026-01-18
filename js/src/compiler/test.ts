import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingParser } from "./LingParser";

import "./expressions/LingDefineExpression";
import "./expressions/LingPackageExpression"; 
import "./expressions/LingTranslationExpression";
import "./expressions/LingFunctionExpression";
import { ELingTokenType } from "./ELingTokenType";
import { LingManager } from "../package_manager/LingManager";

const text = require("fs").readFileSync("js/src/syntax_check.ling").toString()
const l = new LingLexicalAnalyzer(text, "syntax_check.ling");
l.tokenize();
// ELingTokenType.printTokens(l, 0, 15);
const p = new LingParser(l);
p.parse();
console.log(JSON.stringify(LingManager.packages));
