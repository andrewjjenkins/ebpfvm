"use strict";
const fs = require('fs');
const path = require('path');
const jison = require('jison');
const jisonCli = require('jison/lib/cli');

const parserFile = "src/vm/parser/ebpf.jison";
const parserName = "ebpf";
const parserOutFile = "src/vm/parser/ebpf.js";

const raw = fs.readFileSync(path.normalize(parserFile), "utf8");

const opts = {
    moduleName: parserName,
    outfile: parserOutFile,
    json: false,
};

function generateParserString(opts, grammar) {
    "use strict";
    var settings = grammar.options || {};

    if (opts['parser-type']) {
        settings.type = opts['parser-type'];
    }
    if (opts.moduleName) {
        settings.moduleName = opts.moduleName;
    }
    settings.debug = opts.debug;
    if (!settings.moduleType) {
        settings.moduleType = opts['module-type'];
    }
    settings.moduleMain = function () {
        throw new Error("Unimplemented");
    };

    var generator = new jison.Generator(grammar, settings);
    return generator.generate(settings);
}

const grammar = jisonCli.processGrammars(raw, undefined, opts.json);
const parser = generateParserString(opts, grammar);
fs.writeFileSync(parserOutFile, parser);
