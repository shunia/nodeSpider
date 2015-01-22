var path = require('path');

console.log("sep: " + path.sep);
console.log("relative of folder to file: " + path.relative("./tasks/", "./tasks/a.html"));
console.log("base name of folder: " + path.basename("./tasks/"));