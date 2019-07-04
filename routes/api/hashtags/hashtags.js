
var express = require('express');
var router = express.Router();

const upload = require('../../../module/config/multer');
const defaultRes = require('../../../module/utils/utils');
const statusCode = require('../../../module/utils/statusCode');
const resMessage = require('../../../module/utils/responseMessage');
const encrypt = require('../../../module/utils/encrypt');
const db = require('../../../module/utils/pool');
const moment = require('moment');
const authUtil = require('../../../module/utils/authUtils');
const jwtUtil = require('../../../module/utils/jwt');

var urlencode = require('urlencode');
var querystring = require('querystring');
var url = require('url');


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
    

// 해시태그 생성
//req.body : name
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
//수정할 정보 : hashtag 테이블 -> name
// authUtil.isAdmin
router.put('/:hashtagIdx', authUtil.isAdmin, (req, res) => {
    const { hashtagIdx } = req.params;
    const { name } = req.body;

    // hashtagIdx, name, is_category 없으면 에러 응답
    if (!hashtagIdx || !name ) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    let putHashtagsQuery = "UPDATE hashtag SET ";
    if (name) putHashtagsQuery += ` name = '${name}',`;
    putHashtagsQuery = putHashtagsQuery.slice(0, putHashtagsQuery.length - 1);      //수정해야하는지 다시 확인하기
    putHashtagsQuery += " WHERE idx = ?";

    db.queryParam_Parse(putHashtagsQuery, [hashtagIdx], function (result) {
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_UPDATE_ERROR));
        } else {
            if (result.changedRows > 0) {
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.HASHTAG_UPDATE_SUCCESS));
            } else {
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.HASHTAG_UPDATE_NOTHING));
            }
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
        if (deleteHashtagsResult.affectedRows > 0) {    // Affected Rows는 “정말로 데이터가 변경”된 경우에만 반영됨, 
            //기존 데이터에 변화가 없는 경우에는 Affected Rows는 0건으로 보여짐 
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.HASHTAG_DELETE_SUCCESS));
        } else {
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.HASHTAG_DELETE_NOTHING));
        }
    }
});

module.exports = router;