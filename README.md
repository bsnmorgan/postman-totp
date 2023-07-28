# Generating TOTP codes in Postman

I love postman for all sorts of things and have extensively used Postman for generating JWTs, and thought there must be a pure javascript implementation of TOTP for automating the signing to pages that have 2FA as part of a login journey.

So I found this page:

https://www.postman.com/JonLally/workspace/jon-s-public-workspace/request/3698753-fc94f616-5900-4b1a-afb7-b0d50ed113bb

https://gist.github.com/ptrstpp950/42660823675f6bf2f2d2f1503663553a

And minified it to reduce space.

## How to use

### Download it to global variables:
https://raw.githubusercontent.com/bsnmorgan/postman-totp/main/postman-totp.min.js

### or

### Collection Pre-request script:
```javascript
if (!pm.globals.has('totp_library')) {
    pm.sendRequest("https://raw.githubusercontent.com/bsnmorgan/postman-totp/main/postman-totp.min.js", (err, res) => {
        //convert the response to text and save it as a global variable
        pm.globals.set("totp_library", res.text());
    })
}
```

## Request Pre-request script:

```javascript
# set the TOTP secret to environment variable named `2fa_secret`, then execute
eval(pm.globals.get("totp_library"));
upsert_totp("2fa_secret", "2fa_otop");
```
 