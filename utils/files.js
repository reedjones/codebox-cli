const path = require('path');
const fs = require('fs');

const os = require('os');
const { exec } = require('child_process');

// Get the user's home directory
const homeDir = os.homedir();

// Get the data directory based on the platform
let dataDir;

if (process.platform === 'win32') {
    dataDir = path.join(homeDir, 'AppData', 'Local'); // Common path for Windows
} else if (process.platform === 'darwin') {
    dataDir = path.join(homeDir, 'Library', 'Application Support'); // Common path for macOS
} else {
    dataDir = path.join(homeDir, '.local', 'share'); // Common path for Linux
}

const myAppDir = path.join(dataDir, 'CodeBox');

// Define the directory to create


// Create the directory if it doesn't exist
if (!fs.existsSync(myAppDir)) {
    fs.mkdirSync(myAppDir, { recursive: true });
    console.log(`Data directory created at: ${myAppDir}`);
    console.log(`Environment variable MY_APP_DATA_DIR set to: ${process.env.MY_APP_DATA_DIR}`);
}

process.env.MY_APP_DATA_DIR = myAppDir;
const envVarName = 'MY_APP_DATA_DIR'
const markerFilePath = path.join(myAppDir, '.script_ran');

if (fs.existsSync(markerFilePath)) {
    console.log('The script has already been run. continuing without changes.');
    //process.exit(0); // Exit if the script has already run
} else {
    setEnvVar()
}

// Set an environment variable to store the path to the directory
function setEnvVar() {
    let command;

    if (process.platform === 'win32') {
        // For Windows, use setx to set the environment variable permanently
        command = `setx ${envVarName} "${myAppDir}"`;
    } else {
        // For Unix-like systems, append to .bashrc or .bash_profile or .zshrc
        const shellConfigFile = path.join(homeDir, '.bashrc'); // Change to .bash_profile or .zshrc as needed
        const exportCommand = `export ${envVarName}="${myAppDir}"\n`;

        // Append the export command to the shell configuration file
        fs.appendFileSync(shellConfigFile, exportCommand, { encoding: 'utf8' });
        console.log(`Environment variable ${envVarName} set to: ${myAppDir} in ${shellConfigFile}`);
    }

    if (process.platform === 'win32') {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error setting environment variable: ${error.message}`);
                return;
            }
            console.log(`Environment variable ${envVarName} set to: ${myAppDir} in system environment`);
        });
    } else {
        console.log(`Please restart your terminal or run 'source ${path.join(homeDir, '.bashrc')}' to apply changes.`);
    }

    fs.writeFileSync(markerFilePath, 'Script has run successfully.', { encoding: 'utf8' });
    console.log(`Marker file created at: ${markerFilePath}`);
}





module.exports = {
    myAppDir: () => myAppDir,

    getAppPathFromEnv: () => {
        return process.env.MY_APP_DATA_DIR
    },
    extname: (filename) => {
        return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
    },

    getCodeboxDirLocation: () => {
        //return path.dirname(fs.realpathSync(`${__dirname}/../`))
        return process.env.MY_APP_DATA_DIR
    },

    getCurrentDirectoryBase: () => {
        return path.basename(process.cwd());
    },

    getDirname: () => {
        return path.dirname(process.cwd());
    },

    getLocation: (cdir, path) => {
        return path.replace(cdir, '')
    },

    writeFolder: (dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    },

    readJSONFile: (filename) => {
        let rawdata = fs.readFileSync(filename);
        return JSON.parse(rawdata);
    },

    readFile: (filename) => {
        try {
            const data = fs.readFileSync(filename, 'utf8');
            //console.log(`read file: ${data}`);
            return data
        } catch (err) {
            console.error(err);
        }

    },

    writeJSONFile: (json, filename) => {
        let data = JSON.stringify(json, null, 2);
        fs.writeFileSync(filename, data);
    },

    writeFile: (filename, data) => {
        fs.writeFileSync(filename, data);
    }
}