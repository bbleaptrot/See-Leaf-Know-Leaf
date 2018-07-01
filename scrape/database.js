let massive = require('massive');
let databaseUrl ='postgres://vumoekaavwicyn:5fdb1b814cae1a3d3529d6b4b3a57ce2d2371552f087daa79cf4574d24b03967@ec2-50-19-86-139.compute-1.amazonaws.com:5432/d3hhn64u4m4d59?ssl=true'
module.exports = massive({
    connectionString: databaseUrl
});