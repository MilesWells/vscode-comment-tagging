import * as vscode from 'vscode';
import * as fs from 'fs';
import { promisify } from 'util';
import { groupBy } from 'lodash';

export enum NodeType {
  TAG_GROUP,
  FILE_GROUP,
  TAG
}

interface INode {
  children?: Node[];
  description?: string;
  fileName?: string;
  label?: string;
  path?: string;
  tag: string;
  type: NodeType;
}

export class Node extends vscode.TreeItem implements INode {
  children?: Node[];
  description?: string;
  fileName?: string;
  path?: string;
  tag: string;
  type: NodeType;

  constructor({
    description,
    fileName,
    label,
    path,
    tag,
    type,
    children
  }: INode) {
    let collapse;
    switch (type) {
      case NodeType.FILE_GROUP:
      case NodeType.TAG_GROUP:
        collapse = vscode.TreeItemCollapsibleState.Collapsed;
        break;
      case NodeType.TAG:
      default:
        collapse = vscode.TreeItemCollapsibleState.None;
        break;
    }

    super(tag, collapse);
    this.children = children && children.length ? children : [];
    this.description = description;
    this.fileName = fileName;
    this.label = label;
    this.path = path;
    this.tag = tag;
    this.type = type;
  }
}

const readFile = promisify(fs.readFile);

// unicode consortium considers this as the proper cross-platform regex for finding new lines
const NEW_LINE_REGEX = /\r\n|[\n\v\f\r\x85\u2028\u2029]/;

// TODO make this configurable
const TAG_REGEX = /\/\/[ ]?@(\S+) (.*$)/;

export default class TreeTagProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData: vscode.EventEmitter<any>;
  readonly onDidChangeTreeData: vscode.Event<any>;
  private tree: Node[] = [];

  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    this.refresh();
  }

  public getTreeItem(element: Node) {
    return element;
  }

  public getChildren(element?: Node) {
    return element && element.children ? element.children : this.tree;
  }

  public refresh = async () => {
    // TODO config for excluded globs
    const files = await vscode.workspace.findFiles(
      '**/*',
      '**/node_modules/**'
    );
    const promises: Promise<Node[]>[] = [];
    files.forEach(({ fsPath }) => {
      promises.push(this.findTagsInFile(fsPath));
    });

    const results = await Promise.all(promises);

    // flatten tags into one dimensional array
    const flattenedResults = results
      .filter(result => result.length > 0)
      .reduce((acc, cur) => acc.concat(cur), []);

    const groupedResults = groupBy(flattenedResults, 'tag');
    const tags = Object.keys(groupedResults);

    const tagGroupNodes: Node[] = [];

    // for each tag, create a tag group node with the children being the matching tags
    tags.forEach(tag => {
      tagGroupNodes.push(
        new Node({
          tag,
          label: tag,
          type: NodeType.TAG_GROUP,
          children: groupedResults[tag]
        })
      );
    });

    // group the children of each tag group by file path
    const tree: Node[] = tagGroupNodes.map(tagGroup => {
      const fileGroupNodes: Node[] = [];
      const grouped = groupBy(tagGroup.children, 'path');
      const paths = Object.keys(grouped);

      paths.forEach(path => {
        const label = grouped[path][0].fileName || 'UNKNOWN';
        fileGroupNodes.push(
          new Node({
            children: grouped[path],
            label,
            tag: label,
            type: NodeType.FILE_GROUP
          })
        );
      });

      return {
        ...tagGroup,
        children: fileGroupNodes
      };
    });

    this.tree = tree.sort((a, b) => `${a.label}`.localeCompare(`${b.label}`));
    this._onDidChangeTreeData.fire();
  };

  // finds all the tags in a given file
  private findTagsInFile = async (path: string): Promise<Node[]> => {
    const fileName = path.replace(/^.*[\\\/]/, '');
    const text = (await readFile(path)).toString();
    const lines = text.split(NEW_LINE_REGEX);
    return lines
      .map(
        (line, idx): Node | null => {
          const match = line.match(TAG_REGEX);
          if (!match) {
            return null;
          }

          const [_, tag, description] = match;

          return {
            fileName,
            path,
            tag,
            type: NodeType.TAG,
            label: `${idx + 1}: ${description}`,
            command: {
              title: 'onClickTag',
              command: 'ct-tree.onClickTag',
              arguments: [path, idx]
            }
          };
        }
      )
      .filter((match): match is Node => match !== null); // type guard for stripping nulls
  };
}
