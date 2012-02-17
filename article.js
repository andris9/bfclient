
var Gearman = require("node-gearman"),
    feeder = require("./feed"),
    urllib = require("url"),
    gearman = new Gearman("pangalink.net");

module.exports.fetchArticle = fetchArticle;

function fetchArticle(callback){
    feeder.popItemFromList(function(err, article){
        if(err){
            console.log(err);
            return;
        }
        
        console.log("Checking for "+article.title+" ...");
        
        var articleJSONStr = "",
            job = gearman.submitJob("article", article.url);
        
        job.on("data", function(data){
            articleJSONStr += data.toString("binary");
        });
    
        job.on("end", function(){
            var response, domain;
            try{
                response = JSON.parse(new Buffer(articleJSONStr, "binary").toString("utf-8")),
                domain = (urllib.parse(response.url, true, true).hostname || "").replace(/^www\./, "").trim();
            }catch(E){
                return process.nextTick(callback.bind(this, E));
            }
            
            fetchLemma(article.title+" "+response.article, function(err, lemma){
                process.nextTick(callback.bind(this, null, {
                    title: article.title,
                    time: article.date,
                    domain: domain,
                    url: parseUrl(response.url || article.url),
                    content: response.article,
                    lemma: lemma || ""
                }));
            });
            
        });
    
        job.setTimeout(60 * 1000, function(){
            process.nextTick(callback.bind(this, new Error("Gearman worker timeout")));
        });
    
        job.on("error", function(err){
            process.nextTick(callback.bind(this, err));
        });
        
    });
}

function fetchLemma(text, callback){
    
    text = (text || "").toString().
            replace(/\r?\n|\r/g, " ").
            replace(/\<[\/a-zA-Z][^>]*\>/g, " ").
            replace(/\&nbsp;/g, " ").
            replace(/[^A-Za-z0-9õäöüšžÕÄÖÜŽŠ]/g," ").
            trim().
            replace(/\s+/g, ", ").
            trim().
            toLowerCase();
                
    var article = "",
        job = gearman.submitJob("lemma", text);

    job.on("data", function(data){
        article += data.toString("binary");
    });

    job.on("end", function(){
        
        article = new Buffer(article, "binary").toString("utf-8").
                    replace(/[,\s]+/g, " ").
                    trim();
                    
        process.nextTick(callback.bind(this, null, article));
    });

    job.setTimeout(10*1000, function(){
        process.nextTick(callback.bind(this, new Error("Gearman worker timeout")));
    });

    job.on("error", function(err){
        process.nextTick(callback.bind(this, err));
    });
}

function parseUrl(url){
    var urlparts = urllib.parse(url, true, true),
        keys = Object.keys(urlparts.query || {}),
        key;
    
    for(var i=0, len = keys.length; i<len; i++){
        key = keys[i];
        
        // Google analytics
        if(key.match(/^utm_/)){
            delete urlparts.query[key];
            continue;
        }
        
        // generic
        if(key.match(/SESSID/)){
            delete urlparts.query[key];
            continue;
        }
        
        // AP3
        if(key=="ref"){
            delete urlparts.query[key];
            continue;
        }
        
        // opleht
        if(key=="rsscount"){
            delete urlparts.query[key];
            continue;
        }
    }
    
    urlparts.search = false;
    url = urllib.format(urlparts);
    // remove trailing = from query params
    url = url.replace(/\=(?=&)|\=$/g, "");
    return url;
}