//      ___           ___           ___                         ___           ___           ___                         ___
//     /__/\         /__/\         /  /\                       /  /\         /  /\         /  /\                       /  /\
//    _\_ \:\        \  \:\       /  /::\                     /  /:/_       /  /:/_       /  /::\                     /  /:/_
//   /__/\ \:\        \__\:\     /  /:/\:\    ___     ___    /  /:/ /\     /  /:/ /\     /  /:/\:\    ___     ___    /  /:/ /\
//  _\_ \:\ \:\   ___ /  /::\   /  /:/  \:\  /__/\   /  /\  /  /:/ /:/_   /  /:/ /::\   /  /:/~/::\  /__/\   /  /\  /  /:/ /:/_
// /__/\ \:\ \:\ /__/\  /:/\:\ /__/:/ \__\:\ \  \:\ /  /:/ /__/:/ /:/ /\ /__/:/ /:/\:\ /__/:/ /:/\:\ \  \:\ /  /:/ /__/:/ /:/ /\
// \  \:\ \:\/:/ \  \:\/:/__\/ \  \:\ /  /:/  \  \:\  /:/  \  \:\/:/ /:/ \  \:\/:/~/:/ \  \:\/:/__\/  \  \:\  /:/  \  \:\/:/ /:/
//  \  \:\ \::/   \  \::/       \  \:\  /:/    \  \:\/:/    \  \::/ /:/   \  \::/ /:/   \  \::/        \  \:\/:/    \  \::/ /:/
//   \  \:\/:/     \  \:\        \  \:\/:/      \  \::/      \  \:\/:/     \__\/ /:/     \  \:\         \  \::/      \  \:\/:/
//    \  \::/       \  \:\        \  \::/        \__\/        \  \::/        /__/:/       \  \:\         \__\/        \  \::/
//     \__\/         \__\/         \__\/                       \__\/         \__\/         \__\/                       \__\/
//
//		"We Can Remember it for you, Wholesale!"
//
//
//
//
//



//Main contentscript function
(function () {


     var title,					//WikiPage title of the current page
     	 normalizedTitle,		//The MediaWiki 'normalized' title
     	 pageid,    			//Page ID for current page
     	 current,				//latest revision ID
    	 revisions, 			//Object containing revisions - may or may not contain content.
    	 references,			//References on the page.
    	 deletions = [], 		//Copy of the revisions that are deletions
    	 revisionIDMap = {}, 	//map from revision ID to array position in revisions array.
       	 wholesale = {},		//localStorage variable for wholesale app
    	 showcomments = true;


	LocalStorageUtil.localStorageCheck();


    //TODO check that page action= is view or undefined i.e. that we are on an article
    //Scrape the page title from the page - is there no safer way to do this?
    title = $("#t-permalink").children().first().attr("href");
	title = title.match(/title=(.*)&/)[1];

	//Anchor
 	$('<div class="wholesale"></div>').insertAfter("#siteSub");
 	//make sure we can't see it unitl it's set up
 	$(".wholesale").hide();


	//Add some HTML UI to anchor
 	$(".wholesale").append(
	'<div id="wholesale-history">' +
	'<div>' +
	'<label for="revision">Revision:</label>' +
	'<input type="text" id="revision" readonly="readonly" style="border:0; color:#f6931f; font-weight:bold;" />' +
	'</div>' +
	'<div id ="slider"><div id="slider-range"></div></div>' +
	'<div id="wholesale-comment-user"><span id="wholesale-comment-icon"></span>' +
	'<span id="wholesale-comment-user-content"></span>' +
	'<span id="wholesale-comment-date"></span>' +
	'</div>' +
	'<div id="wholesale-comment"><div id="wholesale-comment-content"></div></div>' +
	'</div>'
	);

 	//Set comment hide/show toggle
	$('#wholesale-comment-icon').mouseover(function () {
	$(this).css('cursor', 'pointer');
	});
	$("#wholesale-comment-icon").click( function(event){
		if($("#wholesale-comment").is(":hidden")){
		$("#wholesale-comment").slideDown();
		}
		else{
		$("#wholesale-comment").slideUp();
		}
	});


	//get page views from stats.grok and dump
	Wiki.getPageViews(title,function(data) {
    	$('.firstHeading').append('<span class="pageviews"><a href="' + data.url +'"> viewed ' + JSON.stringify(data.pageviews) + ' times in the last 30 days. </a></span>');
	});

	//If we dont have revisions data from localStorage then just fetch all (limited by the API) from Wikipedia
    //Use the url as index in local storage.
    if(wholesale[title] != undefined && wholesale[title].revisions != undefined ){
        revisions = wholesale[title].revisions;
    }
    else{

    }

	if(wholesale[title] == undefined){
		wholesale[title] = {};
		Wiki.getAllRevisions(title, getAllRevisionsCallback);
	}
	else{
	//If we have some revisions we need to get the current page's timestamp and see if it is newer
	//get latest revision of page with "title".
		Wiki.getLatestRevision(title,getLatestRevisionCallback);//callback

	}

	function getLatestRevisionCallback(data){

	    	var p = getPageIdFromData(data);
	    	//compared date - this comparison definitely won't work atm
			if(revisions[0].timestamp < data.query.pages[p].revisions[0].timestamp){
				//if it's older then get the newer revisions
				var revidto = revisions[0].revid;
				var revidfrom = data.query.pages[p].revisions[0].revid;
				Wiki.getAllRevisionsFromTo(title,revidfrom,revidto,getAllrevisionsFromToCallback);

			} else {
				//No change so just use stored revisions
				processRevisions(revisions);
				setSlider(revisions.length - 1 ,revisions.length - 1 );

				}

		}

	function getAllRevisionsCallback(data){

	   	//get the revisions object out of the callback data  - revisons are ordered from latests to oldest.
		var p = getPageIdFromData(data);
		revisions = data.query.pages[p].revisions;
		processRevisions(revisions); //do i really need to pass this argument?
		wholesale[title]['revisions'] = revisions;
		setSlider(revisions.length - 1 ,revisions.length - 1);
    }


    function getAllrevisionsFromToCallback(data){

				var p = getPageIdFromData(data);
				var newrevisions = data.query.pages[p].revisions;
				//revisions are returned in order of newest to oldest
				for(var i = newrevisions.length - 1; i > 0; i--){
					revisions.unshift(newrevisions[i]);
				}

				processRevisions(revisions);
				setSlider(revisions.length - 1 ,revisions.length - 1);

	}


    function processRevisions(revisions){

    	for(var i = 0; i < (revisions.length - 1);i++){
			//compute the diff size between each revision
			var diffSize = revisions[i].size - revisions[i+1].size;
			revisions[i].diffSize = diffSize;
			//var md5 = b64_md5(revisions[i].content);
			//console.log(md5);
			//create an index mapping from revid into revisions
			revisionIDMap[revisions[i].revid] = i;
			//store all of the lossy/negative edits in deletions
			if(diffSize < 0) deletions.push(i);
		}

		return revisions;

    }


	function getWikiText(revindex,callback){

		//get the parsed content of the revisions @ rev index only if it isn't already cached.
		//If the revision existing then call the callback immediately and then return;
		if(revisions[revindex].pageContent){
		console.log(revindex + " Cached");
		callback && callback();
		return;
		}

        //else go and fetch from wikipedia and cache - then call callback
        Wiki.getWikiText(revisions[revindex]["revid"],getWikiTextCallback);


		function getWikiTextCallback(data){
			var revid = data.query.pages[pageid].revisions[0].revid;
		 	var parsedPage = data.query.pages[pageid].revisions[0]["*"];
		    revisions[revisionIDMap[revid]].pageContent = parsedPage;
		    cache();
			//if there is a callback to getWikiText - call it.
			callback && callback();
		}

	}




	//Make sure that the wikiText is available for the two revisions then diff and display
	function reveal(rev1, rev2){

	//Bit poor as it forces the requests for Wiki text to be concurrent rather than parallel
	getWikiText(rev1, function (){

		getWikiText(rev2, function(){
			//diff
			var out = diffRevisions(rev1,rev2);

			//display content
			$("#mw-content-text").html(out.content);

			//display user and if present comment
			$("#wholesale-comment").addClass("comment");
			$("#wholesale-comment").addClass("comment-olive-up");
			$("#wholesale-comment-user-content").text(out.comment.user);
			$("#wholesale-comment-date").text(" (" + out.comment.timestamp + ")");
			if(out.comment.content){
				$("#wholesale-comment-icon").removeClass("wholesale-no-comment-icon");
				$("#wholesale-comment-icon").addClass("wholesale-comment-icon");
				$("#wholesale-comment-content").html(out.comment.content);
			}
			else{
				$("#wholesale-comment-icon").addClass("wholesale-no-comment-icon");
				$("#wholesale-comment-icon").removeClass("wholesale-comment-icon");
				$("#wholesale-comment-content").html("No Comment");
			}

			if(showcomments)
				showComments();
		});
	});
	}

	function diffRevisions(rev1,rev2,element){

		//check to see that pageContent for each revision is present.
		if(!revisions[rev1].pageContent || !revisions[rev2].pageContent){
			console.log("error: pageContent not available")
			return;
		}
		element = "Further_reading";
		var content1;
		var content2;
		element = "." + element;
		if(element){
			var jquery1 = $(revisions[rev1].pageContent);
			var jquery2 = $(revisions[rev2].pageContent);
			content1 = jquery1.find(element).nextUntil('<h2>').html();
			content2 = jquery2.find(element).nextUntil('<h2>').html();
			console.log(content1);

		}
		//if either isn't defined then just revert to diffing the whole page content.
		if(!content1 || !content2)
		{
			content1 = revisions[rev1].pageContent;
			content2 = revisions[rev2].pageContent;
		}

		var out = diffString(content1,content2);
		var commentdate = new Date(revisions[rev1].timestamp);
		return {'content': out, 'comment' : {'user' : revisions[rev1].user,'content' : revisions[rev1].parsedcomment, 'timestamp' : commentdate.toString() }};

	}


	//Refactor out to RevisionsUI
	function setSlider(total, loaded){

		$( "#slider-range" ).slider({
				min: 0,
				max: total,
				value: 0,
				step: 1,
				slide: function( event, ui ) {
					$( "#revision" ).val( "" + (ui.value + 1) + " of " + (total + 1) );
					reveal(ui.value,ui.value + 1 );

				}
			});

		$( "#slider-range" ).width("100%");
		$( "#revision" ).val( ($( "#slider-range" ).slider( "value") + 1) + " of " + (total + 1));
		$( ".wholesale").show();

		annotateSlider()

	}

	//Refactor out to RevisionsUI
	//Mark up all of the interesting things!
	function annotateSlider(){


		if(deletions.length > 0){

			var max = $("#slider-range" ).slider( "option", "max" );
			var min = $("#slider-range").slider("option","min");
			var pos = $("#slider-range" ).position();

			for (var i = deletions.length - 1; i >= 0; i--) {

				var percent =  max != min
                            ? (deletions[i] - min) / (max - min) * 100
                            : 0;

              	console.log("rev:" + deletions[i] + " " + percent + "%")
 				var idstring = 'marker' + deletions[i];
 				var hashidstring = '#' + idstring;
                $( "#slider-range" ).parent().append('<div class="marker" id="' + idstring + '"><div class="wholesale-deletion-icon">' + (deletions[i] + 1) + '</div></div>');
                $(hashidstring).css({'z-index' : 5, top: pos.top - 30 + "px", left: percent + "%"}).show();

                $(hashidstring).data('value',deletions[i]);

                $(hashidstring).mouseover(function () {
					$(this).css('cursor', 'pointer');
				});
				$(hashidstring).click( function(event){
					var max = $("#slider-range").slider( "option", "max");
					var value = $(this).data('value');
					$( "#revision" ).val( "" + (  value + 1) + " of " + ( max + 1) );
					$( "#slider-range").slider( "option", "value", value );
					reveal(value,value + 1 );

				});


			}
		}
	}


	function showComments(){
		//for each of the inserts - get its vertical position and then place a comment is the sidebar like show tracking

	}

	function getPageIdFromData(data){
	//will return the pageid from the first pages object (should only be one if we only queried for one page)
	for(var p in data.query.pages){
			pageid = data.query.pages[p].pageid;
			return pageid;
		}

		return undefined;
	}

    function editDistance(
    a, b, // the 2 strings to compare
           // now the placeholder arguments:
    c, d, // two row of the distance matrix
    e, f, // counters to loop through a and b
    g // the last computed distance
    ){
  	for(d=[e=0];a[e];e++) // loop through a and reset the 1st distance

    	for(c=[f=0];b[++f];) // loop through b and reset the 1st col of the next row
      		g=
      		d[f]=
        		e? // not the first row ?
        		1+Math.min( // then compute the cost of each change
         		 d[--f],
          		c[f]-(a[e-1]==b[f]),
          		c[++f]=d[f] // and copy the previous row of the distance matrix
        	)
        	: // otherwise
        	f; // init the very first row of the distance matrix
  		return g
	}


	//Neat if potentially expensive(?) shortcut utils to html encode/decode
	function htmlEncode(value){
     return $('<div/>').text(value).html();
    }

    function htmlDecode(value){
     return $('<div/>').html(value).text();
    }


     function cache(){

    localStorage.setObject('wholesale', wholesale);
  }

}());

 	// Old version of JavaScript diff code from John Resig (http://ejohn.org) & modified by Matthew Gamble to deal better with HTML as input
    // http://ejohn.org/files/jsdiff.js - newer version
    function diffString( o, n ) {

   		var oa = htmlSplit(o);
   		var na = htmlSplit(n);
		var out = diff( oa , na);
		//console.log(out);
		var str = "";

		for ( var i = 0; i < out.n.length - 1; i++ ) {
			if ( out.n[i].text == null ) {
				if ( out.n[i].indexOf('<') == -1 && out.n[i].indexOf('"') == -1 && out.n[i].indexOf('=') == -1 && out.n[i].indexOf('>') == -1 && out.n[i] != "section:" ){
					str += "<s style='background:#FFE6E6;' class='del" + i + "' > " + out.n[i] +"</s>";
					console.log("del: " + i + " "  + out.n[i]);
				}else{
					str += " " + out.n[i];
				}
			} else {

				var pre = "";

				if (out.n[i].text.indexOf('<') == -1 && out.n[i].text.indexOf('"') == -1 && out.n[i].text.indexOf('=') == -1  && out.n[i].text.indexOf('>') == -1 && out.n[i].text != "section:") {
					var n = out.n[i].row + 1;
					while ( n < out.o.length && out.o[n].text == null ) {
						if ( out.o[n].indexOf('"') == -1 && out.o[n].indexOf('<') == -1 && out.o[n].indexOf(':') == -1 && out.o[n].indexOf(';') == -1 && out.o[n].indexOf('=') == -1 && out.o[n].indexOf('>') == -1 && out.o[n] != "section:"){
							pre += " <b style='background:#E6FFE6;' class='ins" + i + "'>" + out.o[n] +" </b>";
							console.log("ins: " + i + " " + out.o[n]);
						}
						else{
						str += " " + out.o[n];
						}
						n++;
					}
				}
				str += " " + out.n[i].text + pre;
			}
		}

		return str;
	}

	function diff( o, n ) {

	  var ns = new Object();
  	  var os = new Object();

  	 //Remove any undefined elements in the array
  	 for (var i = n.length - 1; i >= 0; i--) {
  	 	if ( n[i] == undefined || n[i] == "" ){
  	   		n.splice(i,1);
  	   	}
  	 };
  		 //Remove any undefined elements in the array
  	 for (var i = o.length - 1; i >= 0; i--) {
  	 	if ( o[i] == undefined || o[i] == "" ){
  	   		o.splice(i,1);
  	   	}
  	 };

  	 //for each unique sub-string in new make a note of its position/s
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }

  	//for each unique sub-string in old make a note of its position/s
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }

  	//For all of the sub-strings
  	//if there is only once occurance and it is present in old and new set n[position] to the text and it's position in o (and vice versa)
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
      ns[i] = undefined;
      os[i] = undefined;
    }


  }
  	//These act as anchoring points to identify shifts and then identiy similar substrings more locally
  	//else it either appears more than once .. or it doesn't appear in the old string

  for ( var i = 0; i < n.length - 1; i++ ) {

  	if(n[i].text == null && os[n[i]] == undefined){
  		//then this only occurs in n - move on

  	}
  	else if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null &&
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
      //update ns and os to say that this string at this row has been placed
      ns[n[i+1].text].rows.splice(ns[n[i+1].text].rows.indexOf(i+1),1);
      os[n[i+1].text].rows.splice(os[n[i+1].text].rows.indexOf(n[i].row+1),1);
        if( ns[n[i+1].text].rows.length == 0)
      		ns[n[i+1].text] = undefined;
      if( os[n[i+1].text].rows.length == 0)
      		os[n[i+1].text] = undefined;
    }

  }

  //do the same working backwards

  for ( var i = n.length - 1; i > 0; i-- ) {

	if(n[i].text == null && os[n[i]] == undefined){
  		//then this only occurs in n - move on

  	}
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null &&
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
        //update ns and os to say that this string at this row has been placed
      ns[n[i-1].text].rows.splice(ns[n[i-1].text].rows.indexOf(i-1),1);
      os[n[i-1].text].rows.splice(os[n[i-1].text].rows.indexOf(n[i].row-1),1);
      if( ns[n[i-1].text].rows.length == 0)
      		ns[n[i-1].text] = undefined;
      if( os[n[i-1].text].rows.length == 0)
      		os[n[i-1].text] = undefined;

    }
  }

  //now anything that we haven't converted to {text: --, row: --} in new is added
  //and anything we haven't converted to {text: --, row: --} in old has been removed?
  //not the case - any sequence of tokens that (1) have multiple occurances and (2) are bookeneded by new strings will get missed
  //first pass to rectify this...
 for ( var i in ns ) {
    if (ns[i] != undefined && ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
      ns[i] = undefined;
      os[i] = undefined;
    }
}

  return { o: o, n: n };
}

function htmlSplit(str){

	//first split on html tags
	var strArray = str.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/);
    	//then split non html tags on white space
    	for (var i = strArray.length -1; i >= 0; i--) {
    		if(strArray[i] && !strArray[i].indexOf('<') == 0){
    			var splitsection = strArray[i].split(/\s+/);
    			var strArrayBeg = strArray.slice(0,i);
    			var strArrayEnd = strArray.slice(i + 1);
    			strArray = strArrayBeg.concat(splitsection,strArrayEnd);
    		}

    	};
	return strArray;
}


function isEmpty(str) {
    return (!str || 0 === str.length);
}
