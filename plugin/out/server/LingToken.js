"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LingToken {
    constructor(line, position, type, keyword = null) {
        this.line = line;
        this.position = position;
        this.type = type;
        if (keyword != null) {
            this.keyword = keyword;
        }
    }
}
exports.default = LingToken;
//# sourceMappingURL=LingToken.js.map