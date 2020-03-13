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
  const filteredDoc = doc.toObject();
  Object.keys(filteredDoc).forEach(el => {
    if (!allowedFields.includes(el)) filteredDoc[el] = undefined;
  });
  //console.log(virtualFields);
  if (virtualFields) {
    virtualFields.forEach(el => {
      filteredDoc[el] = doc[el];
    });
  }
  return filteredDoc;
};
