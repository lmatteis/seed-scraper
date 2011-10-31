var scraper = require('scraper'),
    db = require("./db.js");

function clean(str) {
    return str.replace(/\s+/g, ' ');
}

scraper(
    {
       'uri': 'http://isa.ciat.cgiar.org/urg/showbsearchresults.do?pager.offset=0'
           , 'headers': {
'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:7.0.1) Gecko/20100101 Firefox/7.0.1',
'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
'Accept-Language': 'en-us,en;q=0.5',
'Accept-Encoding': 'gzip, deflate',
'Accept-Charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
'Referer': 'http://isa.ciat.cgiar.org/urg/showbsearchresults.do?pager.offset=10',
'Cookie':  'JSESSIONID=B930AE3684C9E949E32118916D6F6F14; __utma=148326703.1618406730.1320052661.1320057062.1320061575.3; __utmc=148326703; __utmz=148326703.1320052661.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmb=148326703.15.10.1320061575',
'Cache-Control': 'max-age=0'
           }
    }
    , function(err, $) {
        if (err) {throw err}

        var $children = $("table.marcos").children(),
            $head = $children.eq(2),
            $th = $head.find("th");

        var cols = []; // columns ordered by index
        $th.each(function(idx){
            var col = clean($(this).text().trim());
            cols[idx] = col;
        });
        console.log($th.length);

        var ret = [];

        var $rows = $("table.marcos tr.cuadro4");
        $rows.each(function() {
            var acc = {};
            var $cell = $(this).find("td");
            $cell.each(function(idx){
                var val = clean($(this).text().trim()),
                    c = cols[idx];
                acc[c] = val;
            });
            ret.push(acc);
            console.log($cell.length);
        });
    }
);
