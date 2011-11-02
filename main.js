var spawn = require("child_process").spawn;

function trim(string) {
    return string.replace(/^\s*|\s*$/g, '');
}

function iita() {
    function spawnProc(nextLink) {
        console.log("Creating process with link: "+nextLink);
        var test = spawn("node", ["iita.js", process.argv[2], process.argv[3], nextLink]);
          
        test.stdout.on("data", function(data) {
            var next = trim(data.toString());
            // spawn again a new process (creating processes recursively, wow)
            // only if "next" is not "undefined"
            if(next.indexOf("Next") == 0) { // only start new process when Next
                var n = next.replace("Next: ", "");
                if(n && n != "undefined")
                    spawnProc(n);
            }
        });
    }

    // start recursion
    spawnProc("");
}

function ciat() {
    var offset = 0;
    function spawnProc() {
        console.log("Creating process with offset: "+offset);
        var test = spawn("node", ["ciat.js", process.argv[2], process.argv[3], offset]);

        offset += 10; // each page has 10 accessions
          
        test.stdout.on("data", function(data) {
            var next = trim(data.toString());
            if(next.indexOf("Next") == 0) { // only start new process when Next
                spawnProc();
            }
        });
    }

    // start recursion
    spawnProc();
}

ciat();
