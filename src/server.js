var leds = require('lpd8806-galileo');
var Galileo = require("galileo-io");
var board = new Galileo();
var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

board.on("ready", function() {
    var sensorData;

    this.analogRead("AO", function(data) {
        sensorData = parseInt(data, 10);
        sensorData = map(sensorData, 360, 0, 0.0, 1.0);

        if (connection) {

            console.log(sensorData);
            leds.setColor(0, 113, 197, sensorData);
            setTimeout(function(){}, 20);
            connection.write(data);

        }
    });

    process.on('exit', function() {
        leds.off();
    });
});


// 1. Echo sockjs server
var sockjs_opts = {
    sockjs_url: "sockjs-0.3.min.js"
};

var sockjs_echo = sockjs.createServer(sockjs_opts);
var connection;
sockjs_echo.on('connection', function(conn) {
    connection = conn;
    conn.on('data', function(message) {
        conn.write(message);
    });
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req, res) {
    res.end();
});

sockjs_echo.installHandlers(server, {
    prefix: '/echo'
});

console.log(' [*] Listening on 0.0.0.0:1337');
server.listen(1337, '0.0.0.0');

function map(x, in_min, in_max, out_min,out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


process.on('SIGINT', function() {
    process.exit(0);
});
