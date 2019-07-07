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
const jwtUtil = require('../../../module/utils/jwt');




// 댓글 작성 OKDK
router.post('/', authUtil.isLoggedin, async(req, res) => {
    const {postIdx,comments,is_anonymous} = req.body;
    const userIdx = req.decoded.user_idx;


    //게시글 있는지
    const getPostQuery = "SELECT * FROM post WHERE idx = ?";
    const getPostResult = await db.queryParam_Parse(getPostQuery, [postIdx]);

    console.log(getPostResult[0]);


     if(!getPostResult || getPostResult.length < 1){
            res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.POSTS_SELECT_NOTHING + `: ${postIdx}`));
    }
    
        const postCommentsQuery = "INSERT INTO reply(post_idx, user_idx, content,create_time,is_anonymous) VALUES(?, ?, ?,CURDATE(),?)";
        const postCommentsResult = db.queryParam_Parse(postCommentsQuery, [postIdx,userIdx,comments,is_anonymous], function(result){
            if (!result) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_INSERT_ERROR));
            } else {
                res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_INSERT_SUCCESS));
            }

    });
});


// 댓글 조회성공
//유저명 시간 내용 썸네일
//익명!!!!!!!!!!!!!!!!!!!!!
router.get('/:postIdx', async(req, res) => {
    const {postIdx} = req.params;
    
    const getCommentsQuery = `SELECT r.*, u.name,u.thumbnail 
    FROM ( reply r INNER JOIN user u ON u.idx = r.user_idx) 
    WHERE r.post_idx = ? GROUP BY r.idx ORDER BY r.create_time DESC`;
    const getCommentsResult = await db.queryParam_Parse(getCommentsQuery, [postIdx]);

    if (!getCommentsResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult[0]));
    }
});

// 댓글 수정
//익명!!!!!!!!!!!!!!!!!!!!!
router.put('/:replyIdx', authUtil.isCommentWriter,  (req, res) => {
    
    const {replyIdx} = req.params;
    const {content} = req.body;
    const userIdx = req.decoded.user_idx;
    // commentIdx가 없거나 userIdx, req.file 전부 없으면 에러 응답

    console.log(replyIdx,content,userIdx);
    if(!replyIdx || !content){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    
    let putCommentsQuery = "UPDATE reply SET ";
    if(content) putCommentsQuery += ` content = '${content}',`;
    putCommentsQuery  = putCommentsQuery.slice(0, putCommentsQuery .length-1);
    putCommentsQuery  += " WHERE idx = ? AND user_idx = ?";

    db.queryParam_Parse(putCommentsQuery, [replyIdx,userIdx], function(err,result){
        if (err) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_UPDATE_ERROR));
        } else {
           
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_UPDATE_SUCCESS));
        }
    });
});

// 댓글 삭제
router.delete('/:replyIdx', authUtil.isCommentWriter,  async(req, res) => {
    const {replyIdx} = req.params;


    
    const deleteCommentQuery = "DELETE FROM reply WHERE idx = ?";
    const deleteCommentResult = await db.queryParam_Parse(deleteCommentQuery, [replyIdx]);

    if (!deleteCommentResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_DELETE_ERROR));
    } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_DELETE_SUCCESS));
    }
});

module.exports = router;
