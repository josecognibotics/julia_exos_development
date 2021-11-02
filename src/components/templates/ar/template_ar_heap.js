const {GeneratedFileObj} = require('../../../datamodel')

class TemplateARHeap {

    /**
     * declaration file added to AS objects to enable the dynamic heap and additional linking
     * @type {GeneratedFileObj}
     */
    heapSource;

    /**
     * Generates a {@link GeneratedFileObj} to enable additional linking within a library or C/C++ program (as well as setting the dynamic heap size)
     * - {@linkcode heapSource} declaring the dynamic heap
     * 
     * @param {number} heapSize size of the dynamic heap (`bur_heap_size`) in bytes
     */
    constructor(heapSize) {
        if(heapSize === undefined || heapSize == 0) {
            heapSize = 100000; //allocate 100k as default
        }
        this.heapSource = {name:"heapsize.cpp", contents:`unsigned long bur_heap_size = ${heapSize};\n`, description:"Dynamic heap configuration"};
    }
}

module.exports = {TemplateARHeap};