/*
 
 ######## #### ##       ######## ######## ########     ##     ##  ######  ######## ########  
 ##        ##  ##          ##    ##       ##     ##    ##     ## ##    ## ##       ##     ## 
 ##        ##  ##          ##    ##       ##     ##    ##     ## ##       ##       ##     ## 
 ######    ##  ##          ##    ######   ########     ##     ##  ######  ######   ########  
 ##        ##  ##          ##    ##       ##   ##      ##     ##       ## ##       ##   ##   
 ##        ##  ##          ##    ##       ##    ##     ##     ## ##    ## ##       ##    ##  
 ##       #### ########    ##    ######## ##     ##     #######   ######  ######## ##     ## 
 
*/

module.exports = (doc, ...allowedFields) => {
  const filteredDoc = doc._doc;
  Object.keys(filteredDoc).forEach(el => {
    if (!allowedFields.includes(el)) filteredDoc[el] = undefined;
  });
  return filteredDoc;
};
