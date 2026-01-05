import { 
    createConnection, 
    TextDocuments, 
    Diagnostic, 
    DiagnosticSeverity, 
    CompletionItem, 
    CompletionItemKind, 
    Hover, 
    InitializeResult, 
    TextDocumentSyncKind,
    MarkupKind,
    MarkupContent
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import "./server/expressions/LingDefineExpression";
import "./server/expressions/LingPackageExpression";
import "./server/expressions/LingFunction";

import SimpleLSPParser from './server/SimpleLSPParser';

const connection = createConnection();
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            hoverProvider: true,
            completionProvider: {
                triggerCharacters: ['.', '(']
            }
        }
    };
    return result;
});

function validateDocument(document: TextDocument): Diagnostic[] {
    const parser = new SimpleLSPParser(document);
    parser.parse();
    console.log(`Найдено ${parser.diagnostics.length} диагностик`);
    return parser.diagnostics;
}

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

connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];
    
    // const functions = functions.get(params.textDocument.uri) || [];
    // const items: CompletionItem[] = [];
    
    // // Ключевые слова
    // const keywords = [
    //     { label: 'define', kind: CompletionItemKind.Keyword },
    //     { label: 'package', kind: CompletionItemKind.Module },
    //     { label: 'langs', kind: CompletionItemKind.Property },
    //     { label: 'match', kind: CompletionItemKind.Keyword },
    //     { label: 'true', kind: CompletionItemKind.Value },
    //     { label: 'false', kind: CompletionItemKind.Value }
    // ];
    
    // keywords.forEach(keyword => {
    //     items.push({
    //         label: keyword.label,
    //         kind: keyword.kind
    //     });
    // });
    
    // // Функции
    // functions.forEach(func => {
    //     const item = CompletionItem.create(func.name);
    //     item.detail = `${func.name}(${func.params.join(', ')})`;
        
    //     if (func.documentation) {
    //         item.documentation = {
    //             kind: MarkupKind.Markdown,
    //             value: func.documentation
    //         };
    //     }
        
    //     items.push(item);
    // });
    
    // return items;
});

// == ПОДСКАЗКИ С ПОДСВЕТКОЙ СИНТАКСИСА ==
connection.onHover((params): Hover | null => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const offset = document.offsetAt(params.position);
    const text = document.getText();
    
    // Получаем слово под курсором
    let start = offset;
    let end = offset;
    
    while (start > 0 && /[\w.]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w.]/.test(text[end])) end++;
    
    const word = text.substring(start, end);
    
    // // Для языков
    // if (/^[a-z]{2}-[A-Z]{2,3}$/.test(word)) {
    //     return {
    //         contents: {
    //             kind: MarkupKind.Markdown,
    //             value: `**Язык локализации:** \`${word}\``
    //         }
    //     };
    // }
    
    // // Ищем функцию
    // const functions = documentFunctions.get(params.textDocument.uri) || [];
    
    // // Проверяем, может быть это вызов функции с пакетом (math.add)
    // const dotIndex = word.lastIndexOf('.');
    // if (dotIndex != -1) {
    //     const packageName = word.substring(0, dotIndex);
    //     const functionName = word.substring(dotIndex + 1);
        
    //     const func = functions.find(f => 
    //         f.name == functionName && f.package == packageName
    //     );
        
    //     if (func) {
    //         return createFunctionHover(func, packageName);
    //     }
    // }
    
    // // Проверяем простое имя функции
    // const func = functions.find(f => f.name == word);
    // if (func) {
    //     return createFunctionHover(func);
    // }
    
    return null;
});

// == ФУНКЦИЯ ДЛЯ СОЗДАНИЯ HOVER С ПОДСВЕТКОЙ ==
// function createFunctionHover(func: LingFunction, packageName?: string): Hover {
//     // Создаем подсвеченный код функции
//     const functionSignature = packageName 
//         ? `${packageName}.${func.name}(${func.params.join(', ')})`
//         : `${func.name}(${func.params.join(', ')})`;
    
//     // Markdown с блоком кода ling для подсветки
//     const markdown: MarkupContent = {
//         kind: MarkupKind.Markdown,
//         value: ''
//     };
    
//     // Добавляем подсвеченный код
//     markdown.value += '```ling\n';
//     markdown.value += functionSignature;
//     markdown.value += '\n```\n\n';
    
//     // Добавляем документацию если есть
//     if (func.documentation) {
//         markdown.value += `${func.documentation}\n\n`;
//     }
    
//     // Добавляем информацию о параметрах
//     if (func.params.length > 0) {
//         markdown.value += '**Параметры:**\n';
//         func.params.forEach((param, index) => {
//             markdown.value += `${index + 1}. \`${param}\`\n`;
//         });
//         markdown.value += '\n';
//     } else {
//         markdown.value += '**Параметры:** нет\n\n';
//     }
    
//     // Информация о пакете
//     if (func.package) {
//         markdown.value += `**Пакет:** \`${func.package}\`\n`;
//     }
    
//     return {
//         contents: markdown
//     };
// }

// Запускаем сервер
documents.listen(connection);
connection.listen();

console.log('🔧 Ling Language Server started');