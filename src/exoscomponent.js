const { Datamodel } = require('./datamodel');
const { ExosPackage } = require('./exospackage');

let ex = new ExosPackage("my");
let lib = ex.getNewCLibrary("one","two");
lib.getNewFile()

let dm = new Datamodel();

class ExosComponent {
    constructor() {

    }
}

module.exports = {ExosComponent};