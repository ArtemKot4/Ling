import LingLexicalAnalyzer from "./LingLexicalAnalyzer";
import { LingParser } from "./LingParser";

import "./expressions/LingDefineExpression";
import "./expressions/LingPackageExpression"; 
import "./expressions/LingTranslationExpression";
import "./expressions/LingFunction";
import { ELingTokenType } from "./ELingTokenType";

const text = require("fs").readFileSync("js/src/syntax_check.ling").toString()
const l = new LingLexicalAnalyzer(text);
l.tokenize();
//ELingTokenType.printTokens(l, 0, 8);
const p = new LingParser(l);
p.parse();
console.log(JSON.stringify(LingParser.packets))
console.log(JSON.stringify(p.settings));