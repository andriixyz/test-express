var express = require('express');
var app = express();
var fetch = require('node-fetch');

app.listen(3000, function() {
    console.log("[NodeJS] Application Listening on Port 3000");
});

app.get('/api/play/:key', function(req, res) {
    var key = req.params.key;

    var url = 'https://andriixyz.s3.eu-west-1.amazonaws.com/abc3.mp3';

    fetch(url, {
        method: 'HEAD'
    }).then(function(response) {
        if (!response.ok) {
            return res.sendStatus(404);
        }

        var stat = {
            size: parseInt(response.headers.get('content-length'), 10)
        };

        var range = req.headers.range;
        var readStream;

        if (range !== undefined) {
            var parts = range.replace(/bytes=/, "").split("-");

            var partial_start = parts[0];
            var partial_end = parts[1];

            if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
                return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
            }

            var start = parseInt(partial_start, 10);
            var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
            var content_length = (end - start) + 1;

            res.status(206).header({
                'Content-Type': 'audio/mpeg',
                'Content-Length': content_length,
                'Content-Range': "bytes " + start + "-" + end + "/" + stat.size
            });

            console.log({start: start, end: end});

            readStream = fetch(url, {
                headers: {
                    Range: 'bytes=' + start + '-' + end
                }
            });
        } else {
            res.header({
                'Content-Type': 'audio/mpeg',
                'Content-Length': stat.size
            });

            readStream = fetch(url);
        }

        readStream.then(function(response) {
            response.body.pipe(res);
        });
    });
});
