const TreeNode = require("../TreeNode.js")
const TreeNonTerminalNode = require("../TreeNonTerminalNode.js")
const TreeTerminalNode = require("../TreeTerminalNode.js")
const TreeErrorNode = require("../TreeErrorNode.js")

const TreeUtils = require("../TreeUtils.js")
const GrammarConstants = require("./GrammarConstants.js")

const GrammarDefinitionErrorNode = require("./GrammarDefinitionErrorNode.js")
const GrammarParserClassNode = require("./GrammarParserClassNode.js")
const GrammarCompilerNode = require("./GrammarCompilerNode.js")
const GrammarConstantsNode = require("./GrammarConstantsNode.js")

class AbstractGrammarDefinitionNode extends TreeNode {
  getKeywordMap() {
    const types = [
      GrammarConstants.frequency,
      GrammarConstants.keywords,
      GrammarConstants.columns,
      GrammarConstants.description,
      GrammarConstants.catchAllKeyword,
      GrammarConstants.defaults,
      GrammarConstants.ohayoSvg,
      GrammarConstants.ohayoTileSize,
      GrammarConstants.ohayoTileClass,
      GrammarConstants.ohayoTileScript,
      GrammarConstants.ohayoTileCssScript
    ]
    const map = {}
    types.forEach(type => {
      map[type] = TreeNode
    })
    map[GrammarConstants.constants] = GrammarConstantsNode
    map[GrammarConstants.compilerKeyword] = GrammarCompilerNode
    map[GrammarConstants.parser] = GrammarParserClassNode
    return map
  }

  isNonTerminal() {
    return this.has(GrammarConstants.keywords)
  }

  _getNodeClasses() {
    const builtIns = {
      ErrorNode: TreeErrorNode,
      TerminalNode: TreeTerminalNode,
      NonTerminalNode: TreeNonTerminalNode
    }

    Object.assign(builtIns, this.getProgram().getRootNodeClasses())
    return builtIns
  }

  getParserClass() {
    this._initParserClassCache()
    return this._cache_parserClass
  }

  _getDefaultParserClass() {
    return this.isNonTerminal() ? TreeNonTerminalNode : TreeTerminalNode
  }

  _getParserClassFromFilePath(filepath) {
    const rootPath = this.getRootNode().getTheGrammarFilePath() // todo:remove this line
    const basePath = TreeUtils.getPathWithoutFileName(rootPath) + "/"
    const fullPath = filepath.startsWith("/") ? filepath : basePath + filepath
    // todo: remove "window" below?
    return this.isNodeJs() ? require(fullPath) : window[TreeUtils.getClassNameFromFilePath(filepath)]
  }

  // todo: cleanup
  _initParserClassCache() {
    if (this._cache_parserClass) return undefined
    const parserNode = this.getNodeByColumns(GrammarConstants.parser, GrammarConstants.parserJs)
    const filepath = parserNode ? parserNode.getParserClassFilePath() : undefined

    const builtIns = this._getNodeClasses()
    const builtIn = builtIns[filepath]

    this._cache_parserClass = builtIn
      ? builtIn
      : filepath ? this._getParserClassFromFilePath(filepath) : this._getDefaultParserClass()
  }

  getCatchAllNodeClass(line) {
    return GrammarDefinitionErrorNode
  }

  getProgram() {
    return this.getParent()
  }

  getDefinitionCompilerNode(targetLanguage, node) {
    const compilerNode = this._getCompilerNodes().find(node => node.getTargetExtension() === targetLanguage)
    if (!compilerNode) throw new Error(`No compiler for language "${targetLanguage}" for line "${node.getLine()}"`)
    return compilerNode
  }

  _getCompilerNodes() {
    return this.getChildrenByNodeType(GrammarCompilerNode) || []
  }

  // todo: remove?
  // for now by convention first compiler is "target extension"
  getTargetExtension() {
    const firstNode = this._getCompilerNodes()[0]
    return firstNode ? firstNode.getTargetExtension() : ""
  }

  getRunTimeKeywordMap() {
    this._initKeywordsMapCache()
    return this._cache_keywordsMap
  }

  getRunTimeKeywordNames() {
    return Object.keys(this.getRunTimeKeywordMap())
  }

  getRunTimeKeywordMapWithDefinitions() {
    const defs = this._getDefinitionCache()
    return TreeUtils.mapValues(this.getRunTimeKeywordMap(), key => defs[key])
  }

  getBeamParameters() {
    const parameters = this.findBeam(GrammarConstants.columns)
    return parameters ? parameters.split(" ") : []
  }

  _initKeywordsMapCache() {
    if (this._cache_keywordsMap) return undefined
    // todo: make this handle extensions.
    const allDefs = this._getDefinitionCache()
    const keywordMap = {}
    this._cache_keywordsMap = keywordMap
    const acceptableKeywords = this.getAllowableKeywords()
    // terminals dont have acceptable keywords
    if (!Object.keys(acceptableKeywords).length) return undefined
    const matching = Object.keys(allDefs).filter(key => allDefs[key].isAKeyword(acceptableKeywords))

    matching.forEach(key => {
      keywordMap[key] = allDefs[key].getParserClass()
    })
  }

  getAllowableKeywords() {
    const keywords = this._getKeyWordsNode()
    return keywords ? keywords.toObject() : {}
  }

  getTopNodeTypes() {
    const definitions = this._getDefinitionCache()
    const keywords = this.getRunTimeKeywordMap()
    const arr = Object.keys(keywords).map(keyword => definitions[keyword])
    arr.sort(AbstractGrammarDefinitionNode.sortByAccessor(definition => definition.getFrequency()))
    arr.reverse()
    return arr.map(definition => definition.getKeyword())
  }

  getDefinitionByName(keyword) {
    const definitions = this._getDefinitionCache()
    return definitions[keyword] || this._getCatchAllDefinition() // todo: this is where we might do some type of keyword lookup for user defined fns.
  }

  _getCatchAllDefinition() {
    const catchAllKeyword = this._getRunTimeCatchAllKeyword()
    const definitions = this._getDefinitionCache()
    const def = definitions[catchAllKeyword]
    // todo: implement contraints like a grammar file MUST have a catch all.
    return def ? def : this.getParent()._getCatchAllDefinition()
  }

  _initCatchCallNodeCache() {
    if (this._cache_catchAll) return undefined

    this._cache_catchAll = this._getCatchAllDefinition().getParserClass()
  }

  getAutocompleteWords(inputStr, additionalWords = []) {
    // todo: add more tests
    const str = this.getRunTimeKeywordNames()
      .concat(additionalWords)
      .join("\n")

    // default is to just autocomplete using all words in existing program.
    return TreeUtils.getUniqueWordsArray(str)
      .filter(obj => obj.word.includes(inputStr) && obj.word !== inputStr)
      .map(obj => obj.word)
  }

  isDefined(keyword) {
    return !!this._getDefinitionCache()[keyword.toLowerCase()]
  }

  getRunTimeCatchAllNodeClass() {
    this._initCatchCallNodeCache()
    return this._cache_catchAll
  }
}

module.exports = AbstractGrammarDefinitionNode
