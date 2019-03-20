// TODO: JSDOC

import * as vscode from 'vscode';
import * as fs from 'fs';
import { promisify } from 'util';

import { groupBy } from 'lodash';

import TreeTagProvider, { Node } from './TreeTagProvider';

const TREE_VIEW_ID = 'ct-tree-view';
const VIEW_CONTAINER_ID = 'ct-view-container';
const VIEW_ID = 'ct-view';

const readFile = promisify(fs.readFile);

// unicode consortium considers this as the proper cross-platform regex for finding new lines
const NEW_LINE_REGEX = /\r\n|[\n\v\f\r\x85\u2028\u2029]/;

// TODO: use capture groups. 1 is the tag name, 2 is the tag description
const TAG_REGEX = /\/\/ @(\S+) (.*$)/;

export function activate(context: vscode.ExtensionContext) {
  // SEE SOURCE FOR HELP: https://github.com/Gruntfuggly/todo-tree
  const treeDataProvider = new TreeTagProvider();

  // TODO: no idea if this works
  vscode.commands.registerCommand('commentTagTree.refresh', () =>
    treeDataProvider.refresh()
  );
  const todoTreeViewExplorer = vscode.window.createTreeView(VIEW_ID, {
    treeDataProvider
  });

  context.subscriptions.push(todoTreeViewExplorer); // will get disposed when extension is deactivated

  buildData();
}

// builds data for tree provider thing
async function buildData() {
  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
  const promises: Promise<(Node | null)[]>[] = [];
  files.forEach(({ fsPath }) => {
    promises.push(findTagsInFile(fsPath));
  });

  const results = await Promise.all(promises);
  const flattenedResults = results
    .filter(result => result.length > 0)
    .reduce((acc, curr) => acc.concat(curr), []);
  const groupedResults = groupBy(flattenedResults, 'tag');
  const tags = Object.keys(groupedResults).sort((a, b) => a.localeCompare(b));
  console.log(tags);
}

// finds all the tags in a given file
async function findTagsInFile(path: string) {
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
          lineNumber: idx + 1,
          path,
          tag,
          description
        };
      }
    )
    .filter(match => match !== null);
}
