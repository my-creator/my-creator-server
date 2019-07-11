
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

var urlencode = require('urlencode');
var querystring = require('querystring');
var url = require('url');


// 진행중인 투표 조회
//okdk
router.get('/ings/newest', async(req, res) => {
    const getVoteQuery = `SELECT idx AS 'vote_idx',thumbnail_url,create_time,start_time,end_time,title,contents,type,is_permitted 
FROM vote WHERE start_time<=now() AND end_time>now() AND is_permitted = 1 ORDER BY idx DESC LIMIT 1`;
    const getVoteResult = await db.queryParam_None(getVoteQuery);
    const result = getVoteResult[0];

    if (!result) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        const getVoteChoiceQuery = 
        `SELECT vc.idx AS 'choice_idx', vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
        fg.name AS follower_grade_name, fg.level AS follower_grade_level, fg.img_url AS follower_grade_img_url, 
        vg.name AS view_grade_img_url, vg.img_url AS view_grade_img_url
            FROM vote_choice vc  
                LEFT JOIN (creator c 
                    INNER JOIN view_grade vg ON c.view_grade_idx = vg.idx
                    INNER JOIN follower_grade fg ON c.follower_grade_idx = fg.idx) ON vc.creator_idx = c.idx 
            WHERE vc.vote_idx = ?;`;
        const getVoteChoiceResult = await db.queryParam_Parse(getVoteChoiceQuery, [result[0].vote_idx]);
        if(!getVoteChoiceResult){
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
        }else{
            result.forEach((vote, index, votes)=>{
                result[index]["choices"] = [];
                getVoteChoiceResult[0].forEach((choice)=>{
                    if(choice.vote_idx == vote.vote_idx){
                        delete choice.vote_idx;
                        result[index]["choices"].push(choice);
                    }
                });
            });
        }
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, result));
    }
});

// 진행중인 투표 목록 조회
//okdk
router.get('/ings', async(req, res) => {
    const getVoteQuery = "SELECT idx AS 'vote_idx',thumbnail_url,create_time,start_time,end_time,title,contents,type,is_permitted FROM vote WHERE start_time<=now() AND end_time>now() AND is_permitted = 1 ORDER BY idx DESC";
    const getVoteResult = await db.queryParam_None(getVoteQuery);
    const result = getVoteResult[0];

    if (!result) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        let idxList = "";
        if(result.length==0){
            idxList = "-1";
        }else{
            result.forEach((row, idx, array)=>{
                idxList += row.vote_idx;
                if(idx !== array.length-1){
                    idxList += ',';
                }
            });
        }
        const getVoteChoiceQuery = 
        `SELECT vc.idx AS 'choice_idx', vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
        fg.name AS follower_grade_name, fg.level AS follower_grade_level, fg.img_url AS follower_grade_img_url, 
        vg.name AS view_grade_img_url, vg.img_url AS view_grade_img_url
            FROM vote_choice vc  
                LEFT JOIN (creator c 
                    INNER JOIN view_grade vg ON c.view_grade_idx = vg.idx
                    INNER JOIN follower_grade fg ON c.follower_grade_idx = fg.idx) ON vc.creator_idx = c.idx 
            WHERE vc.vote_idx IN (${idxList});`;
        const getVoteChoiceResult = await db.queryParam_None(getVoteChoiceQuery);
        if(!getVoteChoiceResult){
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
        }else{
            choiceResult = getVoteChoiceResult[0];
            result.forEach((vote, index, votes)=>{
                result[index]["choices"] = [];
                choiceResult.forEach((choice)=>{
                    if(choice.vote_idx == vote.vote_idx){
                        delete choice.vote_idx;
                        result[index]["choices"].push(choice);
                    }
                });
            });
        }
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, result));
    }
});

// 지난 투표 조회
//okdk
router.get('/lasts', async(req, res) => {
    const getVoteQuery = "SELECT idx AS 'vote_idx',thumbnail_url,create_time,start_time,end_time,title,contents,type,is_permitted FROM vote WHERE end_time <= now() AND is_permitted = 1 ORDER BY idx DESC;";
    const getVoteResult = await db.queryParam_None(getVoteQuery);
    const result = getVoteResult[0];

    if (!result) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        let idxList;
        if(result.length==0){
            idxList = "-1";
        }else{
            idxList = ""
            result.forEach((row, idx, array)=>{
                idxList += row.vote_idx;
                if(idx !== array.length-1){
                    idxList += ',';
                }
            });
        }
        const getVoteChoiceQuery = 
        `SELECT vc.idx AS 'choice_idx', vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
        fg.name AS follower_grade_name, fg.level AS follower_grade_level, fg.img_url AS follower_grade_img_url, 
        vg.name AS view_grade_img_url, vg.img_url AS view_grade_img_url
            FROM vote_choice vc  
                LEFT JOIN (creator c 
                    INNER JOIN view_grade vg ON c.view_grade_idx = vg.idx
                    INNER JOIN follower_grade fg ON c.follower_grade_idx = fg.idx) ON vc.creator_idx = c.idx 
            WHERE vc.vote_idx IN (${idxList});`;
        const getVoteChoiceResult = await db.queryParam_None(getVoteChoiceQuery);
        choiceResult = getVoteChoiceResult[0];
        if(!choiceResult){
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
        }else{
            result.forEach((vote, index, votes)=>{
                result[index]["choices"] = [];
                choiceResult.forEach((choice)=>{
                    if(choice.vote_idx == vote.vote_idx){
                        result[index]["choices"].push(choice);
                    }
                });
            });
        }
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, result));
    }
});

// 투표 제안
router.post('/suggestion', /*authUtil.isLoggedin,*/ async(req, res) => {
    const {title, choices} = req.body;

    if (!title || !choices) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const insertVoteQuery = "INSERT INTO vote(title) VALUES(?)";
    const insertVoteResult = await db.queryParam_Parse(insertVoteQuery, [title]);

    if(!insertVoteResult){
        return res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, `fail insert vote`));
    }
    
    choices.forEach(async (choice, index, array)=>{
        const insertVoteChoiceQuery = "INSERT INTO vote_choice(vote_idx, name) VALUES (?, ?)";
        const insertVoteChoiceResult = await db.queryParam_Parse(insertVoteChoiceQuery, [insertVoteResult[0].insertId,choice.name]);
        console.log(insertVoteChoiceResult);
    })
    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, `success to suggest vote`));
});


// 투표 하기
router.post('/:voteIdx/take', authUtil.isLoggedin, async(req, res) => {
    const userIdx = req.decoded.user_idx;
    const {voteIdx} = req.params;
    const {choiceIdx} = req.body;

    console.log(userIdx);
    console.log(voteIdx);
    console.log(choiceIdx);

    if (!userIdx || !voteIdx || !choiceIdx) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const insertUserVoteQuery = "INSERT INTO user_vote(vote_idx, user_idx, vote_choice_idx) VALUES(?, ?, ?)";
    const insertUserVoteResult = await db.queryParam_Parse(insertUserVoteQuery, [voteIdx, userIdx, choiceIdx]);

    console.log(insertUserVoteResult);
    if(!insertUserVoteResult){
        return res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, `fail insert vote`));
    }
    
    return res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, `success to take vote`));
});

// 투표 허가
router.put('/:voteIdx/permit', authUtil.isAdmin, async(req, res) => {
    const {voteIdx} = req.params;
    const {startTime, endTime} = req.body;

    if (!voteIdx || !startTime || !endTime) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const permitVoteQuery = "UPDATE vote SET start_time = ?, end_time = ?, is_permitted = 1 WHERE idx = ?";
    const permitVoteResult = await db.queryParam_Parse(permitVoteQuery, [startTime, endTime, voteIdx]);

    console.log(permitVoteResult);
    if(!permitVoteResult){
        return res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, `fail insert vote`));
    }
    
    return res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, `success to permit vote`));
});

// 투표 거부
router.put('/:voteIdx/refuse', authUtil.isAdmin, async(req, res) => {
    const {voteIdx} = req.params;

    if (!voteIdx) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const permitVoteQuery = "UPDATE vote SET is_permitted = 2 WHERE idx = ?";
    const permitVoteResult = await db.queryParam_Parse(permitVoteQuery, [voteIdx]);

    console.log(permitVoteResult);
    if(!permitVoteResult){
        return res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, `fail insert vote`));
    }
    
    return res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, `success to refuse vote`));
});

module.exports = router;
