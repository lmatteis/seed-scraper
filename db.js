var sys = require('util'),
      couchdb = require('felix-couchdb'),
      client = couchdb.createClient(80, 'seeds.iriscouch.com', process.argv[2], process.argv[3]),
      db = client.db('accessions');

exports.db = db;
