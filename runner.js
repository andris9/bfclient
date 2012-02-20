var spawn = require("child_process").spawn,
    RAIServer = require("rai").RAIServer;

process.nextTick(createFeedbot);
process.nextTick(createDownloader);
process.nextTick(createStore);
process.nextTick(createAPI);

function createFeedbot(){
    console.log("Starting feedbot");
    
    var feedbot = spawn('/usr/local/bin/node', [__dirname+'/feedbot.js'], {cwd: __dirname});
    
    feedbot.stdout.on('data', function (data) {
        Tail('feedbot stdout: ' + (data || "").toString("utf-8").trim())
    });
    
    feedbot.stderr.on('data', function (data) {
        Tail('feedbot stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    feedbot.on('exit', function (code) {
        Tail('feedbot exited with code ' + code);
        setTimeout(createFeedbot, 1000);
    });
}

function createDownloader(){
    Tail("Starting downloader");
    
    var downloader = spawn('/usr/local/bin/node', [__dirname+'/downloader.js'], {cwd: __dirname});
    
    downloader.stdout.on('data', function (data) {
        Tail('downloader stdout: ' + (data || "").toString("utf-8").trim());
    });
    
    downloader.stderr.on('data', function (data) {
        Tail('downloader stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    downloader.on('exit', function (code) {
        Tail('downloader exited with code ' + code);
        setTimeout(createDownloader, 1000);
    });
}

function createStore(){
    var store = spawn('/usr/local/bin/node', [__dirname+'/../bfstore/store.js'], {cwd: __dirname+"/../bfstore"});
    
    store.stdout.on('data', function (data) {
        Tail('store stdout: ' + (data || "").toString("utf-8").trim());
    });
    
    store.stderr.on('data', function (data) {
        Tail('store stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    store.on('exit', function (code) {
        Tail('store exited with code ' + code);
        setTimeout(createStore, 1000);
    });
}

function createAPI(){
    var api = spawn('/usr/local/bin/node', [__dirname+'/../bfstore/api.js'], {cwd: __dirname+"/../bfapi"});
    
    api.stdout.on('data', function (data) {
        Tail('api stdout: ' + (data || "").toString("utf-8").trim());
    });
    
    api.stderr.on('data', function (data) {
        Tail('api stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    api.on('exit', function (code) {
        Tail('api exited with code ' + code);
        setTimeout(createAPI, 1000);
    });
}

var tail = [];
function Tail(msg){
    tail.push(msg);
    if(tail.length > 250){
        tail.shift();
    }
    console.log(msg);
}

var server = new RAIServer();
server.listen(8082);

server.on("connect", function(client){

    // Greet the client
    client.send("Hello!");

    // Wait for a command
    client.on("command", function(command, payload){

        command = (command || "").toString("utf-8").trim().toUpperCase();

        if(command == "TAIL"){
            for(var i=0, len=tail.length; i<len; i++){
                client.send(new Buffer(tail[i], "utf-8"));
            }
            client.send("OK");
        }else if(command == "QUIT"){
            client.send("Goodbye");
            client.end();
        }else{
            client.send("Unknown command");
        }

    });

});