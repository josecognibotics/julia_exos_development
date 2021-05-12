# Changelog

## [Unreleased] - YYYY-MM-DD

### Added
- Support for arrays in SWIG python.
- Example code in on_changed in python and singleton

### Fixed
- Naming of structs in singleton and swig had the library name removed (only in version 1.1.5 and 1.1.6)

### Removed
- SWIG NodeJS as it has been replaced by the more feature rich N-API NodeJS

## [1.1.6] - 2021-04-20

### Fixed

Singleton templates did not create publishers for the Linux side, which meant datasets could be subscribed to in AR but were never sent from Linux.

## [1.1.5] - 2021-04-16
### Changed

- Changed context menu commands to "Instantiatable" and "Singleton"

- Streamlined the AR parts so that all Templates use a Dynamic library with the reference to an external variable of the interface-datatype. 

- Singleton (previously static-c-lib) template log commands have been moved into a log structure rather than having them in the top structure as log_error log_warning and so on.
### Added

- Node.js N-API generator added. Uses the Node-API version 6. Some limitations are known and is mentioned in top of the created Linux/lib"structname".c file. Major things are that value ranges are not checked, multidimentional arrays are not supported and that error checking is not yet fully implemented in a nice way.
Tested with Node.js version 10 (latest).  
Needs node-gyp, python 3.x, npm to be installed in the build environment (WSL).

- Updated SWIG NodeJS template to allow for node-modules like the Node-API version, as well as having CMake creating a debian package instead of loose files.

- Added more description in the README
## [1.1.4] - 2021-03-04
### Added
- This changelog (copied earlier entries from Readme/Details), lets try this: [Keep a Changelog](http://keepachangelog.com/)
- `Update Static C-Lib SWIG Python` to right-click on .exospkg file
- Log functionality as function pointers like process, dispose etc. in the static C-lib including SWIG
- `get_nettime` function as a function pointer like process, dispose etc. in the static C-lib including SWIG
- `nettime` to each SUB value which is updated in the datasetEvent callback in the static C-lib including SWIG
- A local `Connected` variable to the AR template, cyclically updated
- Generation of .gitignore and .gitattributes

### Changed
- Python version in CMakeLists.txt to PythonLibs 3

### Fixed
- Generation of array and string sizes in function blocks
- Wrong datatype for strings was used in the static C-lib including SWIG
- Fixed `is_connected` and `is_operational` flags to be updated in `disconnect` and `dispose` in the static C-lib including SWIG
- - Events doesnt arrive when actively disconnecting (by api design)

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