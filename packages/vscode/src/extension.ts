import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import Papa from 'papaparse';
import { MarkdownParser } from 'tabmark-core';

export function activate(context: vscode.ExtensionContext) {
  console.log('Tabmark extension is active');

  // Register custom editor
  context.subscriptions.push(TabmarkEditorProvider.register(context));

  // Register command to open as DataGrid
  context.subscriptions.push(
    vscode.commands.registerCommand('tabmark.openDataGrid', (uri?: vscode.Uri) => {
      const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (targetUri) {
        vscode.commands.executeCommand('vscode.openWith', targetUri, 'tabmark.datagrid');
      }
    }),
  );

  // Register CSV Export command
  context.subscriptions.push(
    vscode.commands.registerCommand('tabmark.exportCSV', async () => {
      // Try to get active text editor or our tracked custom editor document
      const document =
        vscode.window.activeTextEditor?.document || TabmarkEditorProvider.activeDocument;

      if (!document) {
        vscode.window.showErrorMessage('No active Tabmark editor found');
        return;
      }

      const text = document.getText();
      const parser = new MarkdownParser({ escapeHtml: false });
      try {
        const parsed = parser.parseHierarchical(text);
        const gridData = parser.toGridData(parsed);

        // Convert to CSV
        const csv = Papa.unparse({
          fields: gridData.headers,
          data: gridData.rows,
        });

        // Show save dialog
        const uri = await vscode.window.showSaveDialog({
          filters: { CSV: ['csv'] },
          saveLabel: 'Export CSV',
        });

        if (uri) {
          fs.writeFileSync(uri.fsPath, csv, 'utf8');
          vscode.window.showInformationMessage('CSV exported successfully');
        }
      } catch (error) {
        vscode.window.showErrorMessage('Failed to export CSV: ' + error);
      }
    }),
  );

  // Register CSV Import command
  context.subscriptions.push(
    vscode.commands.registerCommand('tabmark.importCSV', async () => {
      const document =
        vscode.window.activeTextEditor?.document || TabmarkEditorProvider.activeDocument;

      if (!document) {
        vscode.window.showErrorMessage('No active Tabmark editor found');
        return;
      }

      // Show open dialog
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { CSV: ['csv'] },
        openLabel: 'Import CSV',
      });

      if (uris && uris.length > 0) {
        const uri = uris[0];
        try {
          const csvContent = fs.readFileSync(uri.fsPath, 'utf8');
          const result = Papa.parse(csvContent, { header: true });

          if (result.errors.length > 0) {
            throw new Error(result.errors[0].message);
          }

          const headers = result.meta.fields || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = result.data.map((row: any) => headers.map((h: string) => row[h] || ''));

          const parser = new MarkdownParser({ escapeHtml: false });
          // Preserve existing frontmatter if possible, or just create new
          const text = document.getText();
          const existingParsed = parser.parseHierarchical(text);
          const sheetName = Object.keys(existingParsed.sheets)[0] || 'Sheet1';

          const newMarkdown = parser.fromGridData(
            sheetName,
            { headers, rows },
            existingParsed.frontmatter || undefined,
          );

          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length),
          );

          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, fullRange, newMarkdown);
          await vscode.workspace.applyEdit(edit);

          vscode.window.showInformationMessage('CSV imported successfully');
        } catch (error) {
          vscode.window.showErrorMessage('Failed to import CSV: ' + error);
        }
      }
    }),
  );
}

export class TabmarkEditorProvider implements vscode.CustomTextEditorProvider {
  public static activeDocument: vscode.TextDocument | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new TabmarkEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      TabmarkEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    );
    return providerRegistration;
  }

  private static readonly viewType = 'tabmark.datagrid';
  private readonly parser: MarkdownParser;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.parser = new MarkdownParser({ escapeHtml: false });
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: vscode.CancellationToken,
  ): Promise<void> {
    let isProgrammaticUpdate = false;
    // Track active document
    if (webviewPanel.active) {
      TabmarkEditorProvider.activeDocument = document;
    }

    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        TabmarkEditorProvider.activeDocument = document;
      } else if (TabmarkEditorProvider.activeDocument === document) {
        TabmarkEditorProvider.activeDocument = undefined;
      }
    });

    webviewPanel.onDidDispose(() => {
      if (TabmarkEditorProvider.activeDocument === document) {
        TabmarkEditorProvider.activeDocument = undefined;
      }
    });

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'webview')),
      ],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    const updateWebview = async () => {
      const text = document.getText();

      try {
        const parsed = this.parser.parseHierarchical(text);

        // Auto-initialize empty files with 1x1 grid
        if (text.trim() === '') {
          const gridData = {
            headers: ['Column 1'],
            rows: [['']],
          };
          // Create initial markdown content
          const sheetName = 'Sheet1';
          const initialMarkdown = this.parser.fromGridData(sheetName, gridData);

          // Set flag to prevent infinite loop
          isProgrammaticUpdate = true;

          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length),
          );
          edit.replace(document.uri, fullRange, initialMarkdown);
          await vscode.workspace.applyEdit(edit);

          // Don't send update message here - let the document change event handle it
          return;
        }

        // Validate Tabmark structure
        const validationResult = this.parser.validateTabmarkStructure(parsed);

        if (!validationResult.isValid) {
          // Show guide screen for invalid structure
          webviewPanel.webview.postMessage({
            type: 'showGuide',
            errors: validationResult.errors,
          });
          return;
        }

        // Valid structure - show grid
        const gridData = this.parser.toGridData(parsed);
        webviewPanel.webview.postMessage({
          type: 'update',
          data: gridData,
        });
      } catch (error) {
        console.error('Error updating webview:', error);
      }
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        // Skip if we know this is our own programmatic update
        if (isProgrammaticUpdate) {
          isProgrammaticUpdate = false;
          // After auto-initialization, update the webview with the new content
          updateWebview();
          return;
        }

        // Also skip if it looks like a full document replacement (programmatic)
        // This is a safety check in case the flag wasn't set properly
        const isFullReplacement =
          e.contentChanges.length === 1 &&
          e.contentChanges[0].range.start.line === 0 &&
          e.contentChanges[0].range.start.character === 0;

        if (!isFullReplacement) {
          updateWebview();
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'ready':
          updateWebview();
          break;
        case 'cellChange':
          await this.handleCellChange(document, message.data);
          break;
        case 'addRow':
        case 'addColumn':
        case 'update':
          await this.handleGridUpdate(document, message.data, {
            value: isProgrammaticUpdate,
          });
          break;
        case 'initializeGrid': {
          // Initialize with 1x1 grid
          const gridData = {
            headers: ['Column 1'],
            rows: [['']],
          };
          const sheetName = 'Sheet1';
          const initialMarkdown = this.parser.fromGridData(sheetName, gridData);
          
          isProgrammaticUpdate = true;
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length),
          );
          edit.replace(document.uri, fullRange, initialMarkdown);
          await vscode.workspace.applyEdit(edit);
          break;
        }
        case 'triggerImportCSV':
          // Trigger the Import CSV command
          await vscode.commands.executeCommand('tabmark.importCSV');
          break;
        case 'openWithOtherEditor':
          // Close the current webview and reopen with editor picker
          await vscode.commands.executeCommand('workbench.action.reopenWithEditor');
          break;
      }
    });

    updateWebview();
  }

  private async handleCellChange(
    document: vscode.TextDocument,
    data: { rowIndex: number; colIndex: number; value: string },
  ): Promise<void> {
    const text = document.getText();
    const parsed = this.parser.parseHierarchical(text);
    const gridData = this.parser.toGridData(parsed);

    if (gridData.rows[data.rowIndex]) {
      gridData.rows[data.rowIndex][data.colIndex] = data.value;
    }

    const sheetName = Object.keys(parsed.sheets)[0] || 'Sheet1';
    const newMarkdown = this.parser.fromGridData(
      sheetName,
      gridData,
      parsed.frontmatter || undefined,
    );

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
    edit.replace(document.uri, fullRange, newMarkdown);
    await vscode.workspace.applyEdit(edit);
  }

  private async handleGridUpdate(
    document: vscode.TextDocument,
    gridData: { headers: string[]; rows: string[][] },
    isProgrammaticUpdateFlag?: { value: boolean },
  ): Promise<void> {
    const text = document.getText();
    const parsed = this.parser.parseHierarchical(text);
    const sheetName = Object.keys(parsed.sheets)[0] || 'Sheet1';

    const newMarkdown = this.parser.fromGridData(
      sheetName,
      gridData,
      parsed.frontmatter || undefined,
    );

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
    edit.replace(document.uri, fullRange, newMarkdown);

    // Set flag before applying edit
    if (isProgrammaticUpdateFlag) {
      isProgrammaticUpdateFlag.value = true;
    }
    await vscode.workspace.applyEdit(edit);
    // Flag will be automatically reset by the change event handler
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const webviewPath = path.join(this.context.extensionPath, 'out', 'webview');

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewPath, 'assets', 'index.js')),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewPath, 'assets', 'style.css')),
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Tabmark Spreadsheet</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="app"></div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
