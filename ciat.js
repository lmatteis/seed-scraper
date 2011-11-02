var scraper = require('scraper');
var sys = require('util'),
    couchdb = require('felix-couchdb'),
    client = couchdb.createClient(80, 'seeds.iriscou.ch', process.argv[2], process.argv[3]),
    db = client.db("accessions");

function clean(str) {
    return str.replace(/\s+/g, ' ');
}

var offset = process.argv[4] || 0;
var nextLink = false;

var mcpd = {
    "Accession number": "ACCENUMB",
    "Common names": "ACCENAME",
    "Collection code": "COLLNUMB",
    "Genus": "GENUS",
    "Species": "SPECIES",
    "Date of collection ( dd-mm-yyyy )": "ACQDATE",
    "Country": "ORIGCTY",
    "Latitude (decimal)": "LATITUDE",
    "Longitude (decimal)": "LONGITUDE"
};

scraper(
    {
       'uri': 'http://isa.ciat.cgiar.org/urg/showbsearchresults.do?pager.offset='+offset
           , 'headers': {
                'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:7.0.1) Gecko/20100101 Firefox/7.0.1',
                'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-us,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                'Referer': 'http://isa.ciat.cgiar.org/urg/showbsearchresults.do?pager.offset=10',
                'Cookie': 'JSESSIONID=3FE1511064F1A7507B95462F751F5A21; __utma=148326703.1618406730.1320052661.1320075604.1320223121.6; __utmc=148326703; __utmz=148326703.1320052661.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmb=148326703.10.10.1320223121'
           }
    }
    , function(err, $) {
        if (err) {throw err}

        var $children = $("table.marcos").children(),
            $topcols = $children.eq(1).find("th"),
            $cols = $children.eq(2).find("th");

        var cols = [],
            offset = 0;
        $topcols.each(function(idx){
            var $this = $(this),
                col = clean($this.text().trim()),
                colspan = $this.attr("colspan"),
                rowspan = $this.attr("rowspan");

            if(rowspan) {
                cols.push(col);
            } else if(colspan) { // go and check the other tr
                colspan = parseInt(colspan, 10);
                for(var i=offset; i < (offset + colspan); i++) {
                    col = clean($cols.eq(i).text().trim());
                    cols.push(col);
                }
                offset += colspan;
            }

        });

        var ret = [];

        var $rows = $("table.marcos tr.cuadro4");
        $rows.each(function() {
            var acc = {};
            var $cell = $(this).find("td");
            $cell.each(function(idx){
                var c = cols[idx];
                if(c == "Trip report") {
                    var val = $(this).find("img").attr("onclick");
                } else if(c == "Seed/Plant") {
                    var val = $(this).find("a").attr("href");
                } else {
                    var val = clean($(this).text().trim());
                }
                if(mcpd[c])
                    c = mcpd[c];
                if(val)
                    acc[c] = val;
            });
            acc["CROPNAME"] = "Bean";
            acc["INSTCODE"] = "CIAT";
            //ret.push(acc);
            db.saveDoc(acc["INSTCODE"] + "_" + acc["ACCENUMB"], acc, function(er, ok) {
                //if (er) throw new Error(JSON.stringify(er));
            });
        });

        nextLink = $("a:contains('Next')").first().attr("href"); 
    }
);

// when this process exists, output the nextLink
process.on("exit", function() {
    if(nextLink) {
        console.log("Next");
    } else {
        console.log("End");
    }
});
