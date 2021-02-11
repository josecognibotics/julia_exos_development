# exOS-Components README

This VsCode plugin creates exOS components (code templates) via the context menu of a `.typ` datamodel file. Datasets (structure members) are automatically added to the code template as publish or subscribe datasets by adding the comment `PUB` or `SUB`. For bidirectional datasets, you can add both types to the comment, like `PUB SUB`. Internal pub/sub datasets that should not be visible for the automation engineer using the component can be automatically added to the component via the addition `private`, for example `PUB private`. Needless to say, additional datasets that are part of the datamodel can of course also be added after the creation of the template by using the exos-api directly in the generated code. 

The purpose of the templates is to give an easy start for application development. Here, a base frame of Automation Runtime and Linux code is created for the application, and the build instructions for the component are configured to create Debian packages with the exOS build-chain in Automation Studio.

If the .typ file is located within an Automation Studio project (part of the Package.pkg definition), the .typ file is replaced by an exOS package and moved in to a suitable object, like a dynamic library or a program.

# Template variants

## Dynamic C-Lib, C-Executable Template

This generates a template with a dynamic Automation Studio library (that can be used in IEC) together with a Structured Text program calling the generated function blocks. The exos-api functions are implemented in the library. On the linux side, a plain C program is generated, likewise using the exos-api. 

## Static C-Lib Template

This generates a static library representing the datatype of the `.typ` file, that includes all needed exos-api functions. As "main" applications, C programs are generated for AR and Linux. The benefit of this approach is that the program using the static library is decoupled from the exos-api (simplifying the "main" code), and only needs to access simplified datamodel functions to read and write values. A further benefit here is that the static library can be regenerated, should more members come to the datamodel. Regenerating the library is done via right clicking on the `.exospkg` file. The static datamodel library also serves as template for swig wrappers into other languages, like python. The drawback of this template is that it only allows the usage of a single datamodel within one application, that is, the static library does not allow instantiation of the datamodel.

## Static C-Lib SWIG Python Template

On the AR side, this generates a template identical to the `Static C-Lib Template`, whereas on the Linux side, the static library is used to create a python module representing the datamodel. Along with the python module, a "main" python script is generated that automatically connects the datamodel to AR.

## Static C-Lib SWIG NodeJS Template

On the AR side, this generates a template identical to the `Static C-Lib Template`, whereas on the Linux side, the static library is used to create a nodeJS module representing the datamodel. Along with the nodeJS module, a "main" Javascript nodejs program is generated that automatically connects the datamodel to AR.

# Versions

## V1.1.3

### added NodeJS SWIG Template

The `exOS Static C-Lib SWIG NodeJS Template` is now available for creating nodejs JavaScript templates. SWIG needs to be installed in the build environment via `sudo apt install swig`. Currently callbacks are not supported, and generator is restricted to node version <= 10.

## V1.1.2

### added python SWIG template

The `exOS Static C-Lib SWIG Python Template` is now available for creating python templates, which also handles callbacks. The callbacks are auto generated in the python scripts. SWIG needs to be installed in the build environment via `sudo apt install swig`

## V1.0.5

### Static C-Lib template added

There is a new function `exOS Static C-Lib Template` which generates a template with a static C-Library representing the configured datamodel for C-tasks on both ends. The benefit of this library is that it allows for being updated (right clicking in the .exospkg file), creating a new static library from the datamodel, without changing the main functions. Also a good starting point to generate SWIG templates.  

### renamed exar- to exos-comp-

Previously, the Debian packages created for deployment to the Linux system were called `exar-`, for example `exar-watertank-1.0.0.deb`. As this prefix had no real meaning, it has been changed to `exos-comp-` for all new templates created, meaning you would get `exos-comp-watertank-1.0.0.deb`, which is a more telling prefix, given that it is an exos component that is being deployed and installed on the remote system.