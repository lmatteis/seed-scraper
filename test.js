var scraper = require('scraper');
var sys = require('util'),
      couchdb = require('felix-couchdb'),
      client = couchdb.createClient(80, 'seeds.iriscouch.com', process.argv[2], process.argv[3]),
      db = client.db('accessions');

var url = "http://genebank.iita.org";

function accScraper(err, $) {
    if (err) {throw err;}

    var accession = {};
    $("body > div:last-child table tr").each(function(){
        var $this = $(this),
            children = $this.children(),
            key = children.eq(0).find("b").text().trim(),
            value = children.eq(1).text().trim();

        accession[key] = value;
    });

    db.saveDoc(accession["IITA Accession Identifier"], accession, function(er, ok) {
        if (er) //throw new Error(JSON.stringify(er));
            console.log("didn't save: "+ accession["IITA Accession Identifier"]+", because: "+ JSON.stringify(er));
        else
            console.log("added: "+ accession["IITA Accession Identifier"]);
    });
}

function scrapeUrl(urlToScrape) {
    scraper(urlToScrape, function(err, $) {
        if (err) {throw err;}
        var $domAccessions = $('.accessionbox div b a');
        $domAccessions.each(function(idx) {
            var $this = $(this),
                link = url + $this.attr("href"),
                linktitle = $this.text().trim();

            // get the accession data!
            scraper(link, accScraper);

            // figure out if we're at the last accession on the page
            // and go to the next page
            if(idx == ($domAccessions.length-1)) {
                var nextLink = $("a:contains('Next')").first().attr("href");
                if(nextLink) { // go to next page
                    scrapeUrl(url + "/browse/" + nextLink);
                }
            }
        });
    });
}

// start recursion
scrapeUrl(url + "/browse");
