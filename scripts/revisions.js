var Revisions = (function () {
    'use strict';
    var Revisions = {};

    function Revision(revid,title,previous,next,size,pageContent,timestamp){
		this.revid = (typeof id === 'undefined') ? undefined : id;
		this.title = (typeof title === 'undefined') ? undefined : title;
		this.size = (typeof size === 'undefined') ? undefined : size;
		this.previous = (typeof previous === 'undefined') ? undefined : previous;
		this.next = (typeof next === 'undefined') ? undefined : next;
		this.pageContent = (typeof pageContent === 'undefined') ? undefined : pageContent;
		this.timestamp = (typeof timestamp === 'undefined') ? undefined : timestamp;
	}


    //Takes an array of revisions and generates the revision tree etc.
	Revisions.processRevisions = function processRevisions(revisions){
      var revisionidmap;
      for(var i = 0; i < (revisions.length - 1);i++){
      //compute the diff size between each revision
      var diffSize = revisions[i].size - revisions[i+1].size;
      revisions[i].diffSize = diffSize;
      //var md5 = b64_md5(revisions[i].content);
      //console.log(md5);
      //create an index mapping from revid into revisions 
      revisionidmap[revisions[i].revid] = i;
      //store all of the lossy/negative edits in deletions    
      if(diffSize < 0) deletions.push(i);   
    }

    return {'revisions' : revisions, 'revisionidmap' : revisionidmap};

    }


     return Revisions;
}());