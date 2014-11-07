var Wiki = (function () {
    'use strict';
    var Wiki = {};
    
    //Set some default values 
    Wiki.apistringbase = "http://en.wikipedia.org/w/api.php?";
    Wiki.statsbase = "http://stats.grok.se/json/en/latest30/";
    
    //Get the page views for "title" from the stats site. 
    //Default statsbase = http://stats.grok.se/
    
    Wiki.getPageViews = function(title, callback){
      
      $.getJSON(this.statsbase + title,function(data,textStatus,jqXHR){   //JSON call to statsbase
          var pageviews = 0,
          k;
        if(data.daily_views){
          for (k in data.daily_views){
          pageviews += data.daily_views[k];
          }
        }
        callback({"pageviews" : pageviews , 'url' : Wiki.statsbase + title});
      });
    
    }
    //@Returns Revision Array 
    Wiki.getLatestRevision = function(title,callback){
       var args = {titles:title, prop: "revisions", rvprop:"content|ids|timestamp|userid|user|flags|comment|size", rvgeneratexml :""};
     wikiCall(args,"query",function(data){ 
         callback(data);
         });
     }
     
     Wiki.getRevision = function(title, id, callback){
     var args = {revids:id, prop: "revisions", rvprop:"content|ids|flags|comment|parsedcomment", rvgeneratexml : ""};
     wikiCall(args,"query",function(data){
     callback(data);
        });  
    // rvprop=ids%7Cflags%7Ctimestamp%7Cuser%7Cuserid%7Csize%7Csha1%7Ccomment%7Cparsedcomment%7Ccontent%7Ctags%7Cflagged&rvgeneratexml=&rvparse=&revids=52119850
     }
     
     Wiki.getWikiText = function( id, callback){
     var args = {revids:id, prop: "revisions", rvprop:"content|ids|flags|comment", rvgeneratexml : "", rvparse: ""};
     wikiCall(args,"query",function(data){
     callback(data);
      
     });   
    // rvprop=ids%7Cflags%7Ctimestamp%7Cuser%7Cuserid%7Csize%7Csha1%7Ccomment%7Cparsedcomment%7Ccontent%7Ctags%7Cflagged&rvgeneratexml=&rvparse=&revids=52119850
     }
  
  //Not sure this is allways going to be safe? Api Max is 500 revisions
  Wiki.getAllRevisionsFromTo = function(title,revidfrom,revidto,callback){
  var args = {titles: title, prop: "revisions", rvprop:"ids|timestamp|userid|user|flags|parsedcomment|comment|size", rvdir : "older", rvlimit : 500, rvstartid : revidfrom, rvendid : revidto };
  wikiCall(args,"query",function(data){
  callback(data) 
  });
  }
   //w/api.php?action=query&prop=revisions&format=json&rvprop=ids%7Ctimestamp%7Cuserid%7Csha1%7Ccomment&rvlimit=500&rvdir=older&titles=Tamsulosin
    
    
    Wiki.getAllRevisions = function(title, callback){
  var args = {titles: title, prop: "revisions", rvprop:"ids|content|timestamp|userid|user|flags|parsedcomment|comment|size", rvdir : "older", rvlimit : 500 };
  wikiCall(args,"query", function(data){
  callback(data);
  });
  }
    
    Wiki.parseWikiText = function(text, callback){
    var args = {"text": encodeURIComponent(text) };
    wikiCall(args,"parse",function(data){
    callback(data);
    });
    }
    
    function wikiCall(args,action,callback){

    $.getJSON("http://en.wikipedia.org/w/api.php?action=" + action + "&format=json&callback=?", args,
    function(data, textStatus, jqXHR){ 
        callback(data);
       });
  }
     

  //*********
  //Functions
  //*********
  
  //
  function getReferences(){
  
  }
  
  function countCitationNeededs(){
  
  }
  
  function verifyChembox(){
  //get info from chemspider (& others) and verify consitent

  }




     
 return Wiki;
}());
