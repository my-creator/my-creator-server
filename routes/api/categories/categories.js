var express = require('express');
var router = express.Router();

const defaultRes = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const authUtil = require('../../module/authUtils');


// 카테고리 조회
router.get('/', async (req, res) => {
    const getCategoriesQuery = "SELECT * FROM hashtag WHERE is_category IS NOT NULL";
    const getCategoriesResult = await db.queryParam_Parse(getCategoriesQuery);

    if (!getCategoriesResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CATEGORY_SELECT_SUCCESS, getCategoriesResult));
    }
});


//카테고리 생성
//저장할 정보 : hashtag 테이블 -> name, is_category
router.post('/', authUtil.isAdmin, async(req, res) => {
    const { name, is_category } = req.body;
    if (!name || !is_category) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    const postCategoriesQuery = 'INSERT INTO hashtag (name, is_category) VALUES (?,?)';
    const postCategoriesResult = await db.queryParam_Parse(postCategoriesQuery, [name, is_category]);

    const hashtagIdx = postCategoriesResult.insertId;
    console.log("hashtagIdx : " + hashtagIdx);
    const postCreatorCategoryQuery = 'INSERT INTO creator_category (hashtag_idx) VALUES (?)';
    const postCreatorCategoryResult = await db.queryParam_Parse(postCreatorCategoryQuery, [hashtagIdx]);

    if (!postCategoriesResult || !postCreatorCategoryResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_INSERT_ERROR));
    } else {
            res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CATEGORY_INSERT_SUCCESS));
    };
});

// 카테고리 수정
//수정할 정보 : hashtag 테이블 -> name, is_category
// authUtil.isAdmin
router.put('/:categoryIdx', authUtil.isAdmin, (req, res) => {
    const { categoryIdx } = req.params;
    const { name, is_category } = req.body;

    // commentIdx가 없으면 에러 응답
    if (!categoryIdx || !name || !is_category) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    let putCategoriesQuery = "UPDATE hashtag SET ";
    if (name) putCategoriesQuery += ` name = '${name}',`;
    if (is_category) putCategoriesQuery += ` is_category = '${is_category}',`;
    putCategoriesQuery = putCategoriesQuery.slice(0, putCategoriesQuery.length - 1);      //수정해야하는지 다시 확인하기
    putCategoriesQuery += " WHERE idx = ?";

    db.queryParam_Parse(putCategoriesQuery, [categoryIdx], function (result) {
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_UPDATE_ERROR));
        } else {
            if (result.changedRows > 0) {
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CATEGORY_UPDATE_SUCCESS));
            } else {
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.CATEGORY_UPDATE_NOTHING));
            }
        }
    });
});


//카테고리 삭제
router.delete('/:categoryIdx', authUtil.isAdmin, async (req, res) => {
    const { categoryIdx } = req.params;

    const deleteCategoriesQuery = "DELETE FROM hashtag WHERE idx = ?";
    const deleteCategoriesResult = await db.queryParam_Parse(deleteCategoriesQuery, [categoryIdx]);

    if (!deleteCategoriesResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_DELETE_ERROR));
    } else {
        if (deleteCategoriesResult.affectedRows > 0) {    // Affected Rows는 “정말로 데이터가 변경”된 경우에만 반영됨, 
            //기존 데이터에 변화가 없는 경우에는 Affected Rows는 0건으로 보여짐 
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CATEGORY_DELETE_SUCCESS));
        } else {
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.CATEGORY_DELETE_NOTHING));
        }
    }
});


module.exports = router;