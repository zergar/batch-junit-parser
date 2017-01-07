'use strict';

const fs_prom = require('fs-promise'),
    path = require('path'),
    xml2js = require('xml2js');

const exemptDirsDef = ['test-classes', 'config', 'node_modules', 'feedback'];

const parser = new xml2js.Parser();

let basePathGlobal;

let exemptDirsGlobal;

let parseXml = (xml) => {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err, res) => {
            let cases = res.testsuite.testcase;
            let casesMap = cases.map(curr => {
                let out = {};
                out['exercise'] = curr.$.name;
                out['success'] = !('failure' in curr);
                return out;
            });

            resolve(casesMap);
        })
    })
};


let readDir = (stat, file) => {
    return new Promise((resolve, reject) => {
        if (stat.isDirectory()) {
            fs_prom.readFile(path.join(basePathGlobal, file, 'result.xml'), {encoding: 'utf8'})
                .then(parseXml)
                .then(result => {
                    result['name'] = file;
                    return resolve(result)
                })
                .catch(console.error);
        } else {
            resolve(null);
        }
    })
};


let checkForDirectory = (file) => {
    return new Promise((resolve, reject) => {
        fs_prom.stat(path.join(basePathGlobal, file))
            .then(stat => readDir(stat, file))
            .then(resolve)
            .catch(console.error)
    })
};


let iterateOverFiles = (files) => {
    return new Promise((resolve, reject) => {
        let filtered = files.filter(file => exemptDirsGlobal.indexOf(file) < 0);
        Promise.all(filtered.map(checkForDirectory))
            .then(result => resolve(result.filter(c => c)))
            .catch(console.error)
    })
};

let parseXmlOut = (basePath, exemptDirs) => {
    exemptDirsGlobal = exemptDirs || exemptDirsDef;
    basePathGlobal = basePath;
    return new Promise((resolve, reject) => {
        fs_prom.readdir(basePath)
            .then(iterateOverFiles)
            .then(resolve)
            .catch(console.error);
    })
};



module.exports = {
    parseXml: parseXmlOut
};