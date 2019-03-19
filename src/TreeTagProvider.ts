import { TreeDataProvider, TreeItem } from "vscode";

export default class implements TreeDataProvider<TreeItem> {
  constructor() {}

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): TreeItem[] {
    return [new TreeItem("Test")];
  }
}
