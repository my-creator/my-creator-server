
var express = require('express');
var router = express.Router();

const upload = require('../../../config/multer');
const defaultRes = require('../../../module/utils/utils');
const statusCode = require('../../../module/utils/statusCode');
const resMessage = require('../../../module/utils/responseMessage');
const encrypt = require('../../../module/utils/encrypt');
const db = require('../../../module/utils/pool');
const moment = require('moment');
const authUtil = require('../../../module/utils/authUtils');


// 해시태그 조회
router.get('/', async (req, res) => {
    const getHashtagsQuery = "SELECT * FROM hashtag";
    const getHashtagsResult = await db.queryParam_Parse(getHashtagsQuery);

    if (!getHashtagsResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.HASHTAG_SELECT_SUCCESS, getHashtagsResult));
    }
});


// 해시태그 생성  ====> 필요 없음.
router.post('/', authUtil.isAdmin,async(req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    const postHashtagsQuery = 'INSERT INTO hashtag (name) VALUES (?)';
    const postHashtagsResult = await db.queryParam_Parse(postHashtagsQuery, [name]);

    if (!postHashtagsResult ) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_INSERT_ERROR));
    } else {
        res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.HASHTAG_INSERT_SUCCESS));
    };
});


// 해시태그 수정
router.put('/:hashtagIdx', authUtil.isAdmin, (req, res) => {
    const { hashtagIdx } = req.params;
    const { name } = req.body;

    // hashtagIdx 없으면 에러 응답
    if (!hashtagIdx || !name) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    const putHashtagsQuery = `UPDATE hashtag SET name = ${name} WHERE idx = ${hashtagIdx}`;
    db.queryParam_Parse(putHashtagsQuery, function (result) {
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_UPDATE_ERROR));
        } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CATEGORY_UPDATE_SUCCESS));
        }
    });
});

//해시태그 삭제
router.delete('/:hashtagIdx', authUtil.isAdmin, async (req, res) => {
    const { hashtagIdx } = req.params;

    const deleteHashtagsQuery = "DELETE FROM hashtag WHERE idx = ?";
    const deleteHashtagsResult = await db.queryParam_Parse(deleteHashtagsQuery, [hashtagIdx]);

    if (!deleteHashtagsResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_DELETE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.HASHTAG_DELETE_SUCCESS));
    }
});

module.exports = router;