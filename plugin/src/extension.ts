import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Ling extension activated!');

    // Путь к серверу (отдельный процесс)
    const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
    
    // Опции для запуска сервера
    const serverOptions: ServerOptions = {
        run: { 
            module: serverModule, 
            transport: TransportKind.ipc 
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }
        }
    };

    // Опции клиента
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'ling' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.ling')
        }
    };

    // Создаем и запускаем клиент
    client = new LanguageClient(
        'lingLanguageServer',
        'Ling Language Server',
        serverOptions,
        clientOptions
    );

    // Запускаем клиент
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}