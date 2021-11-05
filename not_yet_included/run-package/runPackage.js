
/*
run Package takes a exospkg file in the following format (exosPkgFileContents):

<?xml version="1.0" encoding="utf-8"?>
<ComponentPackage Version="1.0.0" ErrorHandling="Ignore" StartupTimeout="0">
    <File Name="exos-comp-types1" FileName="Linux\exos-comp-types1-1.0.0.deb" Type="Project"/>
    <Service Name="Types1 Runtime Service" Executable="/home/user/types1" Arguments=""/>
    <DatamodelInstance Name="Types1"/>
    <Build>
        <GenerateDatamodel FileName="Types1\Types1.typ" TypeName="Types1">
            <SG4 Include="Types1.h"/>
            <Output Path="Linux"/>
            <Output Path="Types1"/>
        </GenerateDatamodel>
        <BuildCommand Command="C:\Windows\Sysnative\wsl.exe" WorkingDirectory="Linux" Arguments="-d Debian -e sh build.sh">
            <Dependency FileName="Linux\exos_types1.h"/>
            <Dependency FileName="Linux\exos_types1.c"/>
            <Dependency FileName="Linux\types1.c"/>
            <Dependency FileName="Linux\termination.h"/>
            <Dependency FileName="Linux\termination.c"/>
        </BuildCommand>
    </Build>
</ComponentPackage>

It uses the xml-parser to parse this xml, which results in the following json object (exosPkgJson):
{
  declaration: { attributes: { version: '1.0', encoding: 'utf-8' } },
  root: {
    name: 'ComponentPackage',
    attributes: { Version: '1.0.0', ErrorHandling: 'Ignore', StartupTimeout: '0' },
    children: [
      {
        name: 'File',
        attributes: {
          Name: 'exos-comp-types1',
          FileName: 'Linux\\exos-comp-types1-1.0.0.deb',
          Type: 'Project'
        },
        children: []
      },
      {
        name: 'Service',
        attributes: {
          Name: 'Types1 Runtime Service',
          Executable: '/home/user/types1',
          Arguments: ''
        },
        children: []
      },
      {
        name: 'DatamodelInstance',
        attributes: { Name: 'Types1' },
        children: []
      },
      {
        name: 'Build',
        attributes: {},
        children: [
          {
            name: 'GenerateDatamodel',
            attributes: { FileName: 'Types1\\Types1.typ', TypeName: 'Types1' },
            children: [
              {
                name: 'SG4',
                attributes: { Include: 'Types1.h' },
                children: []
              },
              {
                name: 'Output',
                attributes: { Path: 'Linux' },
                children: []
              },
              {
                name: 'Output',
                attributes: { Path: 'Types1' },
                children: []
              }
            ],
            content: ''
          },
          {
            name: 'BuildCommand',
            attributes: {
              Command: 'C:\\Windows\\Sysnative\\wsl.exe',
              WorkingDirectory: 'Linux',
              Arguments: '-d Debian -e sh build.sh'
            },
            children: [
              {
                name: 'Dependency',
                attributes: { FileName: 'Linux\\exos_types1.h' },
                children: []
              },
              {
                name: 'Dependency',
                attributes: { FileName: 'Linux\\exos_types1.c' },
                children: []
              },
              {
                name: 'Dependency',
                attributes: { FileName: 'Linux\\types1.c' },
                children: []
              },
              {
                name: 'Dependency',
                attributes: { FileName: 'Linux\\termination.h' },
                children: []
              },
              {
                name: 'Dependency',
                attributes: { FileName: 'Linux\\termination.c' },
                children: []
              }
            ],
            content: ''
          }
        ],
        content: ''
      }
    ],
    content: ''
  }
}
*/
const fs = require('fs');
const parser = require('xml-parser');
//const util = require('util')
const {spawn} = require('child_process');
const path = require('path');
const os = require('os');

/*
add this to package.json
        {
					"when": "filesExplorerFocus && resourceExtname == .exospkg",
					"command": "exos-component-extension.runPackage",
					"group": "2_workspace"
				},
				{
					"when": "filesExplorerFocus && resourceExtname == .exospkg",
					"command": "exos-component-extension.buildPackage",
					"group": "2_workspace"
				},

*/
class runPackage
{
    //trows exceptions
    constructor(exosPkgFile) {
        this.exosPkgDir = path.dirname(exosPkgFile);
        this.exosPkgFileContents = fs.readFileSync(exosPkgFile).toString();
        // console.log(this.exosPkgFileContents);
        this.exosPkgJson = parser(this.exosPkgFileContents);
        // console.log(util.inspect(this.exosPkgJson, false, null, true /* enable colors */));

        if(this.exosPkgJson.root.name != 'ComponentPackage') {
           throw ('not a valid exospkg');
        }

        /*
        setup build commands 
        each one of the this.BuildCommands[] will have something like
        {
              Command: 'C:\\Windows\\Sysnative\\wsl.exe', --> we dont case about this, as we call 'wsl' directly and only support wsl commands
              WorkingDirectory: 'Linux',
              Arguments: '-d Debian -e sh build.sh'
        }
         */
        for(let build of this.exosPkgJson.root.children) {
            if(build.name == "Build") {
                this.Build = build;
                this.BuildCommands = [];
                for(let buildCommand of build.children) {
                    if(buildCommand.name == "BuildCommand" && buildCommand.hasOwnProperty("attributes"))
                    {
                        this.BuildCommands.push(buildCommand.attributes);
                    }
                }
            }
        }
    }

    //throws exceptions
    build()
    {

        for(let buildCommand of this.BuildCommands) {
            let Command = "";
            let Arguments = "";
            let WorkingDirectory = "";
            
            if(buildCommand.hasOwnProperty("Command"))
                Command = buildCommand.Command;
            if(buildCommand.hasOwnProperty("Arguments"))
                Arguments = buildCommand.Arguments;
            if(buildCommand.hasOwnProperty("WorkingDirectory"))
                WorkingDirectory = buildCommand.WorkingDirectory;
            
            if(!Command.toLowerCase().includes("wsl.exe")) {
                throw("Build command is not using wsl");
            }
            
            if('win32' != os.platform()) {
                throw('platform not supported');
            }

            let cmds = ['wsl'];
            let args = [];
            let exec = false;
            for(let arg of Arguments.split(' '))
            {
                //after we find the execute option '-e', we add commands to the argument list 
                if(exec)
                {
                    args.push(arg);
                }
                if(arg.includes("-e")) //also covers --exec
                {
                    exec = true;
                }
                //before we have found the execute option '-e', we add the other options to the command
                if(!exec)
                {
                    cmds.push(arg);
                }
            }

            if(args.length == 0) {
                 throw('no arguments passed');
            }

            console.log(args);
            console.log(`running cmd: '${cmds.join(' ')}' args: '${args.join(' ')}' cwd:'${WorkingDirectory}'`);

            let builder = spawn(cmds.join(' '), args, { cwd: `${path.join(this.exosPkgDir,WorkingDirectory)}`, shell: true });

            builder.stdout.setEncoding('utf8');
            builder.stdout.on('data', (chunk) => {
                process.stdout.write(chunk);
            });
            builder.stderr.setEncoding('utf8');
            builder.stderr.on('data', (chunk) => {
                process.stdout.write(chunk);
            });
            builder.on('error', function (err) {
                console.log(`error from wsl ${args.join(' ')}`);
                throw(`error from wsl ${args.join(' ')}:\n${err}`);
            });
            builder.on('exit', (code) => {
                if(0 == code) {
                    console.log(`wsl ${args.join(' ')} finished successfully`);    
                }
                else {
                    throw(`wsl ${args.join(' ')} exited with code ${code}`);
                }
            });

        }
    }
}

if (require.main === module) {

    let pkg = new runPackage(`${__dirname}/test/Types1.exospkg`);
    pkg.build();
}