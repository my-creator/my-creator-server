var express = require('express');
var router = express.Router();

const upload = require('../../config/multer');
const defaultRes = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const authUtil = require('../../module/authUtils');

// 메인화면 베너 이미지 조회
router.get('/', async(req, res) => {
    const getBannersQuery = "SELECT * FROM banner";
    const getBannersResult = await db.queryParam_None(getBannersQuery);

    if (!getBannersResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BANNER_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BANNER_SELECT_SUCCESS, getBannersResult));
    }
});

// 메인화면 베너 이미지 생성
router.post('/', authUtil.isAdmin, async(req, res) => {
    // const {img} = req.body;

    res.status(200).send(defaultRes.successFalse(statusCode.OK, "배너 이미지 생성 완료! (미구현)"));
});

// 메인화면 베너 이미지 수정
router.put('/:bannerIdx', authUtil.isAdmin, upload.single('img'), (req, res) => {
    const {bannerIdx} = req.params;

    // commentIdx가 없거나 req.file이 없으면 에러 응답
    if(!bannerIdx|| !req.file){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    
    let putEpisodeQuery = "UPDATE banner SET ";
    if(req.file) putEpisodeQuery += ` img_url = '${req.file.location}',`;
    putEpisodeQuery = putEpisodeQuery.slice(0, putEpisodeQuery.length-1);
    putEpisodeQuery += " WHERE banner_idx = ?";

    db.queryParam_Parse(putEpisodeQuery, [bannerIdx], function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BANNER_UPDATE_ERROR));
        } else {
            if(result.changedRows > 0){
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BANNER_UPDATE_SUCCESS));
            }else{
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.BANNER_DELETE_NOTHING));
            }
        }
    });
});

// 메인화면 베너 이미지 삭제
router.delete('/:bannerIdx', authUtil.isAdmin,  async(req, res) => {
    const {bannerIdx} = req.params;
    
    const deleteBannerQuery = "DELETE FROM banner WHERE banner_idx = ?";
    const deleteBannerResult = await db.queryParam_Parse(deleteBannerQuery, [bannerIdx]);

    if (!deleteBannerResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BANNER_DELETE_ERROR));
    } else {
        if(deleteBannerResult.affectedRows > 0){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BANNER_DELETE_SUCCESS));
        }else{
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.BANNER_DELETE_NOTHING));
        }
    }
});

module.exports = router;
