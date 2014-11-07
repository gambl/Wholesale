var LocalStorageUtil = ( function (){

  var LocalStorageUtil = {};

  //add set and get Object methods to localStorage
	Storage.prototype.setObject = function(key, value) {
   		try {
    		this.setItem(key, JSON.stringify(value));
		} catch (e) {
			errorHandler(e);
		}
	}

	Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
	}


  LocalStorageUtil.localStorageCheck = function(){

      if (!LocalStorageUtil.hasLocalStorage())
        return undefined;

      if (localStorage.getItem('wholesale') == undefined){
        var test = {'createdOn' : Date()};
        
        localStorage.setObject('wholesale',test);
      }


      
      wholesale = localStorage.getObject('wholesale');
      //return localStorage.wholesale;

    }


     LocalStorageUtil.hasLocalStorage = function(){

      if (typeof(localStorage) == undefined ) {
      return(false);
    } 

    return true;
  }



	function errorHandler(e) {
  var msg = '';

//Error handler (of sorts) for the local storage 
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error: ' + e.toString();
      break;
  };


  console.log('Error: ' + msg);
}

return LocalStorageUtil;

}());