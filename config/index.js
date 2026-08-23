import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

var normalizedPath = __dirname;
var data = {}

fs.readdirSync(normalizedPath).forEach(function(file) {
    if(file != 'index.js'){
        data[file.split('.')[0]] = require(path.join(__dirname, file))['default'];
    }
});

export default data;
