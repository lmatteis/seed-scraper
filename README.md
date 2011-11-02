Scrapes genebanks websites to fetch accession data and then puts them in a CouchDB database.

Depends on:

- node.js (of course)
- node-scraper
- node-couchdb

You can install these using `npm`.

Each `<center>.js` file should be used on its own, such as:

    node iita.js <couch-username> <couch-password> <link-of-next-page>
    node ciat.js <couch-username> <couch-password> <offset>

The 3rd parameter changes based on the center. Simply look in it to figure out what's going on.

The `main.js` coordinates the spawning of these process, it creates them recursively so you don't have to run them yourself for each page.

Some centers, like **ciat**, need a session cookie in order to be able to scrape data.
