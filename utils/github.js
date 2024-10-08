const Gists = require('gists');
const inquirer = require('inquirer');
//const Cryptr = require('cryptr');
const fs = require('fs');
const files = require('./files');
//const encryption = require('../key.json'); 
//const cryptr = new Cryptr(encryption.key);
// there's no need to encrypt the token...
const ENCRYPTION_FILE = 'github-token';
const ENCRYPTION_FILE_PATH = `${files.getCodeboxDirLocation()}/${ENCRYPTION_FILE}`;

module.exports = {
  loginUser: async () => {
    const questions = [
      {
        name: 'token',
        type: 'password',
        message: 'Enter your GitHub Personal Access Token (PAT):',
        validate: function (value) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter a valid token.';
          }
        }
      }
    ];

    const { token } = await inquirer.prompt(questions);
    module.exports.saveToken(token);
  },

  saveToken: (token) => {
    const encryptedToken = token // cryptr.encrypt(token);
    files.writeFile(ENCRYPTION_FILE_PATH, encryptedToken);
    return module.exports.getToken();
  },

  checkToken: () => {
    if (!fs.existsSync(ENCRYPTION_FILE_PATH)) {
      return module.exports.loginUser();
    } else {
      return module.exports.getToken();
    }
  },

  getToken: () => {
    const encryptedToken = files.readFile(ENCRYPTION_FILE_PATH);
    return encryptedToken//cryptr.decrypt(encryptedToken);
  }
};
