
let app = require("./express");
const http = require('http');
app = http.createServer(app);
const server = app.listen(process.env.PORT || 3001, () => {
    console.log('process listening ON', process.env.PORT || 3000);
});
server.timeout = 60000;
module.exports = server;