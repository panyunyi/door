var AV = require('leanengine');
var async = require('async');
/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('clearPower', function (request) {
  let day = new Date('2099-12-30 00:00:00');
  let start = new Date('2011-02-01 00:00:00');
  let now = new Date();
  let query = new AV.Query('UserDoorMap');
  query.equalTo('isDel', false);
  query.equalTo('temporary',true);
  // query.notEqualTo('day', day);
  // query.notEqualTo('start', start);
  // query.lessThan('day', now);
  query.limit(1000);
  query.find().then(function (results) {
    async.map(results, function (result, callback) {
      result.set('isDel',true);
      callback(null, result);
    }, function (err, results) {
      AV.Object.saveAll(results).then(function () {
        return results.length;
      });
    });
  });
});

AV.Cloud.define('deletePower', function (request) {
  let query=new AV.Query('UserDoorMap');
  query.equalTo('isDel',true);
  query.limit(1000);
  query.find().then(function(results){
    AV.Object.destroyAll(results).then(function () {
      // 成功
      return results.length;
    }, function (error) {
      // 异常处理
    });
  });
});
