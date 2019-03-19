// The module 'vscode' contains the VS Code extensibility API
import { ExtensionContext, window, debug } from "vscode";
import * as vsc from "vscode";
import TreeTagProvider from "./TreeTagProvider";

const TREE_VIEW_ID = "ct-tree-view";
const VIEW_CONTAINER_ID = "ct-view-container";
const VIEW_ID = "ct-view";
const treeDataProvider = new TreeTagProvider();

// @todo: use capture groups. 1 is the tag name, 2 is the tag description
const regex = /\/\/ @(\S+) (.*$)/;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // NOTE: Activation is when the extension does something.
  // SEE SOURCE FOR HELP: https://github.com/wayou/vscode-todo-highlight
  const disposable = window.registerTreeDataProvider(VIEW_ID, treeDataProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("deactivated");
}
