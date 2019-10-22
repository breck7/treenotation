#!/usr/bin/env ts-node

const { DesignerApp } = require("./DesignerApp")

const { jtree } = require("../index.js")

const testTree: any = {}

testTree.basics = (equal: any) => {
  const app = new DesignerApp()
  equal(true, true) // todo: add tests
}

/*NODE_JS_ONLY*/ if (!module.parent) new jtree.Utils.TestRacer().runAndDone(__filename, testTree)
export { testTree }
