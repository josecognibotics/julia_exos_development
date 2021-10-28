import { Datamodel } from './datamodel';
import { ExosPackage } from './exospackage';

let ex = new ExosPackage("my");
let lib = ex.getNewCLibrary("one","two");
lib.getNewFile()

class ExosComponent {
    constructor() {

    }
}

export default {ExosComponent};