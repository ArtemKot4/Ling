import { ELingTokenType } from "./ELingTokenType";

export default class LingToken {
    public keyword: string;
    public constructor(public line: number, public position: number, public type: ELingTokenType, keyword: null | string = null) {
        if(keyword != null) {
            this.keyword = keyword;
        }
    }
}