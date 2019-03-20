import * as vscode from 'vscode';

export class Node extends vscode.TreeItem {
  lineNumber: number;
  path: string;
  tag: string;
  description: string;
  children?: Node[];

  constructor(
    {
      tag,
      description,
      path,
      lineNumber
    }: {
      lineNumber: number;
      path: string;
      tag: string;
      description: string;
    },
    children?: Node[]
  ) {
    super(tag);
    this.lineNumber = lineNumber;
    this.path = path;
    this.tag = tag;
    this.description = description;
    this.children = children && children.length ? children : [];
  }
}

export default class TreeTagProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    any
  > = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData
    .event;

  // TODO: figure out what this does
  public refresh() {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: Node) {
    return element;
  }

  public getChildren(element?: Node) {
    return element && element.children ? element.children : [];
  }
}
