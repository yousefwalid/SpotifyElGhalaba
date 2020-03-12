/*
 
 ######## #### ##       ######## ######## ########     ##     ##  ######  ######## ########  
 ##        ##  ##          ##    ##       ##     ##    ##     ## ##    ## ##       ##     ## 
 ##        ##  ##          ##    ##       ##     ##    ##     ## ##       ##       ##     ## 
 ######    ##  ##          ##    ######   ########     ##     ##  ######  ######   ########  
 ##        ##  ##          ##    ##       ##   ##      ##     ##       ## ##       ##   ##   
 ##        ##  ##          ##    ##       ##    ##     ##     ## ##    ## ##       ##    ##  
 ##       #### ########    ##    ######## ##     ##     #######   ######  ######## ##     ## 
 
*/

module.exports = (doc, allowedFields, virtualFields) => {
  const filteredDoc = doc._doc;
  Object.keys(filteredDoc).forEach(el => {
    if (!allowedFields.includes(el)) filteredDoc[el] = undefined;
  });
  if (virtualFields) {
    virtualFields.forEach(el => {
      filteredDoc[el] = doc[el];
    });
  }
  return filteredDoc;
};
