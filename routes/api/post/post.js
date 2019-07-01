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

// 게시글 생성(왜 안됭,,)
router.post('/', authUtil.isLoggedin, upload.array('imgs'), async (req, res) => {
    const {boardIdx,title,contents,userIdx} = req.body;
    const createTime = moment().format("YYYY-MM-DD");

    console.log(req);

    const imgUrl = req.files;
    for (let i = 0; i < imgUrl.length; i++) {
        console.log(imgUrl[i].location)
    }

    console.log("media\n");
    console.log(imgUrl);


    // name, title, thumbnail 중 하나라도 없으면 에러 응답
    if(!title || !contents || !boardIdx || !userIdx || !imgUrl){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

//USERID를 받아서 USERIDX찾아준다음에 해야하나,,?


    //해당 게시판 없으면 에러 응답
    let getPostQuery  = "SELECT * FROM post where board_idx = ? and user_idx= ?";
    let getPostResult = await db.queryParam_Parse(getPostQuery,[boardIdx,userIdx]);

    if(!getPostResult || getPostResult.length < 1){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_SELECT_NOTHING));   
    }

    //게시글 db에 제목,내용 넣기
    let postPostQuery = "INSERT INTO post(board_idx, user_idx, title, contents,create_time) VALUES(?, ?, ?,?,?)";
    let postPostResult  = await db.queryParam_Parse(postPostQuery, [boardIdx,userIdx,title,contents,createTime]);

    //게시글 postIdx 가져오기
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



//게시판별 게시글 리스트 조회
router.get('/:boardIdx', async (req, res) => {
 const boardIdx = req.params.boardIdx;
let getPostQuery  = "SELECT * FROM post WHERE board_idx = ?";
console.log(req.params);
    const getPostResult = await db.queryParam_Parse(getPostQuery,boardIdx);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS));
    }
});



//게시글 상세 조회
router.get('/detail/:postIdx', async (req, res) => {
 const {postIdx} = req.params;
    let getPostQuery  = "SELECT * FROM post WHERE idx = ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});



//첫화면 오늘 뜨는 인기글 조회
//정각 기준으로 작성한 글에서 추천수 많은 수로 인기글 순위 매김.  오늘 뜨는 인기글에서 더보기 누르면 인기글로 넘어감.
router.get('/', async (req, res) => {

    let getTodayPostQuery  = "SELECT * FROM post WHERE create_time =  CONVERT(date,GETDATE()) ORDER BY like_cnt DESC";
    let getTodayPostResult = await db.queryParam_None(getTodayPostQuery);
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});




//게시판 내 최신글 순 조회
router.get('/:boardIdx/new', async (req, res) => { 
    const {boardidx} = req.body;
    let getPostQuery  = "SELECT * FROM post WHERE board_idx = ? ORDER BY create_time  DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});




//게시판 내 인기글 순 조회
router.get('/:boardIdx/hot', async (req, res) => {
    const {boardidx} = req.body;
//post글 board_idx  = board idx name -> 
    let getPostQuery  = "SELECT * FROM post where board_idx = ? ORDER BY like_cnt DESC";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[boardidx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult));
    }
});



// 게시글 수정
router.put('/:postIdx', authUtil.isLoggedin, upload.single('img'),async(req, res) => {
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


//게시글 좋아요


//게시글 좋아요 취소

//게시글 싫어요

//게시글 싫어요 취소


//게시글 내용,제목 검색




module.exports = router;
