#!/usr/bin/env node

'use strict';
/* --execute=node-- */


//---------//
// Imports //
//---------//

var commander = require('commander')
    , GDT = require('../lib-core/index.js');


//------//
// Init //
//------//

var gdtInst = new GDT();


//------//
// Main //
//------//

commander
    .version('0.1.0')
    .usage('<file>')
    .parse(process.argv);

if (commander.args.length != 1) {
    console.log(commander.helpInformation());
    return;
}

gdtInst.FileName(commander.args[0])
    .generate();
