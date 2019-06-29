var express = require('express');
var router = express.Router();

const upload = require('../../config/multer');
const defaultRes = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const authUtil = require('../../module/authUtils');

// 특정 에피소드의 댓글 조회
router.get('/:episodeIdx', async(req, res) => {
    const {episodeIdx} = req.params;
    
    const getCommentsQuery = "SELECT * FROM comment WHERE episode_idx = ?";
    const getCommentsResult = await db.queryParam_Parse(getCommentsQuery, [episodeIdx]);

    if (!getCommentsResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
    }
});

// 댓글 작성
router.post('/', authUtil.isLoggedin, upload.single('img'), (req, res) => {
    const userIdx = req.decoded.user_idx;
    const {episodeIdx, comment} = req.body;
    const imgUrl = req.file.location;
    const params = [episodeIdx, userIdx, comment, imgUrl];
    
    const getEpisodeQuery = "SELECT * FROM episode WHERE episode_idx = ?";
    const getEpisodeResult = db.queryParam_Parse(getEpisodeQuery, [episodeIdx]);

    getEpisodeResult.then(()=>{
        if(!getEpisodeResult || getEpisodeResult.length < 1){
            res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.EPISODE_SELECT_NOTHING + `: ${episodeIdx}`));
        }
    
        const postCommentsQuery = "INSERT INTO comment(episode_idx, user_idx, comment, img_url) VALUES(?, ?, ?, ?)";
        const postCommentsResult = db.queryParam_Parse(postCommentsQuery, params, function(result){
            if (!result) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_INSERT_ERROR));
            } else {
                res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_INSERT_SUCCESS));
            }
        });
    });
});

// 댓글 수정
router.put('/:commentIdx', authUtil.isCommentWriter, upload.single('img'), (req, res) => {
    const userIdx = req.decoded.user_idx;
    const {commentIdx} = req.params;
    const {comment} = req.body;
    const params = [commentIdx, userIdx];

    // commentIdx가 없거나 userIdx, req.file 전부 없으면 에러 응답
    if(!commentIdx || (!userIdx && !req.file)){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    
    let putEpisodeQuery = "UPDATE comment SET ";
    if(comment) putEpisodeQuery += ` comment = '${comment}',`;
    if(req.file) putEpisodeQuery += ` img_url = '${req.file.location}',`;
    putEpisodeQuery = putEpisodeQuery.slice(0, putEpisodeQuery.length-1);
    putEpisodeQuery += " WHERE comment_idx = ? AND user_idx = ?";

    db.queryParam_Parse(putEpisodeQuery, params, function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_UPDATE_ERROR));
        } else {
            if(result.changedRows > 0){
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_UPDATE_SUCCESS));
            }else{
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.COMMENT_UPDATE_NOTHING));
            }
        }
    });
});

// 댓글 삭제
router.delete('/:commentIdx', authUtil.isCommentWriter,  async(req, res) => {
    const {commentIdx} = req.params;
    
    const deleteCommentQuery = "DELETE FROM comment WHERE comment_idx = ?";
    const deleteCommentResult = await db.queryParam_Parse(deleteCommentQuery, [commentIdx]);

    if (!deleteCommentResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_DELETE_ERROR));
    } else {
        if(deleteCommentResult.affectedRows > 0){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_DELETE_SUCCESS));
        }else{
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.COMMENT_DELETE_NOTHING));
        }
    }
});

module.exports = router;
