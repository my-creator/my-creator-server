
var express = require('express');
var router = express.Router();

const upload = require('../../config/multer');
const defaultRes = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const encrypt = require('../../module/encrypt');
const db = require('../../module/pool');
const moment = require('moment');
const authUtil = require('../../module/authUtils');

const moment = require('moment');

//게시글 조회
//- board table 자유(name)게시판익명게시판먹방,게임게시판,크리에이터게시판 (type으로 나눔 enum타입 = 문자열비슷한데 이중에서 선택하기) 
// all 자유익명, category먹방게임,creator보겸벤쯔게시판-> board table -> 게시글따로
//  조회
router.get('/', async (req, res) => {
 const {boardidx, useridx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx, useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});

//첫화면 오늘 뜨는 인기글 조회
router.get('/', async (req, res) => {

    //확인하기(24시간 전)
    const todayTime = moment().format("YYYY-MM-DD");


    let getPostQuery  = "SELECT * FROM post where todayTime = ? - 1 ORDER BY like_cnt DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[todayTime]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});




//게시글 내 최신글 순 조회
//- board table 자유(name)게시판익명게시판먹방,게임게시판,크리에이터게시판 (type으로 나눔 enum타입 = 문자열비슷한데 이중에서 선택하기) 
// all 자유익명, category먹방게임,creator보겸벤쯔게시판-> board table -> 게시글따로
//  조회
router.get('/', async (req, res) => {
 const {boardidx, useridx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ? ORDER BY create_time DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx, useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});




//게시판 내 인기글 순 조회
//- board table 자유(name)게시판익명게시판먹방,게임게시판,크리에이터게시판 (type으로 나눔 enum타입 = 문자열비슷한데 이중에서 선택하기) 
// all 자유익명, category먹방게임,creator보겸벤쯔게시판-> board table -> 게시글따로
//  조회
router.get('/', async (req, res) => {
 const {boardidx, useridx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ? ORDER BY like_cnt DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx, useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});



// 게시글 생성
//
router.post('/', authUtil.isLoggedin, upload.single('img'), (req, res) => {
    const {boardIdx,userIdx,title,contents} = req.body;
    const createTime = moment().format("YYYY-MM-DD");
    const imgUrl = req.file.location;

    // name, title, thumbnail 중 하나라도 없으면 에러 응답
    if(!title || !contents || !boardIdx || !userIdx || !imgUrl){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    //해당 게시판 없으면 에러 응답
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ?";
    let getPostResult = await db.queryParam_Parse(getPostQuery,[boardIdx,userIdx]);

    if(!getPostResult || getPostResult.length < 1){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_SELECT_NOTHING));   
    }


    let postPostQuery = "INSERT INTO post(board_idx, user_idx, title, contents,create_time) VALUES(?, ?, ?,?,?)";
    let postPostResult  = await db.queryParam_Parse(postPostQuery, [boardIdx,userIdx,title,contents,createTime]);


    let getPostidxQuery = "SELECT post_idx from post where board_idx = ? and user_idx = ? and title = ?";
    let getPostidxResult = await db.queryParam_Parse(getPostidxQuery,[boardIdx,userIdx,title]);

    let postPostimgQuery = "INSERT INTO post_media(post_idx,type,media_url) VALUES(?,?,?)";
    //type = 이미지,동영상인 경우 추가해야함!!

    let postPostimgResult = await db.queryParam_Parse(postPostimgQuery,[getPostidxResult,type,imgUrl])

    if (!postPostResult || !postPostimgResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_POST_SUCCESS, postPostResult));
    }
});


// 게시글 수정
router.put('/:postIdx', authUtil.isLoggedin, upload.single('img'), (req, res) => {
    const {postIdx} = req.params;
    const {title,contents,userIdx} = req.body;
    const updateTime  = moment().format("YYYY-MM-DD");
    const imgUrl = req.file.location;
    // postIdx가 없거나 title, contents,thumbnail 전부 없으면 에러 응답
    if(!postIdx || (!name && !title && !req.file)){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    //본인이 올린 글
    let getPostQuery  = "SELECT * FROM post where post_idx = ? and user_idx= ?";
    let getPostResult = await db.queryParam_Parse(getPostQuery,[postIdx,userIdx]);

    if(!getPostResult || getPostResult.length < 1){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_SELECT_NOTHING));   
    }



    if(title || contents || updateTime){
        
        let putPostQuery = "UPDATE post SET ";
        if(title) putPostQuery+= ` title = '${title}',`;
        if(contents) putPostQuery+= ` contents = '${contents}',`;
        if(updateTime) putPostQuery+= ` update_time = '${updateTime}',`;

        putPostQuery = putWebtoonQuery.slice(0, putWebtoonQuery.length-1);
        putPostQuery += " WHERE post_idx = ?";
    
        let putPostResult = await db.queryParam_Parse(putPostQuery, [postIdx]);

    }else if(imgUrl){
        //type추가해야함 (이미지동영상)
        let putPostQuery = "UPDATE post_media SET media_url = ? where post_idx = ?";
        let putPostResult = await db.queryParam_Parse(putPostQuery,[imgUrl,postIdx]);

    }


    if (!putPostResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_UPDATE_ERROR));
    } else if (putPostResult === 0 ){ 
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_UPDATE_NOTHING));
    }else{
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_UPDATE_SUCCESS));
    }
});


// 게시글 삭제
router.delete('/:postIdx', authUtil.isLoggedin,  async(req, res) => {
    const {postIdx} = req.params;
    const {userIdx} = req.body;

    //본인이 올린 글
    let getPostQuery  = "SELECT * FROM post where post_idx = ? and user_idx= ?";
    let getPostResult = await db.queryParam_Parse(getPostQuery,[postIdx,userIdx]);

    if(!getPostResult || getPostResult.length < 1){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.POST_SELECT_NOTHING));   
    }
    
    const deletePostQuery = "DELETE FROM post WHERE post_idx = ?";
    const deletePostResult = await db.queryParam_Parse(deletePostQuery, [postIdx]);



    if (!deletePostResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_DELETE_ERROR));
    } else {
        if(deleteWebtoonResult.affectedRows > 0){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_DELETE_SUCCESS));
        }else{
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.POST_DELETE_NOTHING));
        }
    }
});


//게시글 좋아요,싫어요 부분해야함

module.exports = router;
