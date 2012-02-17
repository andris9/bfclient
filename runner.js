var spawn = require("child_process").spawn;

createFeedbot();
createDownloader();

function createFeedbot(){
    console.log("Starting feedbot");
    
    var feedbot = spawn('node', [__dirname+'/feedbot.js'], {cwd: __dirname});
    
    feedbot.stdout.on('data', function (data) {
        console.log('feedbot stdout: ' + (data || "").toString("utf-8").trim());
    });
    
    feedbot.stderr.on('data', function (data) {
        console.log('feedbot stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    feedbot.on('exit', function (code) {
        console.log('feedbot exited with code ' + code);
        setTimeout(createFeedbot, 1000);
    });
}

function createDownloader(){
    console.log("Starting downloader");
    
    var downloader = spawn('node', [__dirname+'/downloader.js'], {cwd: __dirname});
    
    downloader.stdout.on('data', function (data) {
        console.log('downloader stdout: ' + (data || "").toString("utf-8").trim());
    });
    
    downloader.stderr.on('data', function (data) {
        console.log('downloader stderr: ' + (data || "").toString("utf-8").trim());
    });
    
    downloader.on('exit', function (code) {
        console.log('downloader exited with code ' + code);
        setTimeout(createDownloader, 1000);
    });
}