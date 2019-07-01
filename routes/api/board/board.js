
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

//게시글 조회
//- board table 자유(name)게시판익명게시판먹방,게임게시판,크리에이터게시판 (type으로 나눔 enum타입 = 문자열비슷한데 이중에서 선택하기) 
// all 자유익명, category먹방게임,creator보겸벤쯔게시판-> board table -> 게시글따로
//  조회
router.get('/', async (req, res) => {
 const {boardidx, useridx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT * FROM board WHERE board_idx = ? and user_idx= ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx, useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});



//전체 게시판 조회
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



//즐겨찾기한 게시판 조회

router.get('/', async (req, res) => {

    const {useridx} = req.body;
    

    let getPostQuery  = "SELECT b.idx, b.name,b.type FROM board b JOIN board_like bl ON bl.board_idx = b.idx WHERE user_idx = ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});


//크리에이터 팬 게시판 조회
router.get('/', async (req, res) => {
 const {creator_idx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT b.idx, b.name,b.type FROM board b JOIN board_creator bc ON bc.board_idx = b.idx WHERE creator_idx = ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[creator_idx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});


// 게시판 생성
router.post('/', authUtil.isLoggedin, async (req, res) => {
    const {name,type} = req.body;

    console.log(req.body);
    // name, title, thumbnail 중 하나라도 없으면 에러 응답
    if(!name || !type){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    //해당 게시판 없으면 에러 응답
    let getPostQuery  = "SELECT * FROM board WHERE name = ?";
    let getPostResult = await db.queryParam_Parse(getPostQuery,[name]);

    if(!getPostResult || getPostResult.length < 1){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_SELECT_NOTHING));   
    }


    let postPostQuery = "INSERT INTO board(name, type) VALUES(?, ?)";
    let postPostResult  = await db.queryParam_Parse(postPostQuery, [boardIdx,userIdx,title,contents,createTime]);

    if (!postPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_POST_SUCCESS, postPostResult));
    }

});


// 게시판 수정
router.put('/:postIdx', authUtil.isLoggedin, upload.single('img'), async(req, res) => {
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



// 게시판 삭제
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












//게시판 즐겨찾기
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


//게시판 즐겨찾기 취소
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


//게시판 검색
//// url이 http://a.com/topic?id=1&name=siwa 일때
//  res.send(req.query.id+','+req.query.name); // 1,siwa 출력

router.get('/', async (req, res) => {
 const {boardidx, useridx} = req.query;
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ? ORDER BY like_cnt DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx, useridx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});

module.exports = router;
