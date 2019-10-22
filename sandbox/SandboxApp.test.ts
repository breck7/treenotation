#!/usr/bin/env ts-node

const { SandboxApp } = require("./SandboxApp")

const { jtree } = require("../index.js")

const testTree: any = {}

testTree.basics = (equal: any) => {
  const app = new SandboxApp()
  equal(!!app, true)
}

/*NODE_JS_ONLY*/ if (!module.parent) new jtree.Utils.TestRacer().runAndDone(__filename, testTree)
export { testTree }
