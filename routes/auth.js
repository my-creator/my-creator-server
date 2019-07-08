var express = require('express');
var router = express.Router();

const upload = require('../config/multer');
const defaultRes = require('../module/utils/utils');
const statusCode = require('../module/utils/statusCode');
const resMessage = require('../module/utils/responseMessage');
const encrypt = require('../module/utils/encrypt');
const db = require('../module/utils/pool');
const moment = require('moment');
const authUtil = require('../module/utils/authUtils');
const jwtUtil = require('../module/utils/jwt');

//로그인 ok's
router.post('/signin', async (req, res) => {
    const { id, password } = req.body;

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

        const firstMembershipByIdResult = JSON.parse(JSON.stringify(getMembershipByIdResult[0]));

        encrypt.getHashedPassword(password, firstMembershipByIdResult[0].salt, res, async (hashedPassword) => {

            if (firstMembershipByIdResult[0].passwd !== hashedPassword) {
                // 비밀번호가 틀렸을 경우
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SIGN_IN_FAIL));
            } else {
                // 로그인 정보가 일치할 때
                // password, salt 제거
                delete firstMembershipByIdResult.passwd;
                delete firstMembershipByIdResult.salt;

                // 토큰 발급
                const jwtToken = jwtUtil.sign(firstMembershipByIdResult);
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATE_TOKEN, { "token": jwtToken }));
            }
        });
    }
});

//회원가입 OKDK
router.post('/signup', async (req, res) => {
    const { id, passwd, name, nickname, gender, birth, grade, profile_url } = req.body;

    if (!id && !passwd && !name && !nickname && !gender && !birth && !grade && !profile_url) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipQuery = "SELECT * FROM user WHERE id = ?";
    const getMembershipResult = await db.queryParam_Parse(getMembershipQuery, [id]);



    if (!getMembershipResult) {//insert 실패
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
    } else if (getMembershipResult[0].length > 0) { //Id 존재 
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_DUPLICATE));
    } else {

        encrypt.getSalt(res, async (salt) => {
            encrypt.getHashedPassword(passwd, salt, res, async (hashedPassword) => {

                const insertMembershipQuery = "INSERT INTO user (id,passwd,salt,name,nickname,gender,birth,grade,profile_url) VALUES (?, ?, ?, ?,?,?,?,?,?)";
                const insertMembershipResult = await db.queryParam_Parse(insertMembershipQuery, [id, hashedPassword, salt, name, nickname, gender, birth, grade, profile_url]);

                console.log(insertMembershipResult);

                if (!insertMembershipResult) {
                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
                } else { //쿼리문이 성공했을 때
                    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.MEMBERSHIP_INSERT_SUCCESS, [id, passwd, salt, name, nickname, gender, birth, grade, profile_url]));
                }
            });
        });
    }

});

module.exports = router;