var scraper = require('scraper');
var couchdb = require('felix-couchdb'),
    client = couchdb.createClient(80, 'seeds.iriscou.ch', process.argv[2], process.argv[3]),
    db = client.db("accessions");

var mcpd = {
    "Accession No": "ACCENUMB",
    "Institute": "INSTCODE",
    "Genus": "GENUS",
    "Species": "SPECIES",
    "Collection Source": "COLLSRC",
    "Acquistion Date": "ACQDATE",
    "Origin Country": "ORIGCTY",
    "Latitude": "LATITUDE",
    "Longitude": "LONGITUDE",
    "Donor":"DONORCODE",
    "Collection Date":"COLLDATE",
    "Collection site":"COLLSITE",
    "Sample Status":"SAMPSTAT"
};

var species = {
  2: "anatolicum",
  1:"arietinum",
  3:"bijugum",
  14:"canariense",
  4:"chorassanicum",
  5:"cuneatum",
  6: "echinospermum",
  7:"flexuosum",
  15: "floribundum",
  8:"judaicum",
  9:"macracanthum",
  16:"microphyllum",
  17:"montbretii",
  18: "multijugum",
  19: "nuristanicum",
  10:"pinnatifidum",
  20:"pungens",
  21:"rechingeri",
  11:"reticulatum",
  12: "sp.",
  13:"yamashitae"
}

var param = process.argv[4] || "";
var url = "http://grcpregister.icrisat.org/cpregister/getviewdetails.jsp?param1=" + param;
var obj = {};

scraper(url, function(err, $) {
  if (err) {throw err;}
  var $tds = $("td");

  var currKey = "",
      reachedSynonyms = false;
  $tds.each(function(idx) {
    if(reachedSynonyms) return;
    var $this = $(this);
    var val = $this.text();
    if((idx%2)==0) { // is even (key)
      val = val.replace(":","");
      val = $.trim(val);
      if(mcpd[val])
        val = mcpd[val];
      currKey = $.trim(val); 
    } else { // odd (value)
      if(!val) val = $this.find("input").val();
      if(currKey === "Synonyms") {
        reachedSynonyms = true;
        $this.siblings().each(function(idx){
          var currVal = $(this).text();
          if(idx > 1) val += currVal;
        });
      }
      if(currKey === "SPECIES") {
        if(species[val])
          val = species[val];
      }
      if(val && currKey)
        obj[currKey] = $.trim(val);
    }
  });
});
// when this process exists, output the nextLink
process.on("exit", function() {
  if(obj.ACCENUMB && obj.INSTCODE) {
    obj["CROPNAME"] = "Chickpea";
    var docid = encodeURIComponent(obj["INSTCODE"] + "_" + obj["ACCENUMB"]);
    db.saveDoc(docid, obj, function(er, ok) {
        if (er) throw er;
    });
    console.log("Next");
  } else {
    console.log("End");
  }
});
