var express = require('express');
var router = express.Router();

const upload = require('../module/config/multer');
const defaultRes = require('../module/utils/utils');
const statusCode = require('../module/utils/statusCode');
const resMessage = require('../module/utils/responseMessage');
const encrypt = require('../module/utils/encrypt');
const db = require('../module/utils/pool');
const moment = require('moment');
const authUtil = require('../module/utils/authUtils');
const jwtUtil = require('../module/utils/jwt');


router.post('/signin', async (req, res) => {
    const {id, password} = req.body;

    if (!id || !password) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipByIdQuery = 'SELECT * FROM user WHERE id LIKE ?';
    const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [id]);

    if (!getMembershipByIdResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_SELECT_FAIL));
    } else if (getMembershipByIdResult.length === 0) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SIGN_IN_FAIL));
    } else { //쿼리문이 성공했을 때
        const firstMembershipByIdResult = getMembershipByIdResult[0];
        encrypt.getHashedPassword(password, firstMembershipByIdResult.salt, res, async (hashedPassword) => {
            
            if (firstMembershipByIdResult.password !== hashedPassword) {
                // 비밀번호가 틀렸을 경우
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SIGN_IN_FAIL));
            } else { 
                // 로그인 정보가 일치할 때
                // password, salt 제거
                delete firstMembershipByIdResult.password;
                delete firstMembershipByIdResult.salt;

                // 토큰 발급
                const jwtToken = jwtUtil.sign(firstMembershipByIdResult);
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATE_TOKEN, { "token" : jwtToken}));
            }
        });
    }
});

router.post('/signup', async (req, res) => {
    const {id, password, name} = req.body;
    const params = [id, name];

    if (!id || !password || !name) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipQuery = "SELECT * FROM user WHERE id LIKE ?";
    const getMembershipResult = await db.queryParam_Parse(getMembershipQuery, [id]);

    if(!getMembershipResult){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
    } else if (getMembershipResult.length > 0) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_DUPLICATE));
    } else {
        encrypt.getSalt(res, async (salt) => {
            encrypt.getHashedPassword(password, salt, res, async (hashedPassword) => {
                params.push(hashedPassword);
                params.push(salt);
                const insertMembershipQuery = "INSERT INTO user (id, name, password, salt) VALUES (?, ?, ?, ?)";
                const insertMembershipResult = await db.queryParam_Parse(insertMembershipQuery, params);

                if (!insertMembershipResult) {
                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
                } else { //쿼리문이 성공했을 때
                    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.MEMBERSHIP_INSERT_SUCCESS));
                }
            });
        });
    }
});

module.exports = router;