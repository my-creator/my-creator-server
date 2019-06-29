var express = require('express');
var router = express.Router();

const upload = require('../../config/multer');
const defaultRes = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const authUtil = require('../../module/authUtils');

// 에피소드 리스트 조회
router.get('/webtoon/:webtoonIdx', async(req, res) => {
    const {webtoonIdx} = req.params;
    
    const getEpisodeQuery = "SELECT * FROM episode WHERE webtoon_idx = ?";
    const getEpisodeResult = await db.queryParam_Parse(getEpisodeQuery, [webtoonIdx]);

    if (!getEpisodeResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, getEpisodeResult));
    }
});

// 에피소드 상세 조회
router.get('/:episodeIdx', async(req, res) => {
    const {episodeIdx} = req.params;

    let result;
    
    const getEpisodeQuery = "SELECT * FROM episode WHERE episode_idx = ?";
    const getEpisodeResult = await db.queryParam_Parse(getEpisodeQuery, [episodeIdx]);
    result = getEpisodeResult;

    const getCutsQuery = "SELECT img_url FROM cut WHERE episode_idx = ?";
    const getCutsResult = await db.queryParam_Parse(getCutsQuery, [episodeIdx]);
    
    if (!getEpisodeResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.EPISODE_SELECT_ERROR));
    } else {
        if(result.length > 0){
            result[0].cuts = getCutsResult.map(e => e.img_url);
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_SUCCESS, result[0]));
        }else{ // 존재하지 않음
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.EPISODE_SELECT_ERROR));
        }
    }
});

// 에피소드 생성
router.post('/', authUtil.isAdmin, upload.fields([{name: 'img'}, {name: 'cuts', maxCount:10}]), (req, res) => {
    const {webtoonIdx,title} = req.body;

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
