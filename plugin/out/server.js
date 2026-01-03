"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const connection = (0, node_1.createConnection)();
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const documentFunctions = new Map();
connection.onInitialize(() => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            hoverProvider: true,
            completionProvider: {
                triggerCharacters: ['.', '(']
            }
        }
    };
    return result;
});
// === ПАРСИМ ФУНКЦИИ ===
function parseFunctions(document) {
    const functions = [];
    const text = document.getText();
    const lines = text.split('\n');
    let currentPackage = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Ищем package
        const packageMatch = line.match(/package\s+([\w.]+)\s*\{/);
        if (packageMatch) {
            currentPackage = packageMatch[1];
            continue;
        }
        // Ищем функции вида: name(params) {
        const funcMatch = line.match(/(\w+)\s*\(([^)]*)\)\s*\{/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const params = funcMatch[2]
                .split(',')
                .map(p => p.trim())
                .filter(p => p && p !== '');
            // Ищем документацию
            let documentation = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const commentLine = lines[j].trim();
                if (commentLine.startsWith('//')) {
                    documentation = commentLine.substring(2).trim() + '\n' + documentation;
                }
                else if (commentLine.startsWith('/*')) {
                    const commentEnd = commentLine.indexOf('*/');
                    if (commentEnd !== -1) {
                        documentation = commentLine.substring(2, commentEnd).trim();
                    }
                    break;
                }
                else if (commentLine === '') {
                    continue;
                }
                else {
                    break;
                }
            }
            functions.push({
                name: funcName,
                params,
                package: currentPackage || undefined,
                line: i,
                documentation: documentation || undefined
            });
        }
    }
    return functions;
}
// === ВАЛИДАЦИЯ ===
function validateDocument(document) {
    const diagnostics = [];
    const text = document.getText();
    const allLangs = new Set();
    // Парсим функции
    const functions = parseFunctions(document);
    documentFunctions.set(document.uri, functions);
    // Проверяем языки
    const langRegex = /define\s+langs\s*=\s*([^\n;]+)/g;
    let match;
    while ((match = langRegex.exec(text)) !== null) {
        const langsString = match[1].split('//')[0].trim();
        const langs = langsString.split(',').map(l => l.trim()).filter(l => l);
        const seenInLine = new Set();
        langs.forEach(lang => {
            if (!/^[a-z]{2}-[A-Z]{2,3}$/.test(lang))
                return;
            const langPos = match.index + match[0].indexOf(lang);
            if (langPos < match.index)
                return;
            const start = document.positionAt(langPos);
            const end = document.positionAt(langPos + lang.length);
            if (seenInLine.has(lang)) {
                diagnostics.push({
                    range: { start, end },
                    severity: node_1.DiagnosticSeverity.Warning,
                    message: `Язык "${lang}" повторяется`,
                    source: 'ling'
                });
            }
            seenInLine.add(lang);
            if (allLangs.has(lang)) {
                diagnostics.push({
                    range: { start, end },
                    severity: node_1.DiagnosticSeverity.Warning,
                    message: `Язык "${lang}" уже объявлен`,
                    source: 'ling'
                });
            }
            allLangs.add(lang);
        });
    }
    return diagnostics;
}
// === СОБЫТИЯ ===
documents.onDidOpen(event => {
    const diagnostics = validateDocument(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
});
documents.onDidChangeContent(event => {
    const diagnostics = validateDocument(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
});
documents.onDidSave(event => {
    const diagnostics = validateDocument(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
});
// === АВТОДОПОЛНЕНИЕ ===
connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document)
        return [];
    const functions = documentFunctions.get(params.textDocument.uri) || [];
    const items = [];
    // Ключевые слова
    const keywords = [
        { label: 'define', kind: node_1.CompletionItemKind.Keyword },
        { label: 'package', kind: node_1.CompletionItemKind.Module },
        { label: 'langs', kind: node_1.CompletionItemKind.Property },
        { label: 'match', kind: node_1.CompletionItemKind.Keyword },
        { label: 'true', kind: node_1.CompletionItemKind.Value },
        { label: 'false', kind: node_1.CompletionItemKind.Value }
    ];
    keywords.forEach(keyword => {
        items.push({
            label: keyword.label,
            kind: keyword.kind
        });
    });
    // Функции
    functions.forEach(func => {
        const item = node_1.CompletionItem.create(func.name);
        item.detail = `${func.name}(${func.params.join(', ')})`;
        if (func.documentation) {
            item.documentation = {
                kind: node_1.MarkupKind.Markdown,
                value: func.documentation
            };
        }
        items.push(item);
    });
    return items;
});
// === ПОДСКАЗКИ С ПОДСВЕТКОЙ СИНТАКСИСА ===
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document)
        return null;
    const offset = document.offsetAt(params.position);
    const text = document.getText();
    // Получаем слово под курсором
    let start = offset;
    let end = offset;
    while (start > 0 && /[\w.]/.test(text[start - 1]))
        start--;
    while (end < text.length && /[\w.]/.test(text[end]))
        end++;
    const word = text.substring(start, end);
    // Для языков
    if (/^[a-z]{2}-[A-Z]{2,3}$/.test(word)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: `**Язык локализации:** \`${word}\``
            }
        };
    }
    // Ищем функцию
    const functions = documentFunctions.get(params.textDocument.uri) || [];
    // Проверяем, может быть это вызов функции с пакетом (math.add)
    const dotIndex = word.lastIndexOf('.');
    if (dotIndex !== -1) {
        const packageName = word.substring(0, dotIndex);
        const functionName = word.substring(dotIndex + 1);
        const func = functions.find(f => f.name === functionName && f.package === packageName);
        if (func) {
            return createFunctionHover(func, packageName);
        }
    }
    // Проверяем простое имя функции
    const func = functions.find(f => f.name === word);
    if (func) {
        return createFunctionHover(func);
    }
    return null;
});
// === ФУНКЦИЯ ДЛЯ СОЗДАНИЯ HOVER С ПОДСВЕТКОЙ ===
function createFunctionHover(func, packageName) {
    // Создаем подсвеченный код функции
    const functionSignature = packageName
        ? `${packageName}.${func.name}(${func.params.join(', ')})`
        : `${func.name}(${func.params.join(', ')})`;
    // Markdown с блоком кода ling для подсветки
    const markdown = {
        kind: node_1.MarkupKind.Markdown,
        value: ''
    };
    // Добавляем подсвеченный код
    markdown.value += '```ling\n';
    markdown.value += functionSignature;
    markdown.value += '\n```\n\n';
    // Добавляем документацию если есть
    if (func.documentation) {
        markdown.value += `${func.documentation}\n\n`;
    }
    // Добавляем информацию о параметрах
    if (func.params.length > 0) {
        markdown.value += '**Параметры:**\n';
        func.params.forEach((param, index) => {
            markdown.value += `${index + 1}. \`${param}\`\n`;
        });
        markdown.value += '\n';
    }
    else {
        markdown.value += '**Параметры:** нет\n\n';
    }
    // Информация о пакете
    if (func.package) {
        markdown.value += `**Пакет:** \`${func.package}\`\n`;
    }
    return {
        contents: markdown
    };
}
// Запускаем сервер
documents.listen(connection);
connection.listen();
console.log('🔧 Ling Language Server started');
//# sourceMappingURL=server.js.map