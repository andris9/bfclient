var fs = require("fs"),
    feeder = require("./feeder"),
    rssList = JSON.parse(fs.readFileSync("rss.json"));

// start the bot
initialize();

function initialize(){
    // Initial start
    for(var i=0, len = rssList.length; i<len; i++){
        startListening(rssList[i]);
    }    
}

function startListening(rss){
    delay = nextInterval();
    console.log("└── " + rss.title + " - checking in " + prettyTime(delay));
    setTimeout(function(){
        feeder.checkNewFeedItems(rss, function(err, added){
            if(err){
                console.log(rss.title + " yielded in error: "+err.message);
            }else{
                console.log("Checked "+rss.title+" (added "+added.length+")");
            }
            process.nextTick(startListening.bind(this, rss));
        });
    }, delay);
};

function nextInterval(){
    var max_delay = 7 * 60 * 1000, // 7 min
        min_delay = 0.5 * 60 * 1000;   //  0.5 min
    return Math.round(Math.random() * (max_delay - min_delay) + min_delay);
}

function prettyTime(time){
    var hours, minutes, seconds, resp = [];

    hours = Math.floor(time / (3600*1000));
    time = time - hours*(3600*1000);
    if(hours)resp.push(hours+" hour"+(hours>1?"s":""));

    minutes = Math.floor(time / (60*1000));
    time = time - minutes*(60*1000);
    if(minutes)resp.push(minutes+" minute"+(minutes>1?"s":""));

    seconds = Math.floor(time / (1*1000));
    time = time - seconds*(1*1000);
    resp.push(seconds+" second"+(!seconds || seconds>1?"s":""));

    return resp.join(", ");
}