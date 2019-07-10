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

const cron = require('node-cron');


//게시판별 게시글 리스트 조회 okdk
//인기글은 HOT배너//좋아요수 기준
//썸네일(기본/게시글 속 사진), 제목, 등록유저,게시판이름,게시글 등록 시간    

router.get('/listhot/:boardIdx', async (req, res) => {
 const boardIdx = req.params.boardIdx;
let getPosthotQuery  = "SELECT * FROM post WHERE board_idx = ? ORDER BY like_cnt DESC LIMIT 3 ";//인기글 1로 나머지 다 0으로 / 시간 순서 최신순이 위에 
    const getPosthotResult = await db.queryParam_Parse(getPosthotQuery,boardIdx);
    
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPosthotResult || getPosthotResult[0].length === 0) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else{
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS,getPosthotResult[0]));
    }
});

//나머지 최신글 API 2개로 나누기 okdk
router.get('/list/:boardIdx', async (req, res) => {
    const boardIdx = req.params.boardIdx;  
    let getPostQuery  = "SELECT * FROM post WHERE board_idx = ? ORDER BY create_time DESC";//인기글 1로 나머지 다 0으로 / 시간 순서 최신순이 위에 
    const getPostResult = await db.queryParam_Parse(getPostQuery,boardIdx);
    
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult || getPostResult[0].length === 0) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS,getPostResult[0]));
    }
});



//게시글 상세 조회 다~ okdk

router.get('/detail/:postIdx', async (req, res) => {
 const {postIdx} = req.params;
    let getPostQuery  = `SELECT p.*, u.id, u.nickname, u.profile_url , COUNT(r.idx) AS 'reply_cnt' 
    FROM post p 
    INNER JOIN user u ON u.idx = p.user_idx
    INNER JOIN reply r ON p.idx = r.post_idx
    WHERE p.idx = ?`;

    const getPostResult = await db.queryParam_Parse(getPostQuery,[postIdx]);
    console.log(getPostResult);
    console.log(getPostResult[0].length);
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult || getPostResult[0].length == 1) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostResult[0]));
    }
});

//커뮤니티 창 작은 최신글 순 조회(게시판 상관없이 5개만)성공
//썸네일 추가해야함 okdk
router.get('/new', async (req, res) => { 
    const getPostByCreateTimeLimitQuery = `SELECT  p.*,b.*,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx) 
    GROUP BY p.idx
    ORDER BY p.create_time ASC LIMIT 5`;

    /*
    SELECT  p.*,b.*,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx) 
    GROUP BY p.idx
    ORDER BY p.create_time ASC LIMIT 5
    */

    const  getPostByCreateTimeLimitResult = await db.queryParam_None(getPostByCreateTimeLimitQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByCreateTimeLimitResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByCreateTimeLimitResult[0]));
    }
});


//커뮤니티 창 작은 인기글 순 조회(게시판 상관없이 5개만)성공 okdk
//제목추천수,댓글수,등록시간
//일주일 기준 cron !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
router.get('/hot', async (req, res) => { 
    let getPostByHotQuery= `SELECT  p.*,b.*,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx) 
    GROUP BY p.idx
    ORDER BY p.like_cnt DESC LIMIT 5`;  


    
    const getPostByHotResult = await db.queryParam_None(getPostByHotQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByHotResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByHotResult[0]));
    }
});


//전체 인기글 순 조회 성공(게시판 상관없이) Okdk
//제목,이름,게시판,썸네일,시간(int) 
//년,월,일,시간(초빼고
//일주일 기준 cron !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!일주일 사이 글에서만 
/*
SELECT p.idx,p.board_idx,p.user_idx,p.title,p.contents,date_format(p.create_time,'%Y-%m-%d %h:%i'),date_format(p.update_time,'%Y-%m-%d %h:%i'),b.*,u.name
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    GROUP BY p.idx ORDER BY p.like_cnt DESC
*/

router.get('/allhot', async (req, res) => { 
    let getPostByCreateTimeQuery = `SELECT p.*,b.*,u.name,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    GROUP BY p.idx ORDER BY p.like_cnt DESC`;


/*
SELECT  p.*,b.*,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx) 
    GROUP BY p.idx
    ORDER BY p.create_time ASC LIMIT 5
*/


    



    const getPostByCreateTimeResult = await db.queryParam_None(getPostByCreateTimeQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByCreateTimeResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByCreateTimeResult[0]));
    }
});


//전체 최신글 순 조회(성공)(게시판 상관없이) okdk
//제목,이름,게시판,썸네일,시간(int)
//년,월,일,시간(초빼고)
router.get('/allnew', async (req, res) => { 
    let getPostByCreateTimeQuery = `SELECT p.*,b.*,u.name,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    GROUP BY p.idx ORDER BY p.create_time DESC`;

    /*
    SELECT p.*,b.*,u.name,(SELECT COUNT(r.idx) FROM reply r WHERE r.post_idx = p.idx) AS reply_cnt
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    GROUP BY p.idx ORDER BY p.like_cnt DESC*/

    const getPostByCreateTimeResult = await db.queryParam_None(getPostByCreateTimeQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostByCreateTimeResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS, getPostByCreateTimeResult[0]));
    }
});


//첫화면 오늘 뜨는 인기글 조회(3개)성공
//썸네일 
//정각 기준으로 작성한 글에서 추천수 많은 수로 인기글 순위 매김.  오늘 뜨는 인기글에서 더보기 누르면 인기글로 넘어감.
//좋아요수많은 거
//OKDK

router.get('/todayhot', async (req, res) => {

    let getTodayHotPostQuery  = `SELECT p.*,b.*,u.name
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    WHERE p.create_time >= CURDATE() 
    GROUP BY p.idx ORDER BY p.like_cnt DESC`;
    let getTodayHotPostResult = await db.queryParam_None(getTodayHotPostQuery);
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getTodayHotPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYHOT_GET_ERROR));
    } else if(getTodayHotPostResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYHOT_GET_NOTHING))
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_TODAYHOT_GET_SUCCESS, getTodayHotPostResult[0]));
    }
});

//첫화면 방금 막 올라온 최신글 조회(3개)성공 OKDK
router.get('/todaynew', async (req, res) => {

    let getTodayHotPostQuery  = `SELECT p.*,b.*,u.name
    FROM ( post p INNER JOIN board b ON b.idx = p.board_idx)
    INNER JOIN user u ON u.idx = p.user_idx
    WHERE p.create_time >= CURDATE() 
    GROUP BY p.idx ORDER BY p.create_time DESC`;
    let getTodayHotPostResult = await db.queryParam_None(getTodayHotPostQuery);
    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getTodayHotPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYNEW_GET_ERROR));
    } else if(getTodayHotPostResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_TODAYNEW_GET_NOTHING))
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_TODAYNEW_GET_SUCCESS, getTodayHotPostResult[0]));
    }
});




//게시글 내용,제목 검색 okdk
//localhost:3000/api/posts/search?title=free&contents=category
router.get('/search', async (req, res) => {
 let {title, contents} = req.query;

    console.log(title);

    let getBoardSearchQuery  = "SELECT * FROM post WHERE"
    if(title) getBoardSearchQuery+= ` title LIKE '%${title}%'`;
    if(title && contents) getBoardSearchQuery+= ` OR`;
    if(contents) getBoardSearchQuery+= ` contents LIKE '%${contents}%',`;
    if(contents) getBoardSearchQuery = getBoardSearchQuery.slice(0, getBoardSearchQuery.length-1);
   




    
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

//'/:boardIdx'
//게시글 좋아요
//왜 안되냐!!!!!!!!!!!!!!!!!!
router.post('/:postIdx/like', authUtil.isLoggedin,  async(req, res) => {
    const postIdx = req.params.postIdx;
    const userIdx =req.decoded.user_idx;
    const params = [postIdx,userIdx];
    // just check the
    //let getLikePostQuery  = `SELECT * FROM 'like' WHERE post_idx = '${postIdx}' AND user_idx = '${userIdx}'`;
    let getLikePostQuery  = `SELECT * FROM 'like' WHERE post_idx = ? AND user_idx = ?`;
    const getLikePostResult = await db.queryParam_Parse(getLikePostQuery,params);

//user 12 post 43
        console.log("getLIkePostResult");
        console.log(getLikePostResult);

    if(!getLikePostResult){//좋아요 안함
        
//        const postLikeBoardQuery = `INSERT INTO 'like' (post_idx,user_idx) VALUES('${userIdx}', '${postIdx}')`;

       const postLikeBoardQuery = `INSERT INTO 'like' (post_idx,user_idx) VALUES(?, ?)`;
        const postLikeBoardResult = await db.queryParam_Parse(postLikeBoardQuery,params);

        console.log("postLikeBoardResult");
        console.log(postLikeBoardResult);
            if (!postLikeBoardResult) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_INSERT_ERROR));
            }else if(postLikeBoardResult === 0){
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
            }
            else{
                let putPostLikeQuery  = "UPDATE post SET like_cnt = like_cnt + 1 WHERE idx = ?";
                const putPostLikeResult = await db.queryParam_Parse(putPostLikeQuery, [postIdx]);
                
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BOARD_LIKE_INSERT_SUCCESS));
            }

    }else{
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
    }

});






//게시글 좋아요 취소
//왜 안되냐!!!!!!!!!!!!!!!!!!
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
//왜 안되냐!!!!!!!!!!!!!!!!!!
router.post('/:postIdx/hate', authUtil.isLoggedin,  async(req, res) => {
    const {postIdx} = req.params;
    const params = [postIdx,req.decoded.user_idx];

    console.log("liketest\n");
    console.log(params);
    // just check the
    let getLikeBoardQuery  = "SELECT * FROM `like` WHERE post_idx = ? AND user_idx = ?";
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery, params);

    if(!getLikeBoardResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_INSERT_ERROR));
    }

    const postLikeBoardQuery = "INSERT INTO `like`(post_idx,user_idx) VALUES(?, ?)";
    const postLikeBoardResult = db.queryParam_Parse(postLikeBoardQuery, params);
    
    postLikeBoardResult.then((data)=>{
        if (!data) {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_INSERT_ERROR));
        }else{
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_INSERT_SUCCESS));
        }
    
    });
});

//게시글 싫어요 취소
//왜 안되냐!!!!!!!!!!!!!!!!!!
router.delete(':/postIdx/unhate', authUtil.isLoggedin, async(req, res) => {
   const {boardIdx} = req.params;
    const params = [boardIdx,req.decoded.user_idx];


    console.log("liketest\n");
    console.log(params);
    // just check the
    let getLikeBoardQuery  = "SELECT * FROM `like` WHERE board_idx = ? AND user_idx = ?";
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery, params);

    if(!getLikeBoardResult){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else if(getLikeBoardResult.length != 0){//이미 즐겨찾기한 상태
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_LIKE_DELETE_ERROR));
    }

    const deleteLikeQuery = "DELETE FROM `like` WHERE board_idx = ? AND user_idx = ?";
    const deleteLikeResult = await db.queryParam_Parse(deleteLikeQuery, params);


    deleteLikeResult.then((data)=>{
        if (!data) {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }else{
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_DELETE_ERROR));
        }
    
    });
});



// 게시글 생성 okdk
router.post('/', authUtil.isLoggedin, upload.array('imgs'), async (req, res) => {
    const {boardIdx,title,contents,is_anonymous} = req.body;
    const userIdx = req.decoded.user_idx;
    const createTime = moment().format("YYYY-MM-DD");
    const imgUrl = req.files;
    let video_cnt = 0;
    let image_cnt = 0;
    // name, title, thumbnail 중 하나라도 없으면 에러 응답
    if(!title || !contents || !boardIdx){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    

    let thumbnail_url = 'https://meme2367.s3.ap-northeast-2.amazonaws.com/1562469662156.png';
    for (let i = 0; i < imgUrl.length; i++) {

        let mimeType = '';
        
        switch (imgUrl[i].mimetype) {
          case "image/jpeg":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/png":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/gif":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/bmp":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/jpg":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "video/webm":
            mimeType = "VIDEO";
            video_cnt += 1;
          break;
          case "video/ogg":
            mimeType = "VIDEO";
            video_cnt += 1;
          break;
          default:
            break;
        }

        if(video_cnt === 1){
            //기본 로고
            break;
        }else if(image_cnt === 1){
            thumbnail_url =imgUrl[i].location;
        }
    }

    console.log(boardIdx,title,contents,is_anonymous,video_cnt,image_cnt,thumbnail_url,userIdx);
    //게시글 db에 제목,내용 넣기
    let postPostQuery = "INSERT INTO post(board_idx, user_idx, title, contents,create_time,is_anonymous,image_cnt,video_cnt,thumbnail_url) VALUES(?,?, ?, ?,?,?,?,?,?)";
    let postPostResult  = await db.queryParam_Parse(postPostQuery, [boardIdx,userIdx,title,contents,createTime,is_anonymous,image_cnt,video_cnt,thumbnail_url]);

    console.log('#########');
    console.log(postPostResult);
    console.log('#########');

    

    //let post_idx = JSON.parse(JSON.stringify(postPostResult[0].insertId));
    let post_idx = postPostResult[0].insertId;
    console.log("post_idx");
   console.log(post_idx);

     for (let i = 0; i < imgUrl.length; i++) {

        let mimeType = '';
        switch (imgUrl[i].mimetype) {
          case "image/jpeg":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/png":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/gif":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/bmp":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "image/jpg":
            mimeType = "IMAGE";
            image_cnt += 1;
          break;
          case "video/webm":
            mimeType = "VIDEO";
            video_cnt += 1;
          break;
          case "video/ogg":
            mimeType = "VIDEO";
            video_cnt += 1;
          break;
          default:
            break;
        }
        //post_media에 각자 넣기
        let postPostimgQuery = "INSERT INTO post_media(post_idx,type,media_url) VALUES(?,?,?)";
        postPostimgResult = await db.queryParam_Parse(postPostimgQuery,[post_idx,mimeType,imgUrl[i].location]);
    }

        if ( postPostResult[0].length === 0 || !postPostResult) { //쿼리문이 실패했을 때
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_IMAGE_ERROR));
        } else if(!postPostResult[0].insertId){
            
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_POST_IMAGE_ERROR));
        }else{ //쿼리문이 성공했을 때
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_POST_IMAGE_SUCCESS));
        }

});



// 게시글 수정
//익명!!!!!!!!!!!!!!!!!!!!!
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
//익명!!!!!!!!!!!!!!!
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




module.exports = router;
