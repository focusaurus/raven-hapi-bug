# Raven causing havoc in hapi server

## With raven sampleRate: 1

```
time curl -v 'localhost:3000?e=1'
* Rebuilt URL to: localhost:3000/?e=1
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET /?e=1 HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.47.0
> Accept: */*
>
< HTTP/1.1 200 OK
< content-type: application/json; charset=utf-8
< cache-control: no-cache
< content-length: 0
< Date: Fri, 15 Jun 2018 15:45:45 GMT
< Connection: keep-alive
<
* Connection #0 to host localhost left intact
curl -v 'localhost:3000?e=1'  0.01s user 0.00s system 0% cpu 5.814 total
```

* Response status code is `200` instead of `500`
  * I believe raven has somehow managed to delete the error from control flow
* Process hangs for over **5 seconds**

### Digging into root cause
* It seems like `raven/lib/client.js:311` in the client `send` function where `stringify` is called is where chaos takes the reigns

## Same request with raven sampleRate: 0

```
time curl -v 'localhost:3000?e=1'
* Rebuilt URL to: localhost:3000/?e=1
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET /?e=1 HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.47.0
> Accept: */*
>
< HTTP/1.1 500 Internal Server Error
< content-type: application/json; charset=utf-8
< cache-control: no-cache
< content-length: 96
< Date: Fri, 15 Jun 2018 15:50:00 GMT
< Connection: keep-alive
<
* Connection #0 to host localhost left intact
{"statusCode":500,"error":"Internal Server Error","message":"An internal server error occurred"}curl -v 'localhost:3000?e=1'  0.01s user 0.01s system 24% cpu 0.071 total
```

## Environment and reproduction

* Official docker `node:8.4.0` image
* `Linux c6b747433318 4.13.0-43-generic #48~16.04.1-Ubuntu SMP Thu May 17 12:56:46 UTC 2018 x86_64 GNU/Linux`
* node v8.4.0
* raven 2.4.2 and 2.6.2 (latest)
* Also reproduced in google kubernetes engine
  * `Linux server-7559c49564-wwcwc 4.14.22+ #1 SMP Thu May 10 17:54:42 PDT 2018 x86_64 GNU/Linux`

### npm ls output
```
raven-hapi-bug@0.0.1 /opt
+-- boom@5.2.0
| `-- hoek@4.2.1
+-- hapi@13.5.3
| +-- accept@2.1.1
| | +-- boom@3.2.0 deduped
| | `-- hoek@4.0.0 deduped
| +-- ammo@2.0.1
| | +-- boom@3.2.0 deduped
| | `-- hoek@4.0.0 deduped
| +-- boom@3.2.0
| | `-- hoek@4.0.0 deduped
| +-- call@3.0.2
| | +-- boom@3.2.0 deduped
| | `-- hoek@4.0.0 deduped
| +-- catbox@7.1.1
| | +-- boom@3.2.0 deduped
| | +-- hoek@4.0.0 deduped
| | `-- joi@8.1.0 deduped
| +-- catbox-memory@2.0.2
| | `-- hoek@4.0.0 deduped
| +-- cryptiles@3.0.1
| | `-- boom@3.2.0 deduped
| +-- heavy@4.0.1
| | +-- boom@3.2.0 deduped
| | +-- hoek@4.0.0 deduped
| | `-- joi@8.1.0 deduped
| +-- hoek@4.0.0
| +-- iron@4.0.1
| | +-- boom@3.2.0 deduped
| | +-- cryptiles@3.0.1 deduped
| | `-- hoek@4.0.0 deduped
| +-- items@2.1.0
| +-- joi@8.1.0
| | +-- hoek@4.0.0 deduped
| | +-- isemail@2.1.2
| | +-- moment@2.13.0
| | `-- topo@2.0.1 deduped
| +-- kilt@2.0.1
| | `-- hoek@4.0.0 deduped
| +-- mimos@3.0.1
| | +-- hoek@4.0.0 deduped
| | `-- mime-db@1.23.0
| +-- peekaboo@2.0.1
| +-- shot@3.1.0
| +-- statehood@4.0.1
| | +-- boom@3.2.0 deduped
| | +-- cryptiles@3.0.1 deduped
| | +-- hoek@4.0.0 deduped
| | +-- iron@4.0.1 deduped
| | +-- items@2.1.0 deduped
| | `-- joi@8.1.0 deduped
| +-- subtext@4.0.3
| | +-- boom@3.2.0 deduped
| | +-- content@3.0.1
| | | `-- boom@3.2.0 deduped
| | +-- hoek@4.0.0 deduped
| | +-- pez@2.1.1
| | | +-- b64@3.0.1
| | | | `-- hoek@4.0.0 deduped
| | | +-- boom@3.2.0 deduped
| | | +-- content@3.0.1 deduped
| | | +-- hoek@4.0.0 deduped
| | | `-- nigel@2.0.1
| | |   +-- hoek@4.0.0 deduped
| | |   `-- vise@2.0.1
| | |     `-- hoek@4.0.0 deduped
| | `-- wreck@7.2.1
| |   +-- boom@3.2.0 deduped
| |   `-- hoek@4.0.0 deduped
| `-- topo@2.0.1
|   `-- hoek@4.0.0 deduped
`-- raven@2.6.2
  +-- cookie@0.3.1
  +-- md5@2.2.1
  | +-- charenc@0.0.2
  | +-- crypt@0.0.2
  | `-- is-buffer@1.1.6
  +-- stack-trace@0.0.10
  +-- timed-out@4.0.1
  `-- uuid@3.0.0
```
