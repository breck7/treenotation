"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractNode_node_1 = require("./AbstractNode.node");
const TreeUtils_1 = require("./TreeUtils");
class ImmutableNode extends AbstractNode_node_1.default {
    constructor(children, line, parent) {
        super();
        this._parent = parent;
        this._setLine(line);
        this._setChildren(children);
    }
    execute(context) {
        return Promise.all(this.map(child => child.execute(context)));
    }
    getErrors() {
        return [];
    }
    getLineSyntax() {
        return "any ".repeat(this.getWords().length).trim();
    }
    executeSync(context) {
        return this.map(child => child.executeSync(context));
    }
    isNodeJs() {
        return typeof exports !== "undefined";
    }
    getOlderSiblings() {
        return this.getParent().slice(0, this.getIndex());
    }
    getYoungerSiblings() {
        return this.getParent().slice(this.getIndex() + 1);
    }
    getSiblings() {
        return this.getParent().filter(node => node !== this);
    }
    _getUid() {
        if (!this._uid)
            this._uid = ImmutableNode._makeUniqueId();
        return this._uid;
    }
    // todo: rename getMother? grandMother et cetera?
    getParent() {
        return this._parent;
    }
    getPoint() {
        return this._getPoint();
    }
    _getPoint(relativeTo) {
        return {
            x: this._getXCoordinate(relativeTo),
            y: this._getYCoordinate(relativeTo)
        };
    }
    getPointRelativeTo(relativeTo) {
        return this._getPoint(relativeTo);
    }
    getIndentation(relativeTo) {
        return this.getXI().repeat(this._getXCoordinate(relativeTo) - 1);
    }
    *getTopDownArrayIterator() {
        for (let child of this.getChildren()) {
            yield child;
            yield* child.getTopDownArrayIterator();
        }
    }
    getNumberOfLines() {
        let lineCount = 0;
        for (let node of this.getTopDownArrayIterator()) {
            lineCount++;
        }
        return lineCount;
    }
    _getLineNumber(target) {
        let lineNumber = 1;
        for (let node of this.getTopDownArrayIterator()) {
            if (node === target)
                return lineNumber;
            lineNumber++;
        }
        return lineNumber;
    }
    isBlankLine() {
        return !this.length && !this.getLine();
    }
    isEmpty() {
        return !this.length && !this.getContent();
    }
    _getYCoordinate(relativeTo) {
        if (this._cachedLineNumber)
            return this._cachedLineNumber;
        if (this.isRoot(relativeTo))
            return 0;
        const start = relativeTo || this.getRootNode();
        return start._getLineNumber(this);
    }
    isRoot(relativeTo) {
        return relativeTo === this || !this.getParent();
    }
    getRootNode() {
        return this._getRootNode();
    }
    _getRootNode(relativeTo) {
        if (this.isRoot(relativeTo))
            return this;
        return this.getParent()._getRootNode(relativeTo);
    }
    toString(indentCount = 0, language = this) {
        if (this.isRoot())
            return this._childrenToString(indentCount, language);
        const content = language.getXI().repeat(indentCount) + this.getLine(language);
        const value = content + (this.length ? language.getYI() + this._childrenToString(indentCount + 1, language) : "");
        return value;
    }
    getWord(index) {
        const words = this._getLine().split(this.getZI());
        if (index < 0)
            index = words.length + index;
        return words[index];
    }
    _toHtml(indentCount) {
        const path = this.getPathVector().join(" ");
        const classes = {
            nodeLine: "nodeLine",
            xi: "xIncrement",
            yi: "yIncrement",
            nodeChildren: "nodeChildren"
        };
        const edge = this.getXI().repeat(indentCount);
        // Set up the keyword part of the node
        const edgeHtml = `<span class="${classes.nodeLine}" data-pathVector="${path}"><span class="${classes.xi}">${edge}</span>`;
        const lineHtml = this._getLineHtml();
        const childrenHtml = this.length
            ? `<span class="${classes.yi}">${this.getYI()}</span>` +
                `<span class="${classes.nodeChildren}">${this._childrenToHtml(indentCount + 1)}</span>`
            : "";
        return `${edgeHtml}${lineHtml}${childrenHtml}</span>`;
    }
    _getWords(startFrom) {
        if (!this._words)
            this._words = this._getLine().split(this.getZI());
        return startFrom ? this._words.slice(startFrom) : this._words;
    }
    getWords() {
        return this._getWords(0);
    }
    getWordsFrom(startFrom) {
        return this._getWords(startFrom);
    }
    getKeyword() {
        return this.getWords()[0];
    }
    getContent() {
        const words = this.getWordsFrom(1);
        return words.length ? words.join(this.getZI()) : undefined;
    }
    getContentWithChildren() {
        // todo: deprecate
        const content = this.getContent();
        return (content ? content : "") + (this.length ? this.getYI() + this._childrenToString() : "");
    }
    getStack() {
        return this._getStack();
    }
    _getStack(relativeTo) {
        if (this.isRoot(relativeTo))
            return [];
        const parent = this.getParent();
        if (parent.isRoot(relativeTo))
            return [this];
        else
            return parent._getStack(relativeTo).concat([this]);
    }
    getStackString() {
        return this._getStack()
            .map((node, index) => this.getXI().repeat(index) + node.getLine())
            .join(this.getYI());
    }
    getLine(language) {
        if (!this._words && !language)
            return this._getLine(); // todo: how does this interact with "language" param?
        return this.getWords().join((language || this).getZI());
    }
    getColumnNames() {
        return this._getUnionNames();
    }
    getOneHot(column) {
        const clone = this.clone();
        const cols = Array.from(new Set(clone.getColumn(column)));
        clone.forEach(node => {
            const val = node.get(column);
            node.delete(column);
            cols.forEach(col => {
                node.set(column + "_" + col, val === col ? "1" : "0");
            });
        });
        return clone;
    }
    // todo: return array? getPathArray?
    _getKeywordPath(relativeTo) {
        if (this.isRoot(relativeTo))
            return "";
        else if (this.getParent().isRoot(relativeTo))
            return this.getKeyword();
        return this.getParent()._getKeywordPath(relativeTo) + this.getXI() + this.getKeyword();
    }
    getKeywordPathRelativeTo(relativeTo) {
        return this._getKeywordPath(relativeTo);
    }
    getKeywordPath() {
        return this._getKeywordPath();
    }
    getPathVector() {
        return this._getPathVector();
    }
    getPathVectorRelativeTo(relativeTo) {
        return this._getPathVector(relativeTo);
    }
    _getPathVector(relativeTo) {
        if (this.isRoot(relativeTo))
            return [];
        const path = this.getParent()._getPathVector(relativeTo);
        path.push(this.getIndex());
        return path;
    }
    getIndex() {
        return this.getParent()._indexOfNode(this);
    }
    isTerminal() {
        return !this.length;
    }
    _getLineHtml() {
        return this.getWords()
            .map((word, index) => `<span class="word${index ? "" : " keyword"}">${TreeUtils_1.default.stripHtml(word)}</span>`)
            .join(`<span class="zIncrement">${this.getZI()}</span>`);
    }
    _getXmlContent(indentCount) {
        if (this.getContent() !== undefined)
            return this.getContentWithChildren();
        return this.length
            ? `${indentCount === -1 ? "" : "\n"}${this._childrenToXml(indentCount > -1 ? indentCount + 2 : -1)}${" ".repeat(indentCount)}`
            : "";
    }
    _toXml(indentCount) {
        const indent = " ".repeat(indentCount);
        const tag = this.getKeyword();
        return `${indent}<${tag}>${this._getXmlContent(indentCount)}</${tag}>${indentCount === -1 ? "" : "\n"}`;
    }
    _toObjectTuple() {
        const content = this.getContent();
        const length = this.length;
        const hasChildrenNoContent = content === undefined && length;
        const hasContentAndHasChildren = content !== undefined && length;
        // If the node has a content and a subtree return it as a string, as
        // Javascript object values can't be both a leaf and a tree.
        const tupleValue = hasChildrenNoContent
            ? this.toObject()
            : hasContentAndHasChildren
                ? this.getContentWithChildren()
                : content;
        return [this.getKeyword(), tupleValue];
    }
    _indexOfNode(needleNode) {
        let result = -1;
        this.find((node, index) => {
            if (node === needleNode) {
                result = index;
                return true;
            }
        });
        return result;
    }
    getSlice(startIndexInclusive, stopIndexExclusive) {
        return new TreeNode(this.slice(startIndexInclusive, stopIndexExclusive)
            .map(child => child.toString())
            .join("\n"));
    }
    getTopDownArray() {
        const arr = [];
        this._getTopDownArray(arr);
        return arr;
    }
    _hasColumns(columns) {
        const words = this.getWords();
        return columns.every((searchTerm, index) => searchTerm === words[index]);
    }
    hasWord(index, word) {
        return this.getWord(index) === word;
    }
    getNodeByColumns(...columns) {
        return this.getTopDownArray().find(node => node._hasColumns(columns));
    }
    getNodeByColumn(index, name) {
        return this.find(node => node.getWord(index) === name);
    }
    _getNodesByColumn(index, name) {
        return this.filter(node => node.getWord(index) === name);
    }
    _getTopDownArray(arr) {
        this.forEach(child => {
            arr.push(child);
            child._getTopDownArray(arr);
        });
    }
    getChildrenFirstArray() {
        const arr = [];
        this._getChildrenFirstArray(arr);
        return arr;
    }
    _getChildrenFirstArray(arr) {
        this.forEach(child => {
            child._getChildrenFirstArray(arr);
            arr.push(child);
        });
    }
    _getXCoordinate(relativeTo) {
        return this._getStack(relativeTo).length;
    }
    getParentFirstArray() {
        const levels = this._getLevels();
        const arr = [];
        levels.forEach(level => {
            level.forEach(item => arr.push(item));
        });
        return arr;
    }
    _getLevels() {
        const levels = [];
        this.getTopDownArray().forEach(node => {
            const level = node._getXCoordinate();
            if (!levels[level])
                levels[level] = [];
            levels[level].push(node);
        });
        return levels;
    }
    _getChildrenArray() {
        if (!this._children)
            this._children = [];
        return this._children;
    }
    _getChildren() {
        return this._getChildrenArray();
    }
    getLines() {
        return this.map(node => node.getLine());
    }
    getChildren() {
        return this._getChildren().slice(0);
    }
    get length() {
        return this._getChildren().length;
    }
    _nodeAt(index) {
        if (index < 0)
            index = this.length + index;
        return this._getChildren()[index];
    }
    nodeAt(indexOrArray) {
        const type = typeof indexOrArray;
        if (type === "number")
            return this._nodeAt(indexOrArray);
        if (indexOrArray.length === 1)
            return this._nodeAt(indexOrArray[0]);
        const first = indexOrArray[0];
        const node = this._nodeAt(first);
        if (!node)
            return undefined;
        return node.nodeAt(indexOrArray.slice(1));
    }
    _toObject() {
        const obj = {};
        this.forEach(node => {
            const tuple = node._toObjectTuple();
            obj[tuple[0]] = tuple[1];
        });
        return obj;
    }
    toHtml() {
        return this._childrenToHtml(0);
    }
    _childrenToHtml(indentCount) {
        return this.map(node => node._toHtml(indentCount)).join(`<span class="yIncrement">${this.getYI()}</span>`);
    }
    _childrenToString(indentCount, language = this) {
        return this.map(node => node.toString(indentCount, language)).join(language.getYI());
    }
    childrenToString() {
        return this._childrenToString();
    }
    // todo: implement
    _getNodeJoinCharacter() {
        return "\n";
    }
    compile(targetExtension) {
        return this.map(child => child.compile(targetExtension)).join(this._getNodeJoinCharacter());
    }
    toXml() {
        return this._childrenToXml(0);
    }
    toJson() {
        return JSON.stringify(this.toObject(), null, " ");
    }
    findNodes(keywordPath) {
        // todo: can easily speed this up
        return this.getTopDownArray().filter(node => {
            if (node._getKeywordPath(this) === keywordPath)
                return true;
            return false;
        });
    }
    format(str) {
        const that = this;
        return str.replace(/{([^\}]+)}/g, (match, path) => that.get(path) || "");
    }
    getColumn(path) {
        return this.map(node => node.get(path));
    }
    getFiltered(fn) {
        const clone = this.clone();
        clone
            .filter(node => !fn(node))
            .forEach(node => {
            node.destroy();
        });
        return clone;
    }
    isLeafColumn(path) {
        for (let node of this._getChildren()) {
            const nd = node.getNode(path);
            if (nd && nd.length)
                return false;
        }
        return true;
    }
    getNode(keywordPath) {
        return this._getNodeByPath(keywordPath);
    }
    get(keywordPath) {
        const node = this._getNodeByPath(keywordPath);
        return node === undefined ? undefined : node.getContent();
    }
    _getNodeByPath(keywordPath) {
        const xi = this.getXI();
        if (!keywordPath.includes(xi)) {
            const index = this.indexOfLast(keywordPath);
            return index === -1 ? undefined : this._nodeAt(index);
        }
        const parts = keywordPath.split(xi);
        const current = parts.shift();
        const currentNode = this._getChildren()[this._getIndex()[current]];
        return currentNode ? currentNode._getNodeByPath(parts.join(xi)) : undefined;
    }
    getNext() {
        if (this.isRoot())
            return this;
        const index = this.getIndex();
        const parent = this.getParent();
        const length = parent.length;
        const next = index + 1;
        return next === length ? parent._getChildren()[0] : parent._getChildren()[next];
    }
    getPrevious() {
        if (this.isRoot())
            return this;
        const index = this.getIndex();
        const parent = this.getParent();
        const length = parent.length;
        const prev = index - 1;
        return prev === -1 ? parent._getChildren()[length - 1] : parent._getChildren()[prev];
    }
    _getUnionNames() {
        if (!this.length)
            return [];
        const obj = {};
        this.forEach(node => {
            if (!node.length)
                return undefined;
            node.forEach(node => {
                obj[node.getKeyword()] = 1;
            });
        });
        return Object.keys(obj);
    }
    getGraphByKey(key) {
        const graph = this._getGraph((node, id) => node._getNodesByColumn(0, id), node => node.get(key), this);
        graph.push(this);
        return graph;
    }
    getGraph(thisColumnNumber, extendsColumnNumber) {
        const graph = this._getGraph((node, id) => node._getNodesByColumn(thisColumnNumber, id), node => node.getWord(extendsColumnNumber), this);
        graph.push(this);
        return graph;
    }
    _getGraph(getNodesByIdFn, getParentIdFn, cannotContainNode) {
        const parentId = getParentIdFn(this);
        if (!parentId)
            return [];
        const potentialParentNodes = getNodesByIdFn(this.getParent(), parentId);
        if (!potentialParentNodes.length)
            throw new Error(`"${this.getLine()} tried to extend "${parentId}" but "${parentId}" not found.`);
        // Note: If multiple matches, we attempt to extend matching keyword first.
        const keyword = this.getKeyword();
        const parentNode = potentialParentNodes.find(node => node.getKeyword() === keyword) || potentialParentNodes[0];
        // todo: detect loops
        if (parentNode === cannotContainNode)
            throw new Error(`Loop detected between '${this.getLine()}' and '${parentNode.getLine()}'`);
        const graph = parentNode._getGraph(getNodesByIdFn, getParentIdFn, cannotContainNode);
        graph.push(parentNode);
        return graph;
    }
    pathVectorToKeywordPath(pathVector) {
        const path = pathVector.slice(); // copy array
        const names = [];
        let node = this;
        while (path.length) {
            if (!node)
                return names;
            names.push(node.nodeAt(path[0]).getKeyword());
            node = node.nodeAt(path.shift());
        }
        return names;
    }
    toCsv() {
        return this.toDelimited(",");
    }
    toFlatTree() {
        const tree = this.clone();
        tree.forEach(node => {
            // todo: best approach here? set children as content?
            node.deleteChildren();
        });
        return tree;
    }
    _getTypes(header) {
        const matrix = this._getMatrix(header);
        const types = header.map(i => "int");
        matrix.forEach(row => {
            row.forEach((value, index) => {
                const type = types[index];
                if (type === "string")
                    return 1;
                if (value === undefined || value === "")
                    return 1;
                if (type === "float") {
                    if (value.match(/^\-?[0-9]*\.?[0-9]*$/))
                        return 1;
                    types[index] = "string";
                }
                if (value.match(/^\-?[0-9]+$/))
                    return 1;
                types[index] = "string";
            });
        });
        return types;
    }
    toDataTable(header = this._getUnionNames()) {
        const types = this._getTypes(header);
        const parsers = {
            string: i => i,
            float: parseFloat,
            int: parseInt
        };
        const cellFn = (cellValue, rowIndex, columnIndex) => rowIndex ? parsers[types[columnIndex]](cellValue) : cellValue;
        const arrays = this._toArrays(header, cellFn);
        arrays.rows.unshift(arrays.header);
        return arrays.rows;
    }
    toDelimited(delimiter, header = this._getUnionNames()) {
        const regex = new RegExp(`(\\n|\\"|\\${delimiter})`);
        const cellFn = (str, row, column) => !str.toString().match(regex) ? str : `"` + str.replace(/\"/g, `""`) + `"`;
        return this._toDelimited(delimiter, header, cellFn);
    }
    _getMatrix(columns) {
        const matrix = [];
        this.forEach(child => {
            const row = [];
            columns.forEach(col => {
                row.push(child.get(col));
            });
            matrix.push(row);
        });
        return matrix;
    }
    _toArrays(header, cellFn) {
        const skipHeaderRow = 1;
        const headerArray = header.map((columnName, index) => cellFn(columnName, 0, index));
        const rows = this.map((node, rowNumber) => header.map((columnName, columnIndex) => {
            const childNode = node.getNode(columnName);
            const content = childNode ? childNode.getContentWithChildren() : "";
            return cellFn(content, rowNumber + skipHeaderRow, columnIndex);
        }));
        return {
            rows: rows,
            header: headerArray
        };
    }
    _toDelimited(delimiter, header, cellFn) {
        const data = this._toArrays(header, cellFn);
        return data.header.join(delimiter) + "\n" + data.rows.map(row => row.join(delimiter)).join("\n");
    }
    toTable() {
        // Output a table for printing
        return this._toTable(100, false);
    }
    toFormattedTable(maxWidth, alignRight) {
        // Output a table with padding up to maxWidth in each cell
        return this._toTable(maxWidth, alignRight);
    }
    _toTable(maxWidth, alignRight = false) {
        const header = this._getUnionNames();
        const widths = header.map(col => (col.length > maxWidth ? maxWidth : col.length));
        this.forEach(node => {
            if (!node.length)
                return true;
            header.forEach((col, index) => {
                const cellValue = node.get(col);
                if (!cellValue)
                    return true;
                const length = cellValue.toString().length;
                if (length > widths[index])
                    widths[index] = length > maxWidth ? maxWidth : length;
            });
        });
        const cellFn = (cellText, row, col) => {
            const width = widths[col];
            // Strip newlines in fixedWidth output
            const cellValue = cellText.toString().replace(/\n/g, "\\n");
            const cellLength = cellValue.length;
            if (cellLength > width) {
                return cellValue.substr(0, width);
            }
            const padding = " ".repeat(width - cellLength);
            return alignRight ? padding + cellValue : cellValue + padding;
        };
        return this._toDelimited(" ", header, cellFn);
    }
    toSsv() {
        return this.toDelimited(" ");
    }
    toOutline() {
        return this._toOutline(node => node.getLine());
    }
    toMappedOutline(nodeFn) {
        return this._toOutline(nodeFn);
    }
    // Adapted from: https://github.com/notatestuser/treeify.js
    _toOutline(nodeFn) {
        const growBranch = (outlineTreeNode, last, lastStates, nodeFn, callback) => {
            let lastStatesCopy = lastStates.slice(0);
            const node = outlineTreeNode.node;
            if (lastStatesCopy.push([outlineTreeNode, last]) && lastStates.length > 0) {
                let line = "";
                // keywordd on the "was last element" states of whatever we're nested within,
                // we need to append either blankness or a branch to our line
                lastStates.forEach((lastState, idx) => {
                    if (idx > 0)
                        line += lastState[1] ? " " : "│";
                });
                // the prefix varies keywordd on whether the key contains something to show and
                // whether we're dealing with the last element in this collection
                // the extra "-" just makes things stand out more.
                line += (last ? "└" : "├") + nodeFn(node);
                callback(line);
            }
            if (!node)
                return;
            const length = node.length;
            let index = 0;
            node.forEach(node => {
                let lastKey = ++index === length;
                growBranch({ node: node }, lastKey, lastStatesCopy, nodeFn, callback);
            });
        };
        let output = "";
        growBranch({ node: this }, false, [], nodeFn, line => (output += line + "\n"));
        return output;
    }
    copyTo(node, index) {
        return node._setLineAndChildren(this.getLine(), this.childrenToString(), index);
    }
    toMarkdownTable() {
        return this.toMarkdownTableAdvanced(this._getUnionNames(), val => val);
    }
    toMarkdownTableAdvanced(columns, formatFn) {
        const matrix = this._getMatrix(columns);
        const empty = columns.map(col => "-");
        matrix.unshift(empty);
        matrix.unshift(columns);
        const lines = matrix.map((row, rowIndex) => {
            const formattedValues = row.map((val, colIndex) => formatFn(val, rowIndex, colIndex));
            return `|${formattedValues.join("|")}|`;
        });
        return lines.join("\n");
    }
    toTsv() {
        return this.toDelimited("\t");
    }
    getYI() {
        return "\n";
    }
    getZI() {
        return " ";
    }
    getYIRegex() {
        return new RegExp(this.getYI(), "g");
    }
    getXI() {
        return " ";
    }
    _textToContentAndChildrenTuple(text) {
        const lines = text.split(this.getYIRegex());
        const firstLine = lines.shift();
        const children = !lines.length
            ? undefined
            : lines
                .map(line => (line.substr(0, 1) === this.getXI() ? line : this.getXI() + line))
                .map(line => line.substr(1))
                .join(this.getYI());
        return [firstLine, children];
    }
    _getLine() {
        return this._line;
    }
    _setLine(line = "") {
        this._line = line;
        if (this._words)
            delete this._words;
        return this;
    }
    _clearChildren() {
        delete this._children;
        this._clearIndex();
        return this;
    }
    _setChildren(content, circularCheckArray) {
        this._clearChildren();
        if (!content)
            return this;
        // set from string
        if (typeof content === "string")
            return this._parseString(content);
        // set from tree object
        if (content instanceof ImmutableNode) {
            const me = this;
            content.forEach(node => {
                me._setLineAndChildren(node.getLine(), node.childrenToString());
            });
            return this;
        }
        // If we set from object, create an array of inserted objects to avoid circular loops
        if (!circularCheckArray)
            circularCheckArray = [content];
        return this._setFromObject(content, circularCheckArray);
    }
    _setFromObject(content, circularCheckArray) {
        for (let keyword in content) {
            if (!content.hasOwnProperty(keyword))
                continue;
            // Branch the circularCheckArray, as we only have same branch circular arrays
            this._appendFromJavascriptObjectTuple(keyword, content[keyword], circularCheckArray.slice(0));
        }
        return this;
    }
    // todo: refactor the below.
    _appendFromJavascriptObjectTuple(keyword, content, circularCheckArray) {
        const type = typeof content;
        let line;
        let children;
        if (content === null)
            line = keyword + " " + null;
        else if (content === undefined)
            line = keyword;
        else if (type === "string") {
            const tuple = this._textToContentAndChildrenTuple(content);
            line = keyword + " " + tuple[0];
            children = tuple[1];
        }
        else if (type === "function")
            line = keyword + " " + content.toString();
        else if (type !== "object")
            line = keyword + " " + content;
        else if (content instanceof Date)
            line = keyword + " " + content.getTime().toString();
        else if (content instanceof ImmutableNode) {
            line = keyword;
            children = new TreeNode(content.childrenToString(), content.getLine());
        }
        else if (circularCheckArray.indexOf(content) === -1) {
            circularCheckArray.push(content);
            line = keyword;
            const length = content instanceof Array ? content.length : Object.keys(content).length;
            if (length)
                children = new TreeNode()._setChildren(content, circularCheckArray);
        }
        else {
            // iirc this is return early from circular
            return;
        }
        this._setLineAndChildren(line, children);
    }
    // todo: protected?
    _setLineAndChildren(line, children, index = this.length) {
        const nodeConstructor = this.getNodeConstructor(line);
        const newNode = new nodeConstructor(children, line, this);
        const adjustedIndex = index < 0 ? this.length + index : index;
        this._getChildrenArray().splice(adjustedIndex, 0, newNode);
        if (this._index)
            this._makeIndex(adjustedIndex);
        return newNode;
    }
    _parseString(str) {
        if (!str)
            return this;
        const lines = str.split(this.getYIRegex());
        const parentStack = [];
        let currentIndentCount = -1;
        let lastNode = this;
        lines.forEach(line => {
            const indentCount = this._getIndentCount(line);
            if (indentCount > currentIndentCount) {
                currentIndentCount++;
                parentStack.push(lastNode);
            }
            else if (indentCount < currentIndentCount) {
                // pop things off stack
                while (indentCount < currentIndentCount) {
                    parentStack.pop();
                    currentIndentCount--;
                }
            }
            const lineContent = line.substr(currentIndentCount);
            const parent = parentStack[parentStack.length - 1];
            const nodeConstructor = parent.getNodeConstructor(lineContent);
            lastNode = new nodeConstructor(undefined, lineContent, parent);
            parent._getChildrenArray().push(lastNode);
        });
        return this;
    }
    _getIndex() {
        // StringMap<int> {keyword: index}
        // When there are multiple tails with the same keyword, _index stores the last content.
        // todo: change the above behavior: when a collision occurs, create an array.
        return this._index || this._makeIndex();
    }
    getContentsArray() {
        return this.map(node => node.getContent());
    }
    // todo: rename to getChildrenByConstructor(?)
    getChildrenByNodeType(constructor) {
        return this.filter(child => child instanceof constructor);
    }
    // todo: rename to getNodeByConstructor(?)
    getNodeByType(constructor) {
        return this.find(child => child instanceof constructor);
    }
    indexOfLast(keyword) {
        const result = this._getIndex()[keyword];
        return result === undefined ? -1 : result;
    }
    indexOf(keyword) {
        if (!this.has(keyword))
            return -1;
        const length = this.length;
        const nodes = this._getChildren();
        for (let index = 0; index < length; index++) {
            if (nodes[index].getKeyword() === keyword)
                return index;
        }
        return -1;
    }
    toObject() {
        return this._toObject();
    }
    getKeywords() {
        return this.map(node => node.getKeyword());
    }
    _makeIndex(startAt = 0) {
        if (!this._index || !startAt)
            this._index = {};
        const nodes = this._getChildren();
        const newIndex = this._index;
        const length = nodes.length;
        for (let index = startAt; index < length; index++) {
            newIndex[nodes[index].getKeyword()] = index;
        }
        return newIndex;
    }
    _childrenToXml(indentCount) {
        return this.map(node => node._toXml(indentCount)).join("");
    }
    _getIndentCount(str) {
        let level = 0;
        const edgeChar = this.getXI();
        while (str[level] === edgeChar) {
            level++;
        }
        return level;
    }
    clone() {
        return new this.constructor(this.childrenToString(), this.getLine());
    }
    // todo: rename to hasKeyword
    has(keyword) {
        return this._hasKeyword(keyword);
    }
    _hasKeyword(keyword) {
        return this._getIndex()[keyword] !== undefined;
    }
    _getKeywordByIndex(index) {
        // Passing -1 gets the last item, et cetera
        const length = this.length;
        if (index < 0)
            index = length + index;
        if (index >= length)
            return undefined;
        return this._getChildren()[index].getKeyword();
    }
    map(fn) {
        return this.getChildren().map(fn);
    }
    filter(fn) {
        return this.getChildren().filter(fn);
    }
    find(fn) {
        return this.getChildren().find(fn);
    }
    forEach(fn) {
        this.getChildren().forEach(fn);
        return this;
    }
    // todo: protected?
    _clearIndex() {
        delete this._index;
    }
    slice(start, end) {
        return this.getChildren().slice(start, end);
    }
    getKeywordMap() {
        return undefined;
    }
    getCatchAllNodeConstructor(line) {
        return this.constructor;
    }
    // Note: if you have 2 of the same keywords, will attempt to extend matching keyword first
    getExpanded(thisColumnNumber, extendsColumnNumber) {
        return new TreeNode(this.map(child => child._expand(thisColumnNumber, extendsColumnNumber)).join("\n"));
    }
    getInheritanceTree() {
        const paths = {};
        const result = new TreeNode();
        this.forEach(node => {
            const key = node.getWord(0);
            const parentKey = node.getWord(1);
            const parentPath = paths[parentKey];
            paths[key] = parentPath ? [parentPath, key].join(" ") : key;
            result.touchNode(paths[key]);
        });
        return result;
    }
    getNodeConstructor(line) {
        const map = this.getKeywordMap();
        if (!map)
            return this.getCatchAllNodeConstructor(line);
        const firstBreak = line.indexOf(this.getZI());
        const keyword = line.substr(0, firstBreak > -1 ? firstBreak : undefined);
        return map[keyword] || this.getCatchAllNodeConstructor(line);
    }
    static _makeUniqueId() {
        if (this._uniqueId === undefined)
            this._uniqueId = 0;
        this._uniqueId++;
        return this._uniqueId;
    }
}
ImmutableNode.iris = `sepal_length,sepal_width,petal_length,petal_width,species
6.1,3,4.9,1.8,virginica
5.6,2.7,4.2,1.3,versicolor
5.6,2.8,4.9,2,virginica
6.2,2.8,4.8,1.8,virginica
7.7,3.8,6.7,2.2,virginica
5.3,3.7,1.5,0.2,setosa
6.2,3.4,5.4,2.3,virginica
4.9,2.5,4.5,1.7,virginica
5.1,3.5,1.4,0.2,setosa
5,3.4,1.5,0.2,setosa`;
class TreeNode extends ImmutableNode {
    getMTime() {
        if (!this._mtime)
            this._updateMTime();
        return this._mtime;
    }
    _getChildrenMTime() {
        const mTimes = this.map(child => child.getTreeMTime());
        const cmTime = this._getCMTime();
        if (cmTime)
            mTimes.push(cmTime);
        const newestTime = Math.max.apply(null, mTimes);
        return this._setCMTime(newestTime || this._getNow())._getCMTime();
    }
    _getCMTime() {
        return this._cmtime;
    }
    _setCMTime(value) {
        this._cmtime = value;
        return this;
    }
    getTreeMTime() {
        const mtime = this.getMTime();
        const cmtime = this._getChildrenMTime();
        return Math.max(mtime, cmtime);
    }
    _expand(thisColumnNumber, extendsColumnNumber) {
        const graph = this.getGraph(thisColumnNumber, extendsColumnNumber);
        const result = new TreeNode();
        graph.forEach(node => result.extend(node));
        return new TreeNode().appendLineAndChildren(this.getLine(), result);
    }
    macroExpand(macroDefKeyword, macroUsageKeyword) {
        const clone = this.clone();
        const defs = clone.findNodes(macroDefKeyword);
        const allUses = clone.findNodes(macroUsageKeyword);
        const zi = clone.getZI();
        defs.forEach(def => {
            const macroName = def.getWord(1);
            const uses = allUses.filter(node => node.hasWord(1, macroName));
            const params = def.getWordsFrom(2);
            const replaceFn = str => {
                const paramValues = str.split(zi).slice(2);
                let newTree = def.childrenToString();
                params.forEach((param, index) => {
                    newTree = newTree.replace(new RegExp(param, "g"), paramValues[index]);
                });
                return newTree;
            };
            uses.forEach(node => {
                node.replaceNode(replaceFn);
            });
            def.destroy();
        });
        return clone;
    }
    setChildren(children) {
        return this._setChildren(children);
    }
    _updateMTime() {
        this._mtime = this._getNow();
    }
    insertWord(index, word) {
        const wi = this.getZI();
        const words = this._getLine().split(wi);
        words.splice(index, 0, word);
        this.setLine(words.join(wi));
        return this;
    }
    deleteDuplicates() {
        const set = new Set();
        this.getTopDownArray().forEach(node => {
            const str = node.toString();
            if (set.has(str))
                node.destroy();
            else
                set.add(str);
        });
        return this;
    }
    setWord(index, word) {
        const wi = this.getZI();
        const words = this._getLine().split(wi);
        words[index] = word;
        this.setLine(words.join(wi));
        return this;
    }
    deleteChildren() {
        return this._clearChildren();
    }
    setContent(content) {
        if (content === this.getContent())
            return this;
        const newArray = [this.getKeyword()];
        if (content !== undefined) {
            content = content.toString();
            if (content.match(this.getYI()))
                return this.setContentWithChildren(content);
            newArray.push(content);
        }
        this._updateMTime();
        return this._setLine(newArray.join(this.getZI()));
    }
    setContentWithChildren(text) {
        // todo: deprecate
        if (!text.includes(this.getYI())) {
            this._clearChildren();
            return this.setContent(text);
        }
        const lines = text.split(this.getYIRegex());
        const firstLine = lines.shift();
        this.setContent(firstLine);
        // tood: cleanup.
        const remainingString = lines.join(this.getYI());
        const children = new TreeNode(remainingString);
        if (!remainingString)
            children.appendLine("");
        this.setChildren(children);
        return this;
    }
    setKeyword(keyword) {
        return this.setWord(0, keyword);
    }
    setLine(line) {
        if (line === this.getLine())
            return this;
        this._updateMTime();
        // todo: clear parent TMTimes
        this.getParent()._clearIndex();
        return this._setLine(line);
    }
    duplicate() {
        return this.getParent()._setLineAndChildren(this.getLine(), this.childrenToString(), this.getIndex() + 1);
    }
    destroy() {
        ;
        this.getParent()._deleteNode(this);
    }
    set(keywordPath, text) {
        return this.touchNode(keywordPath).setContentWithChildren(text);
    }
    setFromText(text) {
        if (this.toString() === text)
            return this;
        const tuple = this._textToContentAndChildrenTuple(text);
        this.setLine(tuple[0]);
        return this._setChildren(tuple[1]);
    }
    appendLine(line) {
        return this._setLineAndChildren(line);
    }
    appendLineAndChildren(line, children) {
        return this._setLineAndChildren(line, children);
    }
    getNodesByRegex(regex) {
        const matches = [];
        regex = regex instanceof RegExp ? [regex] : regex;
        this._getNodesByLineRegex(matches, regex);
        return matches;
    }
    getNodesByLinePrefixes(columns) {
        const matches = [];
        this._getNodesByLineRegex(matches, columns.map(str => new RegExp("^" + str)));
        return matches;
    }
    _getNodesByLineRegex(matches, regs) {
        const rgs = regs.slice(0);
        const reg = rgs.shift();
        const candidates = this.filter(child => child.getLine().match(reg));
        if (!rgs.length)
            return candidates.forEach(cand => matches.push(cand));
        candidates.forEach(cand => cand._getNodesByLineRegex(matches, rgs));
    }
    concat(node) {
        if (typeof node === "string")
            node = new TreeNode(node);
        return node.map(node => this._setLineAndChildren(node.getLine(), node.childrenToString()));
    }
    _deleteByIndexes(indexesToDelete) {
        this._clearIndex();
        // note: assumes indexesToDelete is in ascending order
        indexesToDelete.reverse().forEach(index => this._getChildrenArray().splice(index, 1));
        return this._setCMTime(this._getNow());
    }
    _deleteNode(node) {
        const index = this._indexOfNode(node);
        return index > -1 ? this._deleteByIndexes([index]) : 0;
    }
    reverse() {
        this._clearIndex();
        this._getChildrenArray().reverse();
        return this;
    }
    shift() {
        if (!this.length)
            return null;
        const node = this._getChildrenArray().shift();
        return node.copyTo(new this.constructor(), 0);
    }
    sort(fn) {
        this._getChildrenArray().sort(fn);
        this._clearIndex();
        return this;
    }
    invert() {
        this.forEach(node => node.getWords().reverse());
        return this;
    }
    _rename(oldKeyword, newKeyword) {
        const index = this.indexOf(oldKeyword);
        if (index === -1)
            return this;
        const node = this._getChildren()[index];
        node.setKeyword(newKeyword);
        this._clearIndex();
        return this;
    }
    // Does not recurse.
    remap(map) {
        this.forEach(node => {
            const keyword = node.getKeyword();
            if (map[keyword] !== undefined)
                node.setKeyword(map[keyword]);
        });
        return this;
    }
    rename(oldKeyword, newKeyword) {
        this._rename(oldKeyword, newKeyword);
        return this;
    }
    renameAll(oldName, newName) {
        this.findNodes(oldName).forEach(node => node.setKeyword(newName));
        return this;
    }
    _deleteByKeyword(keyword) {
        if (!this.has(keyword))
            return this;
        const allNodes = this._getChildren();
        const indexesToDelete = [];
        allNodes.forEach((node, index) => {
            if (node.getKeyword() === keyword)
                indexesToDelete.push(index);
        });
        return this._deleteByIndexes(indexesToDelete);
    }
    delete(keyword = "") {
        const xi = this.getXI();
        if (!keyword.includes(xi))
            return this._deleteByKeyword(keyword);
        const parts = keyword.split(xi);
        const nextKeyword = parts.pop();
        const targetNode = this.getNode(parts.join(xi));
        return targetNode ? targetNode._deleteByKeyword(nextKeyword) : 0;
    }
    deleteColumn(keyword = "") {
        this.forEach(node => node.delete(keyword));
        return this;
    }
    // todo: add more testing.
    extend(nodeOrStr) {
        if (!(nodeOrStr instanceof TreeNode))
            nodeOrStr = new TreeNode(nodeOrStr);
        nodeOrStr.forEach(node => {
            const path = node.getKeyword();
            const content = node.getContent();
            const targetNode = this.touchNode(path).setContent(content);
            if (node.length)
                targetNode.extend(node.childrenToString());
        });
        return this;
    }
    replaceNode(fn) {
        const str = fn(this.toString());
        const parent = this.getParent();
        const index = this.getIndex();
        const newNodes = new TreeNode(str);
        const returnedNodes = [];
        newNodes.forEach((child, childIndex) => {
            const newNode = parent.insertLineAndChildren(child.getLine(), child.childrenToString(), index + childIndex);
            returnedNodes.push(newNode);
        });
        this.destroy();
        return returnedNodes;
    }
    insertLineAndChildren(line, children, index) {
        return this._setLineAndChildren(line, children, index);
    }
    insertLine(line, index) {
        return this._setLineAndChildren(line, undefined, index);
    }
    prependLine(line) {
        return this.insertLine(line, 0);
    }
    pushContentAndChildren(content, children) {
        let index = this.length;
        while (this.has(index.toString())) {
            index++;
        }
        const line = index.toString() + (content === undefined ? "" : this.getZI() + content);
        return this.appendLineAndChildren(line, children);
    }
    deleteBlanks() {
        this.getChildren()
            .filter(node => node.isBlankLine())
            .forEach(node => node.destroy());
        return this;
    }
    _touchNode(keywordPathArray) {
        let contextNode = this;
        keywordPathArray.forEach(keyword => {
            contextNode = contextNode.getNode(keyword) || contextNode.appendLine(keyword);
        });
        return contextNode;
    }
    _touchNodeByString(str) {
        str = str.replace(this.getYIRegex(), ""); // todo: do we want to do this sanitization?
        return this._touchNode(str.split(this.getZI()));
    }
    touchNode(str) {
        return this._touchNodeByString(str);
    }
    sortByColumns(indexOrIndices) {
        indexOrIndices = indexOrIndices instanceof Array ? indexOrIndices : [indexOrIndices];
        const length = indexOrIndices.length;
        this.sort((nodeA, nodeB) => {
            const wordsA = nodeA.getWords();
            const wordsB = nodeB.getWords();
            for (let index = 0; index < length; index++) {
                const col = indexOrIndices[index];
                const av = wordsA[col];
                const bv = wordsB[col];
                if (av === undefined)
                    return -1;
                if (bv === undefined)
                    return 1;
                if (av > bv)
                    return 1;
                else if (av < bv)
                    return -1;
            }
            return 0;
        });
        return this;
    }
    sortBy(nameOrNames) {
        nameOrNames = nameOrNames instanceof Array ? nameOrNames : [nameOrNames];
        const length = nameOrNames.length;
        this.sort((nodeA, nodeB) => {
            if (!nodeB.length && !nodeA.length)
                return 0;
            else if (!nodeA.length)
                return -1;
            else if (!nodeB.length)
                return 1;
            for (let index = 0; index < length; index++) {
                const keyword = nameOrNames[index];
                const av = nodeA.get(keyword);
                const bv = nodeB.get(keyword);
                if (av > bv)
                    return 1;
                else if (av < bv)
                    return -1;
            }
            return 0;
        });
        return this;
    }
    static fromCsv(str) {
        return this.fromDelimited(str, ",", '"');
    }
    static fromJson(str) {
        return new TreeNode(JSON.parse(str));
    }
    static fromSsv(str) {
        return this.fromDelimited(str, " ", '"');
    }
    static fromTsv(str) {
        return this.fromDelimited(str, "\t", '"');
    }
    static fromDelimited(str, delimiter, quoteChar) {
        const rows = this._getEscapedRows(str, delimiter, quoteChar);
        return this._rowsToTreeNode(rows, delimiter, true);
    }
    static _getEscapedRows(str, delimiter, quoteChar) {
        return str.includes(quoteChar)
            ? this._strToRows(str, delimiter, quoteChar)
            : str.split("\n").map(line => line.split(delimiter));
    }
    static fromDelimitedNoHeaders(str, delimiter, quoteChar) {
        const rows = this._getEscapedRows(str, delimiter, quoteChar);
        return this._rowsToTreeNode(rows, delimiter, false);
    }
    static _strToRows(str, delimiter, quoteChar, newLineChar = "\n") {
        const rows = [[]];
        const newLine = "\n";
        const length = str.length;
        let currentCell = "";
        let inQuote = str.substr(0, 1) === quoteChar;
        let currentPosition = inQuote ? 1 : 0;
        let nextChar;
        let isLastChar;
        let currentRow = 0;
        let char;
        let isNextCharAQuote;
        while (currentPosition < length) {
            char = str[currentPosition];
            isLastChar = currentPosition + 1 === length;
            nextChar = str[currentPosition + 1];
            isNextCharAQuote = nextChar === quoteChar;
            if (inQuote) {
                if (char !== quoteChar)
                    currentCell += char;
                else if (isNextCharAQuote) {
                    // Both the current and next char are ", so the " is escaped
                    currentCell += nextChar;
                    currentPosition++; // Jump 2
                }
                else {
                    // If the current char is a " and the next char is not, it's the end of the quotes
                    inQuote = false;
                    if (isLastChar)
                        rows[currentRow].push(currentCell);
                }
            }
            else {
                if (char === delimiter) {
                    rows[currentRow].push(currentCell);
                    currentCell = "";
                    if (isNextCharAQuote) {
                        inQuote = true;
                        currentPosition++; // Jump 2
                    }
                }
                else if (char === newLine) {
                    rows[currentRow].push(currentCell);
                    currentCell = "";
                    currentRow++;
                    if (nextChar)
                        rows[currentRow] = [];
                    if (isNextCharAQuote) {
                        inQuote = true;
                        currentPosition++; // Jump 2
                    }
                }
                else if (isLastChar)
                    rows[currentRow].push(currentCell + char);
                else
                    currentCell += char;
            }
            currentPosition++;
        }
        return rows;
    }
    static multiply(nodeA, nodeB) {
        const productNode = nodeA.clone();
        productNode.forEach((node, index) => {
            node.setChildren(node.length ? this.multiply(node, nodeB) : nodeB.clone());
        });
        return productNode;
    }
    // Given an array return a tree
    static _rowsToTreeNode(rows, delimiter, hasHeaders) {
        const numberOfColumns = rows[0].length;
        const treeNode = new TreeNode();
        const names = this._getHeader(rows, hasHeaders);
        const rowCount = rows.length;
        for (let rowIndex = hasHeaders ? 1 : 0; rowIndex < rowCount; rowIndex++) {
            let row = rows[rowIndex];
            // If the row contains too many columns, shift the extra columns onto the last one.
            // This allows you to not have to escape delimiter characters in the final column.
            if (row.length > numberOfColumns) {
                row[numberOfColumns - 1] = row.slice(numberOfColumns - 1).join(delimiter);
                row = row.slice(0, numberOfColumns);
            }
            else if (row.length < numberOfColumns) {
                // If the row is missing columns add empty columns until it is full.
                // This allows you to make including delimiters for empty ending columns in each row optional.
                while (row.length < numberOfColumns) {
                    row.push("");
                }
            }
            const obj = {};
            row.forEach((cellValue, index) => {
                obj[names[index]] = cellValue;
            });
            treeNode.pushContentAndChildren(undefined, obj);
        }
        return treeNode;
    }
    static _initializeXmlParser() {
        if (this._xmlParser)
            return;
        const windowObj = window;
        if (typeof windowObj.DOMParser !== "undefined")
            this._xmlParser = xmlStr => new windowObj.DOMParser().parseFromString(xmlStr, "text/xml");
        else if (typeof windowObj.ActiveXObject !== "undefined" && new windowObj.ActiveXObject("Microsoft.XMLDOM")) {
            this._xmlParser = xmlStr => {
                const xmlDoc = new windowObj.ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                xmlDoc.loadXML(xmlStr);
                return xmlDoc;
            };
        }
        else
            throw new Error("No XML parser found");
    }
    static fromXml(str) {
        this._initializeXmlParser();
        const xml = this._xmlParser(str);
        try {
            return this._treeNodeFromXml(xml).getNode("children");
        }
        catch (err) {
            return this._treeNodeFromXml(this._parseXml2(str)).getNode("children");
        }
    }
    static _zipObject(keys, values) {
        const obj = {};
        keys.forEach((key, index) => (obj[key] = values[index]));
        return obj;
    }
    static fromShape(shapeArr, rootNode = new TreeNode()) {
        const part = shapeArr.shift();
        if (part !== undefined) {
            for (let index = 0; index < part; index++) {
                rootNode.appendLine(index.toString());
            }
        }
        if (shapeArr.length)
            rootNode.forEach(node => TreeNode.fromShape(shapeArr.slice(0), node));
        return rootNode;
    }
    static fromDataTable(table) {
        const header = table.shift();
        return new TreeNode(table.map(row => this._zipObject(header, row)));
    }
    static _parseXml2(str) {
        const el = document.createElement("div");
        el.innerHTML = str;
        return el;
    }
    static _treeNodeFromXml(xml) {
        const result = new TreeNode();
        const children = new TreeNode();
        // Set attributes
        if (xml.attributes) {
            for (let index = 0; index < xml.attributes.length; index++) {
                result.set(xml.attributes[index].name, xml.attributes[index].value);
            }
        }
        if (xml.data)
            children.pushContentAndChildren(xml.data);
        // Set content
        if (xml.childNodes && xml.childNodes.length > 0) {
            for (let index = 0; index < xml.childNodes.length; index++) {
                const child = xml.childNodes[index];
                if (child.tagName && child.tagName.match(/parsererror/i))
                    throw new Error("Parse Error");
                if (child.childNodes.length > 0 && child.tagName)
                    children.appendLineAndChildren(child.tagName, this._treeNodeFromXml(child));
                else if (child.tagName)
                    children.appendLine(child.tagName);
                else if (child.data) {
                    const data = child.data.trim();
                    if (data)
                        children.pushContentAndChildren(data);
                }
            }
        }
        if (children.length > 0)
            result.touchNode("children").setChildren(children);
        return result;
    }
    static _getHeader(rows, hasHeaders) {
        const numberOfColumns = rows[0].length;
        const headerRow = hasHeaders ? rows[0] : [];
        const ZI = " ";
        const ziRegex = new RegExp(ZI, "g");
        if (hasHeaders) {
            // Strip any ZIs from column names in the header row.
            // This makes the mapping not quite 1 to 1 if there are any ZIs in names.
            for (let index = 0; index < numberOfColumns; index++) {
                headerRow[index] = headerRow[index].replace(ziRegex, "");
            }
        }
        else {
            // If str has no headers, create them as 0,1,2,3
            for (let index = 0; index < numberOfColumns; index++) {
                headerRow.push(index.toString());
            }
        }
        return headerRow;
    }
    static nest(str, xValue) {
        const YI = "\n";
        const XI = " ";
        const indent = YI + XI.repeat(xValue);
        return str ? indent + str.replace(/\n/g, indent) : "";
    }
}
exports.default = TreeNode;