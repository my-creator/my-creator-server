
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
router.get('/ings/newest', async(req, res) => {
    const getVoteQuery = "SELECT * FROM vote WHERE start_time<=now() AND end_time>now() ORDER BY idx DESC LIMIT 1";
    const getVoteResult = await db.queryParam_None(getVoteQuery);
    const result = getVoteResult[0];

    if (!result) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        const getVoteChoiceQuery = 
        `SELECT vc.idx, vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
        fg.name AS follower_grade_name, fg.level AS follower_grade_level, fg.img_url AS follower_grade_img_url, 
        vg.name AS view_grade_img_url, vg.img_url AS view_grade_img_url
            FROM vote_choice vc  
                LEFT JOIN (creator c 
                    INNER JOIN view_grade vg ON c.view_grade_idx = vg.idx
                    INNER JOIN follower_grade fg ON c.follower_grade_idx = fg.idx) ON vc.creator_idx = c.idx 
            WHERE vc.vote_idx = ?;`;
        const getVoteChoiceResult = await db.queryParam_Parse(getVoteChoiceQuery, [result[0].idx]);
        if(!getVoteChoiceResult){
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
        }else{
            result.forEach((vote, index, votes)=>{
                result[index]["choices"] = [];
                getVoteChoiceResult[0].forEach((choice)=>{
                    if(choice.vote_idx == vote.idx){
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
router.get('/ings', async(req, res) => {
    const getVoteQuery = "SELECT * FROM vote WHERE start_time<=now() AND end_time>now() ORDER BY idx DESC;";
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
                idxList += row.idx;
                if(idx !== array.length-1){
                    idxList += ',';
                }
            });
        }
        const getVoteChoiceQuery = 
        `SELECT vc.idx, vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
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
                    if(choice.vote_idx == vote.idx){
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
router.get('/lasts', async(req, res) => {
    const getVoteQuery = "SELECT * FROM vote WHERE end_time <= now() ORDER BY idx DESC;";
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
                idxList += row.idx;
                if(idx !== array.length-1){
                    idxList += ',';
                }
            });
        }
        const getVoteChoiceQuery = 
        `SELECT vc.idx, vc.vote_idx, vc.name, c.profile_url AS creator_profile_url, c.follower_grade_idx, 
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
                    if(choice.vote_idx == vote.idx){
                        result[index]["choices"].push(choice);
                    }
                });
            });
        }
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, result));
    }
});

// 투표 제안
router.post('/suggestion', /*authUtil.isLoggedin,*/ (req, res) => {
    const {title, contents} = req.body;

    // webtoonIdx, title, comment, img, cuts 중 하나라도 없으면 에러 응답
    if (!webtoonIdx || !title || !req.files.img || !req.files.cuts || req.files.cuts.length === 0) {
        console.log(`webtoonIdx : ${webtoonIdx}`);
        console.log(`title : ${title}`);
        console.log(`req.files : ${req.files}`);
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getWebtoonQuery = "SELECT * FROM webtoon WHERE webtoon_idx = ?";
    const getWebtoonResult = db.queryParam_Parse(getWebtoonQuery, [webtoonIdx]);

    getWebtoonResult.then(()=>{
        if(!getWebtoonResult || getWebtoonResult.length < 1){
            res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.WEBTOON_SELECT_NOTHING + `: ${webtoonIdx}`));
        }
    
        const imgUrl = req.files.img[0].location;
        const params = [webtoonIdx, title, imgUrl];
    
        const postEpisodeQuery = "INSERT INTO episode(webtoon_idx, title, img_url, views, date) VALUES(?, ?, ?, 0, now())";
        db.queryParam_Parse(postEpisodeQuery, params, function (result) {
            if (!result) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_INSERT_ERROR));
            } else {
                let postCutsQuery = "INSERT INTO cut(episode_idx, img_url) VALUES";
                req.files.cuts.forEach(function (item, index, array) {
                    postCutsQuery += `(${result.insertId}, '${item.location}'),`;
                });
                postCutsQuery = postCutsQuery.slice(0, postCutsQuery.length-1);
                db.queryParam_Parse(postCutsQuery, params, function (result) {
                    if (!result) {
                        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_INSERT_ERROR));
                    } else {
                        res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_INSERT_SUCCESS));
                    }
                });
            }
        });
    });
});

// 에피소드 수정
router.put('/:episodeIdx', authUtil.isAdmin, upload.single('img'), (req, res) => {
    const {episodeIdx} = req.params;
    const {title} = req.body;

    // webtoonIdx가 없거나 title, img 전부 없으면 에러 응답
    if(!episodeIdx || (!title && !req.file)){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    
    let putEpisodeQuery = "UPDATE episode SET ";

    if(title) putEpisodeQuery += ` title = '${title}',`;
    if(req.file) putEpisodeQuery += ` img_url = '${req.file.location}',`;
    putEpisodeQuery = putEpisodeQuery.slice(0, putEpisodeQuery.length-1);

    putEpisodeQuery += " WHERE episode_idx = ?";

    db.queryParam_Parse(putEpisodeQuery, [episodeIdx], function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_UPDATE_ERROR));
        } else {
            if(result.changedRows > 0){
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_UPDATE_SUCCESS));
            }else{
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.EPISODE_UPDATE_NOTHING));
            }
        }
    });
});

// 에피소드 삭제
router.delete('/:episodeIdx', authUtil.isAdmin, async (req, res) => {
    const { episodeIdx } = req.params;

    const deleteEpisodeQuery = "DELETE FROM episode WHERE episode_idx = ?";
    const deleteEpisodeResult = await db.queryParam_Parse(deleteEpisodeQuery, [episodeIdx]);

    if (!deleteEpisodeResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_DELETE_ERROR));
    } else {
        if (deleteEpisodeResult.affectedRows > 0) { // 바뀐 row가 없다면
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_DELETE_SUCCESS));
        } else { // 바뀐 row가 있다면
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_DELETE_NOTHING));
        }
    }
});

// 컷 생성
router.post('/', authUtil.isAdmin, upload.single('img'), (req, res) => {
    const {webtoonIdx, title} = req.body;

    // webtoonIdx, title, comment, img 중 하나라도 없으면 에러 응답
    if(!webtoonIdx || !title || !req.file){
        console.log(`webtoonIdx : ${webtoonIdx}`);
        console.log(`title : ${title}`);
        console.log(`req.img : ${req.file}`);
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const imgUrl = req.file.location;
    const params = [webtoonIdx, title, imgUrl];
    
    const postEpisodeQuery = "INSERT INTO episode(webtoon_idx, title, img_url, views, date) VALUES(?, ?, ?, 0, now())";
    db.queryParam_Parse(postEpisodeQuery, params, function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_INSERT_ERROR));
        } else {
            res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_INSERT_SUCCESS));
        }
    });
});

module.exports = router;
