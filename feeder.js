var fetch = require("fetch"),
    NodePie = require("nodepie"),
    redis = require("redis").createClient(),
    crypto = require("crypto");

module.exports.checkNewFeedItems = checkNewFeedItems;
module.exports.popItemFromList = popItemFromList;

function popItemFromList(callback){
    redis.spop("feed:check", function(err, hash){
        if(hash){
            redis.hgetall("feed:url:"+hash, function(err, url){
                if(url){
                    redis.del("feed:url:"+hash, function(){
                        process.nextTick(callback.bind(this, null, url));
                    });
                }else{
                    process.nextTick(callback.bind(this, new Error("No URL object found")));
                }
            });
        }else{
            process.nextTick(callback.bind(this, new Error("No hash found")));
        }
    });
}

function checkNewFeedItems(rss, callback){
    feedFetcher(rss, function(err, list){
        if(err){
            return process.nextTick(callback.bind(this, err));
        }

        checkListForNewItems(list, function(err, added){
            if(err){
                return process.nextTick(callback.bind(this, err));
            }
            
            process.nextTick(callback.bind(this, null, added));
        });
    });
}


function feedFetcher(rss, callback){

    fetch.fetchUrl(rss.url, function(error, meta, rssContent){

        if(error){
            return callback(error);
        }

        //FIXME: lisa toetus modified-since päringutele
        if(meta.status != 200){
            return callback(new Error("RSS Status: " + meta.status));
        }

        var list = [],
            match = rssContent.slice(0,1024).toString().match(/encoding\s*=\s*["']([^"']+)["']/i),
            encoding = (rss.charset || (match && match[1]) || "UTF-8").trim().toUpperCase(),
            iconv;
        
        if(encoding != "UTF-8"){
            iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
            rssContent = iconv.convert(rssContent);
        };

        feed = new NodePie(rssContent.toString().trim());
        feed.init();

        feed.getItems().forEach(function(item){

            if(item.getPermalink()){
                list.push({
                    site: rss.id,
                    title: item.getTitle().replace(/&amp;(?:amp;)?/g,"&").replace(/&quot;/g,'"'),
                    url: item.getPermalink().replace(/&amp;(?:amp;)?/g,"&"),
                    date: item.getDate() || new Date(),
                    language: rss.language || "et"
                });
            }

        });

        feed = null;

        process.nextTick(callback.bind(this, null, list));

    });
}

function checkListForNewItems(list, callback, added){
    added = added || [];
    if(!list.length){
        return process.nextTick(callback.bind(this, null, added));
    }

    var url = list.pop(),
        hash = sha256(url.url);

    redis.sismember("feed:urls", hash, function(err, isMember){
        if(Number(isMember)){
            return process.nextTick(checkListForNewItems.bind(this, list, callback, added));
        }else{
            added.push(url);
            redis.multi().
                sadd("feed:urls", hash).
                sadd("feed:check", hash).
                hmset("feed:url:" + hash, url).
                exec(function(err, replies){
                    process.nextTick(checkListForNewItems.bind(this, list, callback, added));
                });
        }
    });
}

function sha256(str){
    return crypto.createHash("sha256").update(str).digest("hex");
}