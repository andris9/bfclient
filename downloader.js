
var redis = require("redis").createClient(),
    articlelib = require("./article");

mainloop();

function mainloop(){
    
    articlelib.fetchArticle(function(err, article){
        if(err){
            console.log(err);
            setTimeout(mainloop, 300);
            return;
        }
        
        console.log("Publishing "+article.title);
        redis.publish("article", JSON.stringify(article));

        /*        
        console.log(article.title);
        console.log(new Array(article.title.length+1).join("="));
        console.log("["+article.url+"]");
        console.log("["+article.domain+"]");
        console.log(article.content);
        console.log(article.lemma);
        */ 
        
        setTimeout(mainloop, 300);
    });

}