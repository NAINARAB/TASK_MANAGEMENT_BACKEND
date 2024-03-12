const _= require('lodash')


const convarrtoobj = (array)=>{
    return _.reduce(array, function(memo, current) { return _.assign(memo, current) },  {})
}

module.exports = convarrtoobj