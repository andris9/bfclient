
// handle parent death
(function(){
    var FFI = require('node-ffi');
    var current = new FFI.Library(null, {"prctl": ["int32", ["int32", "uint32"]]})
    
    //1: PR_SET_PDEATHSIG, 15: SIGTERM
    var returned = current.prctl(1,15);
    
    process.on('SIGTERM',function(){
            //do something interesting
            process.exit(1);
    });
})();


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
        if(!article){
            //nothing found
            setTimeout(mainloop, 1*1000);
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