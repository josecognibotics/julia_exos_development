#!/usr/bin/env node

const header = require('../exos_header');
const fs = require('fs');
const { features } = require('process');

function generateGitAttributes() {
    let out = "";

    out += `# Autodetect text files and set to crlf\n`;
    out += `* text=auto eol=crlf\n`;
    out += `\n`;
    out += `# ...Unless the name matches the following overriding patterns\n`;
    out += `*.sh text eol=lf\n`;
    out += `Linux/* text eol=lf\n`;

    return out;
}

function generateGitIgnore(extra) {
    let out = "";

    out += `build/\n`;
    out += `*.bak\n`;
    out += `*.ori\n`;
    out += `exos-comp-*.deb\n`;
    if(extra != undefined && extra != null && extra != "" && Array.isArray(extra)) {
        extra.forEach(function(elem) { 
            out += `${elem}\n`;
        })
    }
    out += `\n`;

    return out; 
}

module.exports = {
    generateGitAttributes,
    generateGitIgnore
}
