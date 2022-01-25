# exOS Component Generator

Extension to create exOS components for B&R Automation Studio.

## Create packages

This VsCode plugin creates exOS components (code templates) via the context menu of / right clicking on a `.typ` datamodel (datatype) file. Datasets (structure members) are automatically added to the code template as publish or subscribe datasets by adding the comment `PUB` or `SUB`. Publish and Subscribe is seen from the perspective of Automation Runtime, menaing a `PUB` variable is published by AR and subscribed to from Linux. For bidirectional datasets, you can add both types to the comment, like `PUB SUB`. 

The purpose of the templates is to give an easy start for application development. Here, a base frame of Automation Runtime and Linux code is created for the application, and the build instructions for the component are configured to create Debian packages with the exOS build-chain in Automation Studio.

If the .typ file is located within an Automation Studio project (part of the Package.pkg definition), the .typ file is replaced by an exOS package and moved in to a suitable object, like a dynamic library or a program.

## Update packages

For all templates except the `C-API` theres a functionality to regenerate the "inner" parts of the template, which is providing a datamodel interface by using the exos-api functions.
This is needed when the source `.typ` file has changed, i.e. additional members have been added to the structure as `PUB` or `SUB` datasets.

The update of a package is performed via the context menu of / right clicking on the `.exospkg` which was initially generated.

![Update Component](https://github.com/br-automation-com/exOS-ComponentExtension/raw/master/images/UpdateComponent.gif)

There are four options to update a template package

- `Update`: This updates all datamodel based files, i.e. wrappers for the typ file. It will return an error for every file that has been renamed or is missing.

- `Update & Recreate`: This works in the same way as the `Update`, whereas datamodel based files are regenerated if they are missing or have changed name.

- `Update All`: This updates all files related to the datamodel including the main application, i.e. `CMakeLists.txt`, `.exospkg` and so forth are not updated. It will return an error for every file that has been renamed or is missing.

- `Update All & Recreate`: Similar to `Update All`, this option updates all files including the main application, but recreates all files in case they are missing. As it might be beneficial to have the main application template updated, even though local changes have already been made, this option can be used by first *renaming* the main application, and then copy the local changes to the newly generated main application (alternatively, use version control).

## Export binary packages

All exOS packages created with the `exOS Component Generator` can be exported as binary packages, so that the package can be used inside automation projects without recompiling any code. Normally the packages contain "user-code" which is editable, like a main program / script or Structured Text program using the exOS datamodel. The parts including exOS-API communication mechanisms will be binary and thus stay without modifications after binary distribution.

A package can be exported to a binary format via the context menu of / right clicking on the Folder containing the `.exospkg` file. Note that this folder needs to be part of a compiled AS project, in order to obtain the binaries of the Libraries.

![Export Component](https://github.com/br-automation-com/exOS-ComponentExtension/raw/master/images/ExportComponent.gif)

## Use exOS Debug Console

In the editor title menu, under "More Actions...", the exOS Debug Console terminal can be started. This console connects to the IP address of the PLC, and captures all internal logging available to the system. This is mainly useful for debugging purposes, where all other exOS diagnostic functionalities fall short.

![](https://github.com/br-automation-com/exOS-ComponentExtension/blob/master/images/DebugConsole.gif)

## Example

The Code generator uses a top-level structure of a given `IEC TYPE` definition file to generate `PUB/SUB` datasets.

In this case **Mouse** is the *datamodel* (main structure) which contains *datasets* (structure members) that are either published or subscribed to (from the AR perspective).

It has three datasets (`ResetXY`,`MouseMovement` and `MouseButtons`) that are published by the Linux application and subscribed to by the Automation Runtime program, and one dataset (`ResetXY`) which can be published and subscribed to in both directions.

    TYPE
        MouseMovement : STRUCT 
            X: INT;
            Y: INT;
        END_STRUCT
    END_TYPE

    TYPE
        MouseButtons : STRUCT 
            LeftButton : BOOL;
            RightButton : BOOL;
        END_STRUCT
    END_TYPE

    TYPE
        Mouse : 	STRUCT 
            ResetXY : BOOL; (*PUB SUB*)
            Movement : MouseMovement; (*SUB*)
            Buttons : MouseButtons; (*SUB*)
        END_STRUCT;
    END_TYPE

# Template variants

Template variants are selected individually for Automation Runtime and Linux. In other words, the used template only has impact on the look-and feel of the local system implementation, not on the data-connection performance or functionality between Automation Runtime and Linux.

### Automation Runtime

Even though the exOS API can be integrated at various levels of an application, all templates generated with the exOS-Components Generator create a dynamic Automation Studio Library and a Structured Text IEC "user" Task. This setup allows the creator of the exOS Package to export the low-level exOS-API parts of the solution in a binary format, that it can be used in situations where no build environment is existing.

The Datatype which is used to generate the template (and represents the exOS datamodel) is attached to the library as an external PV, which allows the user to use this structure as a local or a global PV in the AS project.

## C API

The dynamic library (which has the name of the Datatype) has the possiblity to instantiate its function blocks, that local copies of the datatype can be used throughout the application. The exos-api functions are implemented directly in the Library, meaning it is rather simple for the user to add special features of the application using the C-API. *Updating the package* using the "Update All" option might add additional dataset declarations, but remove user-specific features.

## C Interface

Here a dynamic library is created as a datamodel proxy, providing a singleton structure representing the datamodel. The interface includes the most common exos-api functions, and can be regenerated by the Update functionality. The benefit of this approach is that the main source in the library is decoupled from the exos-api (simplifying the code), and only needs to access simplified datamodel functions to read and write values, and that this interface can be changed by *Updating the package*. 

The drawback of this template is that it only allows the usage of a single datamodel within one application, that is, the library does not allow more than one instance of the generated function block.

## C++ Class

This template variant creates a dynamic library with an internal C++ Class as the interface of the datamodel. As the complete functionality is encapsulated within an OO class, the template has the benefit that the resulting function block can be used in several instances in the Automation Studio environment. The class interface can be regenerated by *Updating the package*.

- Requirements

    In order to compile this template, GCC 6.3 needs to be selected in th Build settings of the Automation Studio project

# Linux

## C API

Here a C-executable is created together with a cmake instruction. Like the Automation Runtime library, the exos-api functions are used directly in the code, making it simple for the user to add special communication features. *Updating the package* using the "Update All" option might add additional dataset declarations, but remove user-specific features.

## C Interface

Here a static datamodel interface library is created together with a C-executable that accesses a singleton structure. This gives a simpler interface than the **C API**, and has the benefit that the static datamodel interface library can be updated. It does however only allow accessing a single instance of the datamodel per executable.

## C++ Class

This template variant creates a C-executable with an internal C++ Class as the interface of the datamodel. As the complete functionality is encapsulated within an OO class, the template has the benefit that the C++ class can be instantiated in the application. The class interface can be regenerated by *Updating the package*.

## JavaScript Module

This template uses the n-api (Node-API) to generate a complete nodejs object of the provided datamodel and `PUB/SUB` datasets. The Linux application consists of a `.node` compiled dataobject module, and a `.js` file with the user application. The dataobject module can be updated by *Updating the package*. When exported to a binary format, the `.js` user application can be changed without having a build environment installed.

The template supports arrays and callbacks, as well as any newer nodejs versions, and provides an extensive functionality very close to the native exos-api. 

- Requirements

    In order to compile this template, NodeJS needs to be installed on the target system
    
## Python Module

The SWIG library takes the **C Interface** as a template for a library that creates a python module representing the datamodel. Along with the python module, a "main" python script is generated that automatically connects the datamodel to AR. The Linux application consists of a shared library, a python module, and a `.py` user application. The dataobject module can be updated by *Updating the package*. When exporting this template to binary format, the Python user application can be changed without a build environment.

- Requirements

    In order to compile this template, Python and SWIG need to be installed.


# Installation

## WSL

exOS works best with WSL as a build environment for the components that are to be deployed on a Linux target system, as WSL executes a full-fledged Debian Linux in the background containing all needed packages for the exOS components to be compiled. The `exOS Component Generator` therefore uses the background WSL compile step as the default mechanism in the generated templates, so that the Linux sources are integrated into the Automation Studio project build. This ensures that components are compiled and deployed to AR and Linux in a consistent manner.

For installing a WSL build system as well as a simulated WSL target environment, please see [exOS-WSL on github](https://github.com/br-automation-com/exOS-WSL). The provided images come with python, nodejs and SWIG preinstalled.

## Python

One important topic when creating Python-based exOS packages is to compile the package with the same Python
version that is installed on the target.

### Python 2

One easy solution for this is to use Python2.7. Old as it is, it is still same-for-all

    sudo apt install python-dev

In the CMakeLists.txt:

    find_package(PythonLibs 2)

### Python 3

When it comes to using Python 3, it should be noted that different Debian 
distributions will install different Python versions when installing Python via `apt`.

Here is a list of distributions together with supported Python versions https://wiki.debian.org/Python

- Debian Bullseye contains 3.9
- Debian Buster contains Python 2.7, 3.7
- Debian Stretch contains Python 2.7, 3.5
- Debian Jessie contains Python 2.7, 3.4
- Debian Wheezy contains Python 2.7, 3.2

As long as the same distribution is used for target and build-environment, the installation
of Python3 is as simple as Python2.7

    sudo apt install python3-dev

In the CMakeLists.txt:

    find_package(PythonLibs 3)


If the application requires a different python version than is offered by the default apt mechanism in the distribution, python needs to be intalled by other means than `sudo apt install python3-dev`.
There are a few different solutions to this, one of the solutions is to use `pyenv`.

`pyenv` can be installed with the following link: https://github.com/pyenv/pyenv-installer

The following article gives a good intro to pyenv: https://realpython.com/intro-to-pyenv/

In short, a few packages need to be installed in the build-environment before using `pyenv`
to install new versions

    sudo apt-get install -y make build-essential libssl-dev zlib1g-dev \
    libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev \
    libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python-openssl

When `pyenv` and all required packages have been installed, the `3.9` developer version can be installed.

    env PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install 3.9-dev
        
- In the CMakeLists.txt

    Using pyenv, the python librares are not located in /usr/include or /usr/lib, but need to be defined
    manually in the CMakeLists.txt. As the file locations and directory names may vary, it is recommended 
    to search for `libpython*.so` and make sure that the locations are the same on the target system, or 
    that the linker on the target system can find the necessary dynamic library via environment variables.

    Example:

        set(PYTHON_INCLUDE_PATH ~/.pyenv/versions/3.9-dev/include/python3.9)
        set(PYTHON_LIBRARIES ~/.pyenv/versions/3.9-dev/lib/libpython3.9.so)

## NodeJS

Similar to using Python3, nodejs comes in different versions in different distributions when using apt. 

https://packages.debian.org/nodejs

- stretch (oldoldstable): 4.8.2~dfsg-1
- buster (oldstable) 10.24.0~dfsg-1~deb10u1
- bullseye (stable) 12.22.5~dfsg-2~11u1
- bookworm (testing) 12.22.7~dfsg-2
- sid (unstable) 12.22.7~dfsg-2

One important topic when creating NodeJS-based exOS packages is to compile the package with the same NodeJS
version that is installed on the target.

As long as the same distribution is used for the build environment as the target, apt can be used to easily install nodejs.

    sudo apt install nodejs

For the build environment, npm (the node package manager) should be installed to obtain additional node modules during build and include these in the generated package.

    sudo apt install npm

Whereas, if the target and build environment should use different distros, the best option is to use nodesource for both platforms. If theres a previous version of nodejs already installed, this should be removed, as it might result in conflicting dependencies or linkable .so files, even if the same version is in use (the apt setup uses a sligthly different setup of packages and linkable files the nodesource setup).

    sudo apt remove nodejs

The nodesource installation instructions can be found here:

https://github.com/nodesource/distributions/blob/master/README.md

Whereas installing NodeJS version 10 is recommended, as SWIG currently does not support newer versions.

- as root

        curl -fsSL https://rpm.nodesource.com/setup_10.x | bash -

- as sudo user

        curl -fsSL https://rpm.nodesource.com/setup_10.x | sudo bash -


In some cases the build environment might need to have several node versions installed. NVM is a tool to handle this.

https://github.com/nvm-sh/nvm

## SWIG

Unlike Python and NodeJS, SWIG is a mere code generator and only needs to be installed in the development environment. This means, there are no requirements to keep target and development versions synchronized.

    sudo apt install swig


There is still a difference of SWIG versions dependent on the used distribution, see https://packages.debian.org/swig

- stretch (oldoldstable): 3.0.10-1.1
- buster (oldstable): 3.0.12-2
- bullseye (stable): 4.0.2-1
- bookworm (testing): 4.0.2-1
- sid (unstable): 4.0.2-1


If newer versions are needed, the source pacakges can be downloaded via http://www.swig.org/download.html