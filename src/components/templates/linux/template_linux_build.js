/**
 * Linux Build template class
 * 
 * This class covers different build alternatives for linux
 * sources within exOS packages
 * 
 * @typedef {Object} BuildOptionsPackageVersion
 * @property {number} major default: `1`
 * @property {number} minor default: `0`
 * @property {number} patch default: `0`
 *  
 * @typedef {Object} BuildOptionsDebPackage
 * @property {boolean} enable whether or not a deb package should be created. default: `true`
 * @property {BuildOptionsVersion} version version number of the package
 * @property {string} packageName name of the package. default: `exos-comp-` + `name`
 * @property {string} fileName (read only) filename of the generated package. set to `packageName` + `_{version}_amd64.deb`. If enabled, this file is copied out and needs to be added as existing file to the LinuxPackage.
 * @property {string} destination destination of the generated executable / library. default: `/home/user` + `name`
 * @property {string} summary default: `name` + ` summary`
 * @property {string} description default: `Some description`
 * @property {string} vendor default: `Your Company`
 * @property {string} maintainer default: `Your Name`
 * 
 * @typedef {Object} BuildOptionsStaticLibrary
 * @property {boolean} enable whether or not a static library should be built. mutually exclusive with `napi` and `swigPython`. default: `false`
 * @property {string} libraryName name of the library. default: `lib` + `name`. in case `debPackage`is disabled, this file is copied out and needs to be added as existing file to the LinuxPackage
 * @property {string[]} sourceFiles list of source files used to build the library. default: [] 
 *
 * @typedef {Object} BuildOptionsExecutable
 * @property {boolean} enable whether or not an executable should be created. mutually exclusive with `napi` and `swigPython`. default: `false`
 * @property {BuildOptionsLibrary} staticLibrary build options for creating a static library, if enabled, the `executable` will be linked to this library
 * @property {string} executableName name of the executable. default: `name`. in case `debPackage`is disabled, this file is copied out and needs to be added as existing file to the LinuxPackage
 * @property {string[]} sourceFiles list of source files used to build the executable. default: [] 
 * 
 * @typedef {Object} BuildOptionsSWIGPython
 * @property {boolean} enable whether or not a SWIG python module should be created. mutually exclusive with `executable`, and `napi`. default: `false`
 * @property {string[]} sourceFiles list of source files used to build the module. default: [] 
 * @property {string} moduleName name of the module that the sources are built into. default: `lib` + `Name`
 * @property {string} soFileName (read only) name of the generated .so file. in case `debPackage`is disabled, this file is copied out and needs to be added as existing file to the LinuxPackage
 * @property {string} pyFileName (read only) name of the generated .py file. in case `debPackage`is disabled, this file is copied out and needs to be added as existing file to the LinuxPackage
 * 
 * @typedef {Object} BuildOptionsNAPI
 * @property {boolean} enable whether or not a N-API nodejs module should be created. mutually exclusive with `executable`, and `swigPython`. default: `false`
 * @property {boolean} includeNodeModules `true` if the `node_modules` folder should be added to the package. default: `true`
 * @property {string[]} sourceFiles list of source files used to build the module. default: [] 
 * @property {string} nodeFileName (read only) name of the generated .node module. in case `debPackage`is disabled, this file is copied out and needs to be added as existing file to the LinuxPackage
 * 
 * @typedef {Object} BuildOptions
 * @property {string} buildType  `Debug` | `Release` | `RelWithDebInfo` | `MinSizeRel`. default: `Debug`
 * @property {BuildOptionsExecutable} executable build options for creating an executable
 * @property {BuildOptionsSWIGPython} swigPython build options for creating a SWIG python module
 * @property {BuildOptionsNAPI} napi build options for creating a N-API nodejs module.
 * @property {BuildOptionsDebPackage} debPackage build options for creating a deb package, if enabled, all needed files will be added to the package
 * 
 */
class TemplateLinuxBuild {
    
    /**
     * Options for controlling the output of the generator functions
     * @type {BuildOptions}
     */
    options;
    
    /**general name for objects, this name will be converted to lowercase or uppercase as needed. It is used for creating default values for the options structure,
     * however the options structure is not updated with preset names based on `name` when generating CMakeLists os ShBuild
     * @type {string}
     */
    name;

    /**
     * @param {string} name general name for objects, this name will be converted to lowercase or uppercase as needed
     */
    constructor(name) {
        this.name = name;
        this.options = {
            buildType: "Debug",
            executable: {
                enable: false,
                executableName: name.toLowerCase(),
                sourceFiles: [],
                staticLibrary: {
                    enable: false,
                    libraryName: `lib${name.toLowerCase()}`,
                    sourceFiles: []
                },
            },
            swigPython: {
                enable: false,
                sourceFiles: [],
                moduleName: `lib${this.name}`,
                soFileName: `_lib${this.name}.so`,
                pyFileName: `lib${this.name}.py`
            },
            napi: {
                enable: false,
                includeNodeModules: true,
                sourceFiles: [],
                nodeFileName: `l_${this.name}.node`
            },
            debPackage: {
                enable: true,
                version: {
                    major: 1,
                    minor: 0,
                    patch: 0
                },
                packageName: `exos-comp-${name.toLowerCase()}`,
                fileName: `exos-comp-${name.toLowerCase()}_1.0.0_amd64.deb`,
                destination: `/home/user/${name.toLowerCase()}`,
                summary: `${name} summary`,
                description: `Some description`,
                vendor: `Your Company`,
                maintainer: `Your Name`
            }
        }
    }

    /**
     * Use the build `options` to configure the CMake file
     * 
     * @returns {string} the contents of the generated CMakeLists.txt
     */
    generateCMakeLists() {
        let out = "";

        out += `cmake_minimum_required(VERSION 3.0)\n`;
        out += `\n`;
        out += `project(${this.name.toLowerCase()})\n`;
        out += `\n`;
        out += `set(CMAKE_BUILD_TYPE ${this.options.buildType})\n`;

        if(this.options.napi.enable) {
            
            if(this.options.debPackage.enable) {
                out += `\n`;
                out += `set(${this.name.toUpperCase()}_MODULE_FILES\n`;
                out += `    ${this.options.napi.nodeFileName}\n`;
                for (const source of this.options.napi.sourceFiles) {
                    out += `    ${source}\n`;
                }
                out += `    )\n`;
                out += `\n`;
                out += `install(FILES \${${this.name.toUpperCase()}_MODULE_FILES} DESTINATION ${this.options.debPackage.destination})\n`;
                out += `install(DIRECTORY node_modules DESTINATION ${this.options.debPackage.destination})\n`;
            }
        }
        else if(this.options.swigPython.enable) {
            this.options.swigPython.soFileName = `_${this.options.swigPython.moduleName}.so`;
            this.options.swigPython.pyFileName = `${this.options.swigPython.moduleName}.py`;

            out += `find_package(SWIG REQUIRED)\n`;
            out += `include(\${SWIG_USE_FILE})\n`;
            out += `\n`;
            out += `# Load Python Libraries\n`;
            out += `# ---------------------\n`;
            out += `# a.) use Python 2.7 to avoid version conflicts\n`;
            out += `find_package(PythonLibs)\n`;
            out += `# b.) use Python 3 from the distro (same distro used on the target)\n`;
            out += `# find_package(PythonLibs 3)\n`;
            out += `# c.) use pyenv to manually install a version matching the Python version on the target distro https://realpython.com/intro-to-pyenv/\n`;
            out += `# set(PYTHON_INCLUDE_PATH ~/.pyenv/versions/3.5-dev/include/python3.5m)\n`;
            out += `# set(PYTHON_LIBRARIES ~/.pyenv/versions/3.5-dev/lib/libpython3.5m.so)\n`;
            out += `\n`;
            out += `include_directories(\${PYTHON_INCLUDE_PATH})\n`;
            out += `\n`;
            out += `include_directories(\${CMAKE_CURRENT_SOURCE_DIR})\n`;
            out += `\n`;
            out += `set(CMAKE_SWIG_FLAGS "")\n`;
            out += `\n`;
            out += `set(${this.name.toUpperCase()}_SOURCES\n`;
            for (const source of this.options.swigPython.sourceFiles) {
                out += `    ${source}\n`;
            }
            out += `    )\n`;
            out += `\n`;
            out += `set_source_files_properties(\${${this.name.toUpperCase()}_SOURCES} PROPERTIES CPLUSPLUS ON)\n`;
            out += `\n`;
            out += `swig_add_module(${this.options.swigPython.moduleName} python \${${this.name.toUpperCase()}_SOURCES})\n`;
            out += `swig_link_libraries(${this.options.swigPython.moduleName} \${PYTHON_LIBRARIES} zmq exos-api)\n`;

            if(this.options.debPackage.enable) {
                out += `\n`;
                out += `set(${this.name.toUpperCase()}_MODULE_FILES\n`;
                out += `    ${this.options.swigPython.soFileName}\n`;
                out += `    ${this.options.swigPython.pyFileName}\n`;
                out += `    )\n`;
                out += `\n`;
                out += `install(FILES \${${typName.toUpperCase()}_MODULE_FILES} DESTINATION ${this.options.debPackage.destination})\n`;
            }
        }
        else if(this.options.executable.enable) {
            if(this.options.executable.staticLibrary.enable) {
                out += `add_library(${this.options.executable.staticLibrary.libraryName} STATIC`;
                for (const source of this.options.executable.staticLibrary.sourceFiles) {
                    out += ` ${source}`;
                }
                out += `)\n`;
                out += `target_include_directories(${this.options.executable.staticLibrary.libraryName} PUBLIC ..)\n`;
            }
            out += `add_executable(${this.options.executable.executableName}`;
            for (const source of this.options.executable.sourceFiles) {
                out += ` ${source}`;
            }
            out += `)\n`;
            out += `target_include_directories(${this.options.executable.executableName} PUBLIC ..)\n`;
            if(this.options.executable.staticLibrary.enable) {
                out += `target_link_libraries(${this.options.executable.executableName} ${this.options.executable.staticLibrary.libraryName} zmq exos-api)\n`;
            }
            else {
                out += `target_link_libraries(${this.options.executable.executableName} zmq exos-api)\n`;
            }
            if(this.options.debPackage.enable) {
                out += `\n`;
                out += `install(TARGETS ${this.options.executable.executableName} RUNTIME DESTINATION ${this.options.debPackage.destination})\n`;
            }
        }

        if(this.options.debPackage.enable) {
            this.options.debPackage.fileName = `${this.options.debPackage.packageName}_${this.options.debPackage.version.major}.${this.options.debPackage.version.minor}.${this.options.debPackage.version.patch}_amd64.deb`;

            out += `\n`;
            out += `set(CPACK_GENERATOR "DEB")\n`;
            out += `set(CPACK_PACKAGE_NAME ${this.options.debPackage.packageName})\n`;
            out += `set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${this.options.debPackage.summary}")\n`;
            out += `set(CPACK_PACKAGE_DESCRIPTION "${this.options.debPackage.description}")\n`;
            out += `set(CPACK_PACKAGE_VENDOR "${this.options.debPackage.vendor}")\n`;
            out += `\n`;
            out += `set(CPACK_PACKAGE_VERSION_MAJOR ${this.options.debPackage.version.major})\n`;
            out += `set(CPACK_PACKAGE_VERSION_MINOR ${this.options.debPackage.version.minor})\n`;
            out += `set(CPACK_PACKAGE_VERSION_PATCH ${this.options.debPackage.version.patch})\n`;

            out += `set(CPACK_PACKAGE_FILE_NAME ${this.options.debPackage.fileName})\n`;

            out += `set(CPACK_DEBIAN_PACKAGE_MAINTAINER "${this.options.debPackage.maintainer}")\n`;
            out += `\n`;
            out += `set(CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON)\n`;
            out += `\n`;
            out += `include(CPack)\n`;
            out += `\n`;
        }

        return out;
    }

    /**
     * Use the build `options` to configure the buildscript
     * 
     * @returns {string} the contents of generated build.sh file
     */
    generateShBuild() {
        let out = "";
        
        out += `#!/bin/sh\n\n`;

        if(this.options.napi.enable) {
            
            out += `finalize() {\n`;
            out += `    rm -rf build/*\n`;
            out += `    rm -rf node_modules/*\n`;
            out += `    rm -f Makefile\n`;
            out += `    sync\n`;
            out += `    exit $1\n`;
            out += `}\n\n`;
        
            out += `mkdir build > /dev/null 2>&1\n`;
        
            out += `rm -f l_*.node\n`;
            out += `rm -f *.deb\n\n`;
        
            out += `npm install\n`;
            out += `if [ "$?" -ne 0 ] ; then\n`;
            out += `    finalize 1\n`;
            out += `fi\n\n`;
        
            out += `cp -f build/Release/l_*.node .\n\n`;
            
            out += `mkdir -p node_modules #make sure the folder exists even if no submodules are needed\n\n`;
        
            out += `rm -rf build/*\n`;
        
            out += `cd build\n\n`;
            
            if(this.options.debPackage.enable) {
                out += `cmake -Wno-dev ..\n`;
                out += `if [ "$?" -ne 0 ] ; then\n`;
                out += `    finalize 2\n`;
                out += `fi\n\n`;
            }
        }
        else {
            out += `finalize() {\n`;
            out += `    cd ..\n`;
            out += `    rm -rf build/*\n`;
            out += `    rm -r build\n`;
            out += `    sync\n`;
            out += `    exit $1\n`;
            out += `}\n\n`;
            //cleanup
            out += `mkdir build > /dev/null 2>&1\n`;
            out += `rm -rf build/*\n\n`;
            out += `cd build\n\n`;
            //cmake
            if(this.options.swigPython.enable) {
                out += `cmake -Wno-dev ..\n`;
            }
            else {
                out += `cmake ..\n`;
            }
            //make
            out += `if [ "$?" -ne 0 ] ; then\n`;
            out += `    finalize 1\n`;
            out += `fi\n\n`;
            out += `make\n`;
            out += `if [ "$?" -ne 0 ] ; then\n`;
            out += `    finalize 2\n`;
            out += `fi\n\n`;
        }    
        
        //pack
        if(this.options.debPackage.enable) {
            out += `cpack\n`;
            out += `if [ "$?" -ne 0 ] ; then\n`;
            out += `    finalize 3\n`;
            out += `fi\n\n`;
            out += `cp -f ${this.options.debPackage.fileName} ..\n\n`;
        }
        else {
            if(this.options.napi.enable) {
                out += `cp -f ${this.options.napi.nodeFileName} ..\n\n`;
            }
            else {
                if(this.options.swigPython.enable) {
                    out += `cp -f ${this.options.swigPython.soFileName} ..\n\n`;
                    out += `cp -f ${this.options.swigPython.pyFileName} ..\n\n`;
                }
                else {
                    if(this.options.executable.enable) {
                        out += `cp -f ${this.options.executable.executableName} ..\n\n`;
                    }
                }
            }
        }

        out += `finalize 0\n`;

        return out;
    }
}

module.exports = {TemplateLinuxBuild};