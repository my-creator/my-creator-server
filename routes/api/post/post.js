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

// 게시글 생성//이미지,동영상,움짤 최대 10개
router.post('/', authUtil.isLoggedin, upload.array('imgs'), async (req, res) => {
    const {boardIdx,title,contents} = req.body;
    const userIdx = req.decoded.user_idx;
    const createTime = moment().format("YYYY-MM-DD");

    const imgUrl = req.files;


    // name, title, thumbnail 중 하나라도 없으면 에러 응답
    if(!title || !contents || !boardIdx || !userIdx || !imgUrl){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    //게시글 db에 제목,내용 넣기
    let postPostQuery = "INSERT INTO post(board_idx, user_idx, title, contents,create_time) VALUES(?, ?, ?,?,?)";
    let postPostResult  = await db.queryParam_Parse(postPostQuery, [boardIdx,userIdx,title,contents,createTime]);


    if (!postPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_POST_SUCCESS, postPostResult));
    }

    //게시글 postIdx 가져오기
    let getPostidxQuery = "SELECT idx from post where board_idx = ? and user_idx = ? and title = ?";
    let getPostidxResult = await db.queryParam_Parse(getPostidxQuery,[boardIdx,userIdx,title]);

    let post_idx = JSON.parse(JSON.stringify(getPostidxResult[0]));
    post_idx = post_idx[0].idx;

//너무 느려서 고쳐야함.
    for (let i = 0; i < imgUrl.length; i++) {

        let mimeType = '';
        console.log("test1\n");
        console.log(imgUrl[i].mimetype);
        switch (imgUrl[i].mimetype) {
          case "image/jpeg":
            mimeType = "IMAGE";
          break;
          case "image/png":
            mimeType = "IMAGE";
          break;
          case "image/gif":
            mimeType = "IMAGE";
          break;
          case "image/bmp":
            mimeType = "IMAGE";
          break;
          case "image/jpg":
            mimeType = "IMAGE";
          break;
          case "video/webm":
            mimeType = "VIDEO";
          break;
          case "video/ogg":
            mimeType = "VIDEO";
          break;
          default:
            mimeType = "IMAGE";
          break;
        }
        //post_media에 각자 넣기
        let postPostimgQuery = "INSERT INTO post_media(post_idx,type,media_url) VALUES(?,?,?)";
        postPostimgResult = await db.queryParam_Parse(postPostimgQuery,[post_idx,mimeType,imgUrl[i].location]);
    }


        if (!postPostimgResult) { //쿼리문이 실패했을 때
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_IMAGE_ERROR));
        } else { //쿼리문이 성공했을 때
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_POST_IMAGE_SUCCESS));
        }
});



// 게시글 수정
router.put('/:postIdx', authUtil.isLoggedin, upload.array('imgs'),async(req, res) => {
    const postIdx = req.params.postIdx;

    let title = "";
    let contents = "";
    let media_url = "";
    if(req.body.title) title+= req.body.title;
    if(req.body.contents) contents+= req.body.contents;
    if(req.body.media_url) media_url+= req.body.media_url;

    if(!title && !contents && !media_url){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    //const imgUrl = req.files;
//imgUrl[i].location

    //본인이 올린 
    let putPostQuery =  "UPDATE  post  SET";
    if(title)  putPostQuery+= ` title = '${title}',`;        
    if(contents) putPostQuery+= `  contents = '${contents}',`;
    putPostQuery = putPostQuery.slice(0, putPostQuery.length-1);
    putPostQuery += ` WHERE idx = '${postIdx}'`;
    
    let putPostResult = await db.queryParam_None(putPostQuery);
    if (!putPostResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_UPDATE_ERROR));
    }else{
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_UPDATE_SUCCESS));
    }

    //이미지 수정기능 추가해야함!
});



// 게시글 삭제
router.delete('/:postIdx', authUtil.isLoggedin,  async(req, res) => {
    const postIdx = req.params.postIdx;



    console.log(postIdx);

    const deletePostMediaQuery = "DELETE FROM post_media WHERE post_idx = ?";
    const deletePostMediaResult = await db.queryParam_Parse(deletePostMediaQuery, [postIdx]);

   if (!deletePostMediaResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_DELETE_ERROR));
    } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_DELETE_SUCCESS));
    }
    
    const deletePostQuery = "DELETE FROM post WHERE idx = ?";
    const deletePostResult = await db.queryParam_Parse(deletePostQuery, [postIdx]);

   if (!deletePostResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_DELETE_ERROR));
    } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_DELETE_SUCCESS));
    }
});



//게시판별 게시글 리스트 조회
router.get('/:boardIdx', async (req, res) => {
 const boardIdx = req.params.boardIdx;
let getPostQuery  = "SELECT * FROM post WHERE board_idx = ?";
    const getPostResult = await db.queryParam_Parse(getPostQuery,boardIdx);
    
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS,getPostResult[0]));
    }
});



//게시글 상세 조회
router.get('/detail/:postIdx', async (req, res) => {
 const {postIdx} = req.params;
    let getPostQuery  = "SELECT * FROM post WHERE idx = ?";
    
    const getPostResult = await db.queryParam_Parse(getPostQuery,[postIdx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult[0]));
    }
});


//게시판 내 최신글 순 조회
router.get('/:boardIdx/new', async (req, res) => { 
    const boardIdx = req.params.boardIdx;
    let getPostByCreateTimeQuery  =`SELECT * FROM post WHERE board_idx =? ORDER BY create_time  DESC`;
    
    const getPostByCreateTimeResult = await db.queryParam_Parse(getPostByCreateTimeQuery,boardIdx);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByCreateTimeResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByCreateTimeResult[0]));
    }
});



//게시판 내 인기글 순 조회
router.get('/:boardIdx/hot', async (req, res) => { 
    const boardIdx = req.params.boardIdx;
//post글 board_idx  = board idx name -> 
    let getPostByHotQuery  = "SELECT * FROM post where board_idx = ? ORDER BY like_cnt DESC";
    
    const getPostByHotResult = await db.queryParam_Parse(getPostByHotQuery,[boardIdx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByHotResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByHotResult[0]));
    }
});



//첫화면 오늘 뜨는 인기글 조회
//정각 기준으로 작성한 글에서 추천수 많은 수로 인기글 순위 매김.  오늘 뜨는 인기글에서 더보기 누르면 인기글로 넘어감.
router.get('/todayhot', async (req, res) => {

    let getTodayHotPostQuery  = "SELECT * FROM post WHERE create_time =  CURDATE() ORDER BY like_cnt DESC";
    let getTodayHotPostResult = await db.queryParam_None(getTodayHotPostQuery);
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getTodayHotPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYHOT_GET_ERROR));
    } else if(getTodayPostResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYHOT_GET_NOTHING))
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_TODAYHOT_GET_SUCCESS, getTodayHotPostResult[0]));
    }
});




//게시글 내용,제목 검색
//localhost:3000/api/posts/search?title=free&contents=category
router.get('/search', async (req, res) => {
 let {title, contents} = req.query;


    let getBoardSearchQuery  = "SELECT * FROM post WHERE"
    if(title) getBoardSearchQuery+= ` title = '${title}'`;
    if(title && contents) getBoardSearchQuery+= ` AND`;
    if(contents) getBoardSearchQuery+= ` contents = '${contents}',`;

    getBoardSearchQuery = getBoardSearchQuery.slice(0, getBoardSearchQuery.length-1);

    
    const getBoardSearchResult = await db.queryParam_None(getBoardSearchQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getBoardSearchResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.GET_BOARD_SEARCH_ERROR));
    } else if(getBoardSearchResult.length === 0){
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.GET_BOARD_SEARCH_ERROR));
    }
    else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.GET_BOARD_SEARCH_SUCCESS,getBoardSearchResult[0]));
    }
});


//토큰 :eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZHgiOjEsImdyYWRlIjoiQURNSU4iLCJuYW1lIjoi66qF64uk7JewIiwiaWF0IjoxNTYyMDU0NTI0LCJleHAiOjE1NjMyNjQxMjQsImlzcyI6InlhbmcifQ.MccUElA8iA4HRcz4IN4mBIxpqoa9i6PUyPbv2aTwT8w


//게시글 좋아요
router.post('/:postIdx/like', authUtil.isLoggedin,  async(req, res) => {
    const postIdx = req.params;
    const userIdx =req.decoded.user_idx;

    console.log("liketest\n");
    console.log(req.params, userIdx);
    
    // just check the
    let getLikePostQuery  = "SELECT * FROM like WHERE post_idx = ? AND user_idx = ?";
    const getLikePostResult = await db.queryParam_Parse(getLikePostQuery, params);

    if(!getLikePostResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.POST_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.POST_LIKE_INSERT_ERROR));
    }

    const postLikeBoardQuery = "INSERT INTO `like`(user_idx, board_idx) VALUES(?, ?)";
    const postLikeBoardResult = await db.queryParam_Parse(postLikeBoardQuery, [postIdx,userIdx]);
    
        if (!postLikeBoardResult) {

            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_LIKE_INSERT_ERROR));
        }else{
            let putPostLikeQuery  = "UPDATE post SET like_cnt = like_cnt + 1 WHERE idx = ?";
            const putPostLikeResult = await db.queryParam_Parse(putPostLikeQuery, [postIdx]);

            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_LIKE_INSERT_SUCCESS));
        }

});


//게시판 즐겨찾기 취소
router.delete(':/postIdx/unlike', authUtil.isLoggedin, async(req, res) => {
   const {boardIdx} = req.params;
    const params = [boardIdx,req.decoded.user_idx];


    console.log("liketest\n");
    console.log(params);
    // just check the
    let getLikeBoardQuery  = "SELECT * FROM board_like WHERE board_idx = ? AND user_idx = ?";
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery, params);

    if(!getLikeBoardResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_DELETE_ERROR));
    }

    const deleteLikeQuery = "DELETE FROM board_like WHERE board_idx = ? AND user_idx = ?";
    const deleteLikeResult = await db.queryParam_Parse(deleteLikeQuery, params);


    deleteLikeResult.then((data)=>{
        if (!data) {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }else{
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }
    
    });
});

//게시글 싫어요
router.post('/:postIdx/hate', authUtil.isLoggedin,  async(req, res) => {
    const {boardIdx} = req.params;
    const params = [boardIdx,req.decoded.user_idx];

    console.log("liketest\n");
    console.log(params);
    // just check the
    let getLikeBoardQuery  = "SELECT * FROM board_like WHERE board_idx = ? AND user_idx = ?";
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery, params);

    if(!getLikeBoardResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_INSERT_ERROR));
    }

    const postLikeBoardQuery = "INSERT INTO `board_like`(user_idx, board_idx) VALUES(?, ?)";
    const postLikeBoardResult = db.queryParam_Parse(postLikeBoardQuery, params);
    
    postLikeBoardResult.then((data)=>{
        if (!data) {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_INSERT_ERROR));
        }else{
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_INSERT_SUCCESS));
        }
    
    });
});

//게시판 즐겨찾기 취소
router.delete(':/postIdx/unhate', authUtil.isLoggedin, async(req, res) => {
   const {boardIdx} = req.params;
    const params = [boardIdx,req.decoded.user_idx];


    console.log("liketest\n");
    console.log(params);
    // just check the
    let getLikeBoardQuery  = "SELECT * FROM board_like WHERE board_idx = ? AND user_idx = ?";
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery, params);

    if(!getLikeBoardResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_DELETE_ERROR));
    }

    const deleteLikeQuery = "DELETE FROM board_like WHERE board_idx = ? AND user_idx = ?";
    const deleteLikeResult = await db.queryParam_Parse(deleteLikeQuery, params);


    deleteLikeResult.then((data)=>{
        if (!data) {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }else{
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }
    
    });
});



module.exports = router;
