import * as vscode from 'vscode';

import TreeTagProvider from './TreeTagProvider';

export const TREE_VIEW_ID = 'ct-tree-view';
export const VIEW_CONTAINER_ID = 'ct-view-container';
export const VIEW_ID = 'ct-view';

export function activate(context: vscode.ExtensionContext) {
  // register provider
  const treeDataProvider = new TreeTagProvider();
  vscode.window.registerTreeDataProvider(VIEW_ID, treeDataProvider);

  // refresh data on document save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(treeDataProvider.refresh)
  );

  // when we click a tag, show the document and put the cursor on the correct line
  vscode.commands.registerCommand(
    'ct-tree.onClickTag',
    async (path, lineNumber) => {
      await vscode.window.showTextDocument(vscode.Uri.parse(`file://${path}`));
      if (!vscode.window.activeTextEditor) {
        return;
      }

      vscode.window.activeTextEditor.selection = new vscode.Selection(
        lineNumber,
        0,
        lineNumber,
        0
      );
    }
  );
}
