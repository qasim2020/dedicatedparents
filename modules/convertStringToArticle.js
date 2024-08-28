const convertStringToArticle = function( string ) {
    let body = string.split('\n').map(val => {
        if (val == '') return undefined;
        return {
          type: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.')[0] : val.split(': ')[0],
          msg: val.split(': ')[1].trim(),
          class: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.').slice(1,4).join(' ') : ''
        }
      }).filter( val => val != undefined );
    return body;
};

export default convertStringToArticle;