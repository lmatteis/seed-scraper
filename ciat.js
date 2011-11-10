var scraper = require('scraper');
var sys = require('util'),
    couchdb = require('felix-couchdb'),
    client = couchdb.createClient(80, 'seeds.iriscou.ch', process.argv[2], process.argv[3]),
    db = client.db("ciat");

function clean(str) {
    return str.replace(/\s+/g, ' ');
}

var offset = process.argv[4] || 0;
var nextLink = false;

var mcpd = {
    "(Identification) Accession number": "ACCENUMB",
    "(Identification) Common names": "ACCENAME",
    "(Collection information) Collection code": "COLLNUMB",
    "(Taxonomic information) Genus": "GENUS",
    "(Taxonomic information) Species": "SPECIES",
    "(Collection information) Date of collection ( dd-mm-yyyy )": "ACQDATE",
    "(Collection information) Country": "ORIGCTY",
    "(Collection information) Latitude (decimal)": "LATITUDE",
    "(Collection information) Longitude (decimal)": "LONGITUDE"
};

var cropname = "Forages";

scraper(
    {
       'uri': 'http://isa.ciat.cgiar.org/urg/showfsearchresults.do?pager.offset='+offset
           , 'headers': {
                'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:7.0.1) Gecko/20100101 Firefox/7.0.1',
                'Accept-Language': 'en-us,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                'Referer': 'http://isa.ciat.cgiar.org/urg/showbsearchresults.do?pager.offset=0',
                'Cookie': 'JSESSIONID=DCAD1180DB0E84912A4DB755585EFC06'
           },
           'encoding': "binary"
    }
    , function(err, $) {
        if (err) {throw err}

        var $children = $("table.marcos").children();
        if(cropname == "Forages") {
            var $topcols = $children.eq(0).find("th"),
                $cols = $children.eq(1).find("th");
        } else {
            var $topcols = $children.eq(1).find("th"),
                $cols = $children.eq(2).find("th");
        }

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
                var topname = "(" + col + ")";
                for(var i=offset; i < (offset + colspan); i++) {
                    col = topname + " " + clean($cols.eq(i).text().trim());
                    cols.push(col);
                }
                offset += colspan;
            } else {
                cols.push(col);
            }

        });

        var $rows = $("table.marcos tr.cuadro4");
        $rows.each(function() {
            var acc = {};
            var $cell = $(this).find("td");
            $cell.each(function(idx){
                var c = cols[idx];
                if(c == "(Collection information) Trip report") {
                    var val = $(this).find("img").attr("onclick");
                } else if(c == "Seed/Plant" || c == "(Allele position for the Locus EST-1) Ref. Gel" || c == "(Allele position for the Locus EST-1) Gel" || c == "(Photo) Seed/Plant" || c == "(Photo) Herbarium" || c == "(Photo) Flower") {
                    var val = $(this).find("a").attr("href");
                } else {
                    var val = clean($(this).text().trim());
                }
                if(mcpd[c])
                    c = mcpd[c];
                if(val)
                    acc[c] = val;
            });
            acc["CROPNAME"] = cropname;
            acc["INSTCODE"] = "CIAT";
            var docid = encodeURIComponent(acc["INSTCODE"] + "_" + acc["ACCENUMB"]);
            //console.log(docid);
            db.saveDoc(docid, acc, function(er, ok) {
                //if (er) throw er;
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
