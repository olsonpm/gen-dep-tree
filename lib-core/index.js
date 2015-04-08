'use strict';
/* --execute=node-- */

var mdeps = require('module-deps')
    , JSONStream = require('JSONStream')
    , path = require('path')
    , concatStream = require('concat-stream')
    , lazy = require('lazy.js')
    , commondir = require('commondir')
    , repeatString = require('repeat-string')
    , fs = require('fs');

// Taken from async-resolve:
var CORE_MODULES_LIST = {
    '_debugger': true
    , '_linklist': true
    , '_stream_duplex': true
    , '_stream_passthrough': true
    , '_stream_readable': true
    , '_stream_transform': true
    , '_stream_writable': true
    , 'assert': true
    , 'buffer': true
    , 'child_process': true
    , 'cluster': true
    , 'console': true
    , 'constants': true
    , 'crypto': true
    , 'dgram': true
    , 'dns': true
    , 'domain': true
    , 'events': true
    , 'freelist': true
    , 'fs': true
    , 'http': true
    , 'https': true
    , 'module': true
    , 'net': true
    , 'os': true
    , 'path': true
    , 'punycode': true
    , 'querystring': true
    , 'readline': true
    , 'repl': true
    , 'stream': true
    , 'string_decoder': true
    , 'sys': true
    , 'timers': true
    , 'tls': true
    , 'tty': true
    , 'url': true
    , 'util': true
    , 'vm': true
    , 'zlib': true
};

function GDT() {
    var self = this;

    var my = {
        FileName: null
    };

    this.FileName = function FileName(filename_) {
        var res = my.FileName;
        if (arguments.length > 0) {
            if (filename_ !== null) {
                GDT.ValidateFileName(filename_, true);
            }
            my.FileName = filename_;
            res = self;
        }
        return res;
    };
}

GDT.ValidateFileName = function ValidateFileName(input, throwErr) {
    var msg = '';
    if (typeof input !== 'string') {
        msg = 'Invalid Argument: <GDT>.ValidateFileName requires a typeof string argument';
    } else if (!fs.existsSync(path.resolve(input))) {
        msg = 'Invalid Argument: file "' + path.resolve(input) + '" doesn' + "'" + 't exist';
    }

    if (throwErr && msg) {
        throw new Error(msg);
    }

    return msg;
};

GDT.prototype.generate = function generate() {
    var buf = new Buffer('');
    var allDeps = lazy([]);

    var md = mdeps({
        includeSource: false
    });
    var resDeps = [];

    md.pipe(JSONStream.stringify()).pipe(concatStream(function(res) {
        allDeps = lazy(JSON.parse(res));
        var entry = allDeps.findWhere({
            'entry': true
        });

        compileDeps(entry, 0);

        var resDepFiles = resDeps.map(function(aDep) {
            return aDep.file;
        });
        var common = commondir(resDepFiles);

        resDeps.forEach(function(aDep) {
            console.log(repeatString('  ', aDep.lv) + aDep.file.replace(common, ''));
        });
    }));
    md.write(path.resolve(this.fileName));
    md.end();

    function compileDeps(dep, lv) {
        resDeps.push({
            file: dep.file, lv: lv
        });
        lv += 1;

        var localDeps = dep.deps;
        if (lv < 5) {
            Object.keys(localDeps).forEach(function(aDep) {
                // skip core modules
                if (CORE_MODULES_LIST[aDep]) {
                    return;
                }

                var fileName = localDeps[aDep];
                var newDep = allDeps.findWhere({
                    'id': fileName
                });

                if (!newDep) {
                    console.error('error: dep not found - ' + aDep);
                    process.exit(1);
                }
                compileDeps(newDep, lv);
            });
        }
    }
};


//---------//
// Exports //
//---------//

module.exports = GDT;
