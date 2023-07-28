! function (e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).upsert_totp = e()
}(
    function () {
        let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

        CryptoJS.enc.u8array = {
            /**
             * Converts a word array to a Uint8Array.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {Uint8Array} The Uint8Array.
             *
             * @static
             *
             * @example
             *
             *     var u8arr = CryptoJS.enc.u8array.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;

                // Convert
                var u8 = new Uint8Array(sigBytes);
                for (var i = 0; i < sigBytes; i++) {
                    var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    u8[i] = byte;
                }

                return u8;
            },

            /**
             * Converts a Uint8Array to a word array.
             *
             * @param {string} u8Str The Uint8Array.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.u8array.parse(u8arr);
             */
            parse: function (u8arr) {
                // Shortcut
                var len = u8arr.length;

                // Convert
                var words = [];
                for (var i = 0; i < len; i++) {
                    words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
                }

                return CryptoJS.lib.WordArray.create(words, len);
            },
        };

        base32toHex = (data) => {
            //Basic argument validation
            if (typeof (data) !== typeof ("")) {
                throw new Error("Argument to base32toHex() is not a string");
            }
            if (data.length === 0) {
                throw new Error("Argument to base32toHex() is empty");
            }
            if (!data.match(/^[A-Z2-7]+=*$/i)) {
                throw new Error("Argument to base32toHex() contains invalid characters");
            }

            //Return value
            var ret = "";
            //Maps base 32 characters to their value (the value is the array index)
            var map = alphabet.split('');
            //Split data into groups of 8
            var segments = (data.toUpperCase() + "========").match(/.{1,8}/g);
            //Adding the "=" in the line above creates an unnecessary entry
            segments.pop();
            //Calculate padding length
            var strip = segments[segments.length - 1].match(/=*$/)[0].length;
            //Too many '=' at the end. Usually a padding error due to an incomplete base32 string
            if (strip > 6) {
                throw new Error("Invalid base32 data (too much padding)");
            }
            //Process base32 in sections of 8 characters
            for (var i = 0; i < segments.length; i++) {
                //Start with empty buffer each time
                var buffer = 0;
                var chars = segments[i].split("");
                //Process characters individually
                for (var j = 0; j < chars.length; j++) {
                    //This is the same as a left shift by 32 characters but without the 32 bit JS int limitation
                    buffer *= map.length;
                    //Map character to real value
                    var index = map.indexOf(chars[j]);
                    //Fix padding by ignoring it for now
                    if (chars[j] === '=') {
                        index = 0;
                    }
                    //Add real value
                    buffer += index;
                }
                //Pad hex string to 10 characters (5 bytes)
                var hex = ("0000000000" + buffer.toString(16)).substr(-10);
                ret += hex;
            }
            //Remove bytes according to the padding
            switch (strip) {
                case 6:
                    return ret.substr(0, ret.length - 8);
                case 4:
                    return ret.substr(0, ret.length - 6);
                case 3:
                    return ret.substr(0, ret.length - 4);
                case 1:
                    return ret.substr(0, ret.length - 2);
                default:
                    return ret;
            }
        };

        truncate = (digest) => {
            const offset = digest[19] & 0xf; // last 4 bits

            // take 4 bytes starting at the specified byte offset,
            // but chop off the first bit so we have only 31 bits
            const v =
                ((digest[offset] & 0x7f) << 24) + // 0x7F = 01111111
                (digest[offset + 1] << 16) +
                (digest[offset + 2] << 8) +
                digest[offset + 3];

            return (v % 10 ** 6).toString(10).padStart(6, "0");
        };


        cryptoJSTotp = (interval, secret) => {
            let digest = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(interval), CryptoJS.enc.Hex.parse(base32toHex(secret))).toString(CryptoJS.enc.u8array);
            return truncate(digest);
        };

        interval = () => {
            // current time, in seconds since the Unix epoch
            const time = Math.floor(new Date().getTime() / 1000);

            // how many 30-second intervals AND pad to 8 bytes = 16 hex characters
            return Math.floor(time / 30)
                .toString(16)
                .padStart(16, "0");
        };

        totp = (secret) => {
            return cryptoJSTotp(interval(), secret);
        }

        return (secret_env_key, totp_env_key) => {
            otp = totp(pm.environment.get(secret_env_key));
            pm.environment.set(totp_env_key, otp);
            return otp;
        }
    })