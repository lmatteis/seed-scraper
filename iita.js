var scraper = require('scraper');
var db = require("./db.js");

var url = "http://genebank.iita.org",
    nextLink;


var mcpd = {
    "IITA Accession Identifier": "ACCENUMB",
    "Collection code": "COLLNUMB",
    "Genus": "GENUS",
    "Species": "SPECIES",
    "Crop identifier": "CROPNAME",
    "Collection date": "ACQDATE",
    "Country of origin": "ORIGCTY",
    "Latitude": "LATITUDE",
    "Longitude": "LONGITUDE"
};

function accScraper(err, $) {
    if (err) {
        console.log("Something went wrong loading an accession for this page"); 
        return;
    }

    var accession = {};
    $("body > div:last-child table tr").each(function(){
        var $this = $(this),
            children = $this.children(),
            key = children.eq(0).find("b").text().trim(),
            value = children.eq(1).text().trim();

        if(mcpd[key])
            key = mcpd[key];

        accession[key] = value;
    });

    accession["INSTCODE"] = "IITA";

    db.saveDoc(accession["INSTCODE"] + "_" + accession["ACCENUMB"], accession, function(er, ok) {
        /*
        if (er) //throw new Error(JSON.stringify(er));
            console.log("didn't save: "+ accession["IITA Accession Identifier"]+", because: "+ JSON.stringify(er));
        else
            console.log("added: "+ accession["IITA Accession Identifier"]);
        */
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
        });
        nextLink = $("a:contains('Next')").first().attr("href"); // nextLink must return to stdout
    });
}

var pageToScrape = process.argv[4] || "";

scrapeUrl(url + "/browse/" + pageToScrape);

// when this process exists, output the nextLink
process.on("exit", function() {
    console.log("Next: "+nextLink);
});
