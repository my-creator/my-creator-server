
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


//크리에이터 팬 게시판 조회
router.get('/creator/:creatorIdx', async (req, res) => {
 const {creatorIdx} =req.params;
//post글 board_idx  = board idx name -> 
    let getCreatorBoardQuery = `SELECT b.idx, b.name,b.type FROM board b JOIN board_creator bc ON bc.board_idx = b.idx WHERE b.type = 'creator' AND creator_idx = ?`;
    
    const getCreatorBoardResult = await db.queryParam_Parse(getCreatorBoardQuery,[creatorIdx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getCreatorBoardResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_BOARD_SELECT_ERROR));
   } else if(getCreatorBoardResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_BOARD_SELECT_ERROR));
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_BOARD_SELECT_SUCCESS,getCreatorBoardResult[0]));
    }
});


//전체 게시판 조회
router.get('/', async (req, res) => { 
    let getPostQuery  = "SELECT * FROM post";
    
    const getPostResult = await db.queryParam_None(getPostQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getPostResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_SELECT_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_SELECT_SUCCESS,getPostResult[0]));
    }
});



//즐겨찾기한 게시판 조회
router.get('/like', async (req, res) => {

    const {userIdx} = req.body;
    console.log("likeboard\n");
    console.log(userIdx);

    let getLikeBoardQuery  = "SELECT b.idx, b.name,b.type FROM board b JOIN board_like bl ON bl.board_idx = b.idx WHERE user_idx = ?";
    
    const getLikeBoardResult = await db.queryParam_Parse(getLikeBoardQuery,[userIdx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getLikeBoardResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_SELECT_ERROR));
    } else if(getLikeBoardResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_LIKE_SELECT_ERROR));
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BOARD_LIKE_SELECT_SUCCESS,getLikeBoardResult[0]));
    }
});



// 게시판 생성
router.post("/", authUtil.isAdmin, async(req, res)=>{
    const {name,type} = req.body;
    //저장 시 필수 값인 게시물Id와 제목(title)이 없으면 실패 response 전송
    console.log(name,type);

    if (!name || !type) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    } else {

        try{

                let postBoardQuery = `INSERT INTO board(name, type) VALUES(?,?)`;
                let postBoardResult  = await db.queryParam_Parse(postBoardQuery,[name,type]);

                               
                if(!postBoardResult){
                    res.status(200).send(defaultRes.successFalse(statusCode.DB_ERROR, resMessage.POST_BOARD_ERROR));
                }else{
                    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_BOARD_SUCCESS));
                }


            }catch(err){
                res.status(200).send(defaultRes.successFalse(statusCode.DB_ERROR, resMessage.POST_BOARD_ERROR));
            }

        }
});




// 게시판 수정
router.put('/:boardIdx', authUtil.isAdmin, async(req, res) => {
    const boardIdx = req.params.boardIdx;
    

    //name or type 하나만인경우도 추가하기!!
    let name = "";
    let type = "";
    if(req.body.name) name+= req.body.name;
    if(req.body.type) type+= req.body.type;

    if(!name || !type ){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    //본인이 올린 
    let putBoardQuery =  "UPDATE  board  SET";
    if(name)  putBoardQuery+= ` name = '${name}',`;        
    if(type) putBoardQuery+= `  type = '${type}',`;
    putBoardQuery = putBoardQuery.slice(0, putBoardQuery.length-1);
    putBoardQuery += ` WHERE idx = '${boardIdx}'`;
    
    let putBoardResult = await db.queryParam_None(putBoardQuery);
    if (!putBoardResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.POST_UPDATE_ERROR));
    }else{
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.POST_UPDATE_SUCCESS));
    }
});










//게시판 삭제
router.delete('/:boardIdx', authUtil.isAdmin, async(req, res) => {
    const boardIdx = req.params.boardIdx;

    const deleteBoardQuery = "DELETE FROM board WHERE idx = ?";
    const deleteBoardResult = await db.queryParam_Parse(deleteBoardQuery, [boardIdx]);


    if (!deleteBoardResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BOARD_DELETE_ERROR));
    } else {
        if(deleteBoardResult.affectedRows > 0){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BOARD_DELETE_SUCCESS));
        }else{
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.BOARD_DELETE_NOTHING));
        }
    }
});



//게시판 즐겨찾기
router.post('/:boardIdx/like', authUtil.isLoggedin,  async(req, res) => {
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
router.delete(':/boardIdx/unlike', authUtil.isLoggedin, async(req, res) => {
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


//게시판 검색 한글 쿼리 입력 으로 수정
//localhost:3000/api/boards/search?name=free&type=category
router.get('/search', async (req, res) => {
 let {name, type} = req.query;


    let getBoardSearchQuery  = "SELECT * FROM board WHERE"
    if(name) getBoardSearchQuery+= ` name = '${name}'`;
    if(name && type) getBoardSearchQuery+= ` AND`;
    if(type) getBoardSearchQuery+= ` type = '${type}',`;

    getBoardSearchQuery = getBoardSearchQuery.slice(0, getBoardSearchQuery.length-1);

    
    const getBoardSearchResult = await db.queryParam_None(getBoardSearchQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getBoardSearchResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.GET_BOARD_SEARCH_ERROR));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.GET_BOARD_SEARCH_SUCCESS,getBoardSearchResult[0]));
    }
});

module.exports = router;
