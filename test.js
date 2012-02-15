
var fs = require("fs"),
    feeder = require("./feeder"),
    feedList = JSON.parse(fs.readFileSync("rss.json"));

//feeder.checkNewFeedItems(feedList[1]);

feeder.popItemFromList(function(err, url){
    console.log(err || url);
});