const defaultRes = require('./utils');
const statusCode = require('./statusCode');
const crypto = require('crypto');

const HASHING_CNT = 10;
const HASHING_LENGTH = 32;
const HASHING_ALGORITHM = "SHA512";
const ENCODING = "base64";

const authModule = {
    getSalt: function(res, callbackFunc){
        crypto.randomBytes(HASHING_LENGTH, (err, buf) => {
            if (err) {
                res.status(statusCode.INTERNAL_SERVER_ERROR).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, err));
            } else {
                const salt = buf.toString(ENCODING);
                callbackFunc(salt);
            }
        });
    },
    getHashedPassword: function(password, salt, res, callbackFunc){
        crypto.pbkdf2(password, salt, HASHING_CNT, HASHING_LENGTH, HASHING_ALGORITHM, (err, result) => {
            if (err) {
                res.status(statusCode.INTERNAL_SERVER_ERROR).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, err));
            } else {
                const hashedPw = result.toString(ENCODING);
                callbackFunc(hashedPw);
            }
        });
    }
};

module.exports = authModule;