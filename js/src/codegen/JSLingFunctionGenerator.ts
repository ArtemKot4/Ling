import { ILingFunctionNode, LingFunctionExpression } from "../compiler/expressions/LingFunctionExpression";

class JSLingFunctionGenerator {
    public text: string = "";
    public constructor(public ast: LingFunctionExpression) {
        this.text += `function ${ast.name}`;
        this.generateArguments();
        this.generateBody();
        console.log(this.text);
    }

    public generateArguments(): void {
        this.text += `(${
            Object.keys(this.ast.args).join(", ")
        })`;
    }

    public generateBody(): void {
        this.text += " {";

        this.text += "}";
    }
}

const lfe = new LingFunctionExpression({"args":{
    "a": null,
    "b": null,
    "c": null
},"returnType":{"type":"string","value":"a"}});
lfe.name = "test";

new JSLingFunctionGenerator(lfe);