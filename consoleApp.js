const TreeProgram = require("./index.js")
const fs = require("fs")

class ConsoleApp {
  constructor(languagesObj = {}) {
    this._languages = languagesObj
  }

  getLanguages() {
    return this._languages
  }

  help() {
    const commands = [
      "help - Show help",
      "compile [programPath] - Compile a file",
      "check [programPath] - Check a file for grammar errors",
      "run [programPath] - Execute a Tree Language Program",
      "create [languageName] - Create a new Tree Language",
      "list - List installed Tree Languages",
      "version - List installed Tree Notation version"
    ]
    commands.sort()
    console.log("The following commands are available:")
    console.log(commands.join("\n"))
  }

  list() {
    const languages = Object.keys(this.getLanguages())
    languages.sort()
    console.log("The following Tree Languages are installed on your system:")
    const ssv = TreeProgram.fromSsv("language path\n" + new TreeProgram(this.getLanguages()).toString())
    console.log(ssv.toTable())
  }

  create(languageName) {
    // const stampProgramCode = `define LANG ${languageName}\n` + fs.readFileSync(__dirname + "/create.stamp", "utf8")
    // fs.mkdirSync(languageName)
    // todo: create template
    console.log("not implemented yet")
  }

  check(programPath) {
    const languagePath = this._getLanguagePathOrThrow(programPath)
    const program = TreeProgram.makeProgram(programPath, languagePath)
    const errors = program.getProgramErrors()
    console.log(`${errors.length} errors for ${programPath} with grammar ${languagePath}`)
    if (errors.length) console.log(errors)
  }

  _getLanguagePathOrThrow(programPath) {
    const extension = ConsoleApp._getFileExtension(programPath)
    const languagePath = this.getLanguages()[extension]
    if (!languagePath) throw new Error(`No installed language for '${extension}'`)
    return languagePath
  }

  compile(programPath) {
    // todo: allow user to provide destination
    const languagePath = this._getLanguagePathOrThrow(programPath)
    const program = TreeProgram.makeProgram(programPath, languagePath)
    const path = program.getCompiledProgramName(programPath)
    const compiledCode = program.compile()
    fs.writeFileSync(path, compiledCode, "utf8")
  }

  _logProgramPath(programPath) {
    // everytime you run/check/compile a tree program, log it by default.
    // that way, if a language changes or you need to do refactors, you have the
    // data of file paths handy..
  }

  run(programPath) {
    this._logProgramPath(programPath)
    const languagePath = this._getLanguagePathOrThrow(programPath)
    return TreeProgram.executeFile(programPath, languagePath)
  }

  version() {
    console.log(`TreeProgram version ${TreeProgram.getVersion()}`)
  }

  static _getFileExtension(url = "") {
    url = url.match(/\.([^\.]+)$/)
    return (url && url[1]) || ""
  }
}

module.exports = ConsoleApp
