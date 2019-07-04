var express = require('express');
var router = express.Router();

const upload = require('../../../config/multer');
const defaultRes = require('../../../module/utils/utils');
const statusCode = require('../../../module/utils/statusCode');
const resMessage = require('../../../module/utils/responseMessage');
const db = require('../../../module/utils/pool');
const authUtil = require('../../../module/utils/authUtils');
const moment = require('moment');
const jwtUtil = require('../../../module/utils/jwt');

// // 1. 크리에이터 생성   ok
// // *** authUtil.isAdmin 추가해야함
router.post('/', upload.single('img'),  (req, res) => {
    const {name, followerCnt, viewCnt, contents, followerCntGrade, viewCntGrade} = req.body;
    const profileUrl = req.file.location;
    const params = [name, profileUrl, followerCnt, viewCnt, contents, followerCntGrade, viewCntGrade];

    //name, profileUrl, followerCnt, viewCnt, tcontents, followerCntGrade, viewCntGrade 중 하나라도 없으면 에러 응답
    if(!name || !profileUrl || !followerCnt || !viewCnt || !contents || !followerCntGrade || !viewCntGrade){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    const postCreatorQuery = "INSERT INTO creator(name, profile_url, follower_cnt, view_cnt,contents, follow_cnt_grade, view_cnt_grade) VALUES(?, ?, ?, ?, ?, ?, ?)";
    const postCreatorsResult = db.queryParam_Parse(postCreatorQuery, params, function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_INSERT_ERROR));
        } else {
                res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_INSERT_SUCCESS));
        }
    });
});


// //2. 크리에이터 수정  ok
// // *** authUtil.isAdmin 추가해야함.
router.put('/:creatorIdx',  upload.single('img'), (req, res) => {
    const {creatorIdx} = req.params;
    const {name,followerCnt, viewCnt, contents, followerCntGrade, viewCntGrade} = req.body;
    const profileUrl = req.file.location;

    //name, profileUrl, followerCnt, viewCnt, contents, followerCntGrade, viewCntGrade 없으면 에러
    if(!creatorIdx || (!name || !req.file || !followerCnt || !viewCnt || !contents || !followerCntGrade || !viewCntGrade)){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    let putCreatorQuery = "UPDATE creator SET ";
    if(name) putCreatorQuery += ` name = '${name}',`;
    if(req.file) putCreatorQuery += ` profile_url = '${profileUrl}',`;
    if(followerCnt) putCreatorQuery += ` follower_cnt = '${followerCnt}',`;
    if(viewCnt) putCreatorQuery += ` view_cnt = '${viewCnt}',`;
    if(contents) putCreatorQuery += ` contents = '${contents}',`;
    if(followerCntGrade) putCreatorQuery += ` follow_cnt_grade = '${followerCntGrade}',`;
    if(viewCntGrade) putCreatorQuery += ` view_cnt_grade = '${viewCntGrade}',`;

    putCreatorQuery = putCreatorQuery.slice(0, putCreatorQuery.length-1);
    putCreatorQuery += " WHERE idx = ? ";

    db.queryParam_Parse(putCreatorQuery, [creatorIdx], function(result){
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_UPDATE_ERROR));
        } else {
            if(result.changedRows > 0){
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_UPDATE_SUCCESS));
            }else{
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.CREATOR_UPDATE_NOTHING));
            }
        }
    });
});



// // 3. 크리에이터 삭제  ok
// // *** authUtil.isAdmin 추가해야함.
router.delete('/:creatorIdx', async(req, res) => {
    const {creatorIdx} = req.params;

    const deleteCreatorQuery = "DELETE FROM creator WHERE idx = ?";
    const deleteCreatorResult = await db.queryParam_Parse(deleteCreatorQuery, [creatorIdx]);

    if (!deleteCreatorResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_DELETE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_DELETE_SUCCESS));
    }
});

//4. 크리에이터 프로필 조회 -->DB수정돼서 DB변경 후 다시 코드 작성 후 test해봐야함.
//current_rank, last_rank, search_cnt빼고 다시 작성
router.get('/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorProfileQuery = "SELECT (name, profile_url, follower_cnt, view_cnt, search_cnt, like_user_cnt, contents, follow_cnt_grade, view_cnt_grade) FROM creator WHERE idx = ?";
    const getCreatorProfileResult = await db.queryParam_Parse(getCreatorProfileQuery, [creatorIdx]);

    if (!getCreatorProfileResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, getCreatorProfileResult));
    }
});

//5. 크리에이터 인기 영상 조회  -> ok
router.get('/:creatorIdx/popularvideo', async (req, res) => {
    const { creatorIdx } = req.params;

    const getPopularVideoQuery = "SELECT * FROM popular_video WHERE creator_idx = ?";
    const getPopularVideoResult = await db.queryParam_Parse(getPopularVideoQuery, [creatorIdx]);

    if (!getPopularVideoResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_POPULARVIDEO_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_POPULARVIDEO_SELECT_SUCCESS, getPopularVideoResult));
    }
});


//희찬오빠가
// // //6. 첫화면 실시간 핫크리에이터 조회 (1 ~ 10위)  => 상승세 기준 : 랭킹 (ex)7위에서 4위되면 상승
// router.get('/hot', async (req, res) => {
//     const getHotCreatorsQuery = "";
//     const getHotCreatorsResult = await db.queryParam_Parse(getHotCreatorsQuery);

//     if (!getHotCreatorsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_HOT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_HOT_SELECT_SUCCESS, getHotCreatorsResult));
//     }
// });


//7. 구독자수별 차트 조회 ok
router.get('/famous', async (req, res) => {
    const getFollowerQuery = "SELECT idx FROM creator ORDER BY follower_cnt DESC";
    const getFollowerResult = await db.queryParam_Parse(getFollowerQuery);

    if (!getFollowerResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FOLLOWER_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.FOLLOWER_SELECT_SUCCESS, getFollowerResult));
    }
});

//8. 특정 크리에이터 구독자수 조회 ok
router.get('/followers/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorFollowerQuery = "SELECT follower_cnt FROM creator WHERE idx = ?";
    const getCreatorFollowerResult = await db.queryParam_Parse(getCreatorFollowerQuery, [creatorIdx]);

    if (!getCreatorFollowerResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_FOLLOWER_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_FOLLOWER_SELECT_SUCCESS, getCreatorFollowerResult));
    }
});

//9. 크리에이터 검색 ok
router.get('/search', async (req, res) => {
    const { name } = req.query;

    const getCreatorSearchQuery = "SELECT * FROM creator WHERE name = ?";
    const getCreatorSearchResult = await db.queryParam_Parse(getCreatorSearchQuery, [name]);

    if (!getCreatorSearchResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_LIST_BY_NAME_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_LIST_BY_NAME_SELECT_SUCCESS, getCreatorSearchResult));
    }
});


//10. 해시태그별 크리에이터 목록 조회  ok
router.get('/search/hashtag', async (req, res) => {
    const { hashtag } = req.query;

    const getHashtagIdxQuery = "SELECT idx FROM hashtag WHERE name = ?";
    const getHashtagIdxResult = await db.queryParam_Parse(getHashtagIdxQuery, [hashtag]);

    const GetHashtagIdx = getHashtagIdxResult[0].idx;

    if (!getHashtagIdxResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_SELECT_ERROR));
    } else {
        const getCreatorHashtagQuery = "SELECT creator_idx FROM creator_hashtag WHERE hashtag_idx = ?";
        const getCreatorHashtagResult = await db.queryParam_Parse(getCreatorHashtagQuery, [GetHashtagIdx]);

        if (!getCreatorHashtagResult) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_LIST_BY_HASHTAG_SELECT_ERROR));
        } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_LIST_BY_HASHTAG_SELECT_SUCCESS, getCreatorHashtagResult));
        }
    }
});


// //11. 카테고리별 크리에이터 목록 조회 ok 
router.get('/search/category', async (req, res) => {
    const { category } = req.query;

    const getCategoryIdxQuery = "SELECT idx FROM hashtag WHERE name = ?";
    const getCategoryIdxResult = await db.queryParam_Parse(getCategoryIdxQuery, [category]);

    const GetCategoryIdx = getCategoryIdxResult[0].idx;

    if (!getCategoryIdxResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_SELECT_ERROR));
    } else {
        const getCreatorCategoryQuery = "SELECT creator_idx FROM creator_category WHERE hashtag_idx = ?";
        const getCreatorCategoryResult = await db.queryParam_Parse(getCreatorCategoryQuery, [GetCategoryIdx]);

        if (!getCreatorCategoryResult) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_LIST_BY_CATEGORY_SELECT_ERROR));
        } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_LIST_BY_CATEGORY_SELECT_SUCCESS, getCreatorCategoryResult));
        }
    }
});


// //12. 크리에이터 해시태그 추가 -> test해야함
// // *** authUtil.isAdmin 추가해야함.
router.post('/:creatorIdx/hashtag/:hashtagIdx', (req, res) => {
    const { creatorIdx, hashtagIdx } = req.params;

    const postCreatorHashtagQuery = "INSERT INTO creator_hashtag (creator_idx, hashtag_idx) VALUES(?, ?)";
    const postCreatorHashtagResult = db.queryParam_Parse(postCreatorHashtagQuery, [creatorIdx, hashtagIdx], function (result) {
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_HASHTAG_INSERT_ERROR));
        } else {
            res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_HASHTAG_INSERT_SUCCESS));
        }
    });
});

// //13. 크리에이터 해시태그 삭제 -> test해야함
// // *** authUtil.isAdmin 추가해야함.
router.delete('/:creatorIdx/hashtag/:hashtagIdx', async (req, res) => {
    const { creatorIdx, hashtagIdx } = req.params;
    const params = [creatorIdx, hashtagIdx];

    const deleteCreatorHashtagQuery = "DELETE FROM creator WHERE creator_idx = ? AND hashtag_idx = ?";
    const deleteCreatorHashtagResult = await db.queryParam_Parse(deleteCreatorHashtagQuery, params);

    if (!deleteCreatorHashtagResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_CATEGORY_DELETE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_CATEGORY_DELETE_SUCCESS));
    }
});

// //14. 크리에이터 카테고리 추가 -> test해야함
// // *** authUtil.isAdmin 추가해야함.
router.post('/:creatorIdx/category/:categoryIdx', (req, res) => {
    const { creatorIdx, categoryIdx } = req.params;

    const postCreatorCategoryQuery = "INSERT INTO creator_hashtag (creator_idx, hashtag_idx) VALUES(?, ?)";
    const postCreatorCategoryResult = db.queryParam_Parse(postCreatorCategoryQuery, [creatorIdx, categoryIdx], function (result) {
        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_CATEGORY_INSERT_ERROR));
        } else {
            res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_CATEGORY_INSERT_SUCCESS));
        }
    });
});

// //15. 크리에이터 카테고리 삭제 -> test해야함
// // *** authUtil.isAdmin 추가해야함.
router.delete('/:creatorIdx/category/:categoryIdx', async(req, res) => {
    const { creatorIdx, categoryIdx } = req.params;
    const params = [creatorIdx, categoryIdx];

    const deleteCreatorHashtagQuery = "DELETE FROM creator WHERE creator_idx = ? AND hashtag_idx = ?";
    const deleteCreatorHashtagResult = await db.queryParam_Parse(deleteCreatorHashtagQuery, params);

    if (!deleteCreatorHashtagResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_CATEGORY_DELETE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_CATEGORY_DELETE_SUCCESS));
    }
});


// //16. 누적 조회수별 조회 (일일)   => 보류
// router.get('/creators/view/today', async(req, res) => {
//     //const getCommentsQuery = "SELECT * FROM ";
//     const getCumulativeViewsResult = await db.queryParam_Parse(getCommentsQuery, [creatorIdx]);

//     if (!getCumulativeViewsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_CUMULATIVE_VIEWS_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_CUMULATIVE_VIEWS_SELECT_SUCCESS, getCumulativeViewsResult));
//     }
// });


// //17. 누적 조회수별 조회 (월별)    => 보류
// router.get('/creators/view/month', async(req, res) => {
//     const getCommentsQuery = "SELECT * FROM";
//     const getCommentsResult = await db.queryParam_Parse(getCommentsQuery);
//     if (!getCommentsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
//     }
// });

// //18. 누적 조회수별 조회 (전체)   => 보류
// router.get('/creators/view/all', async(req, res) => {
// 
//     const getCommentsQuery = "SELECT * FROM  = ?";
//     const getCommentsResult = await db.queryParam_Parse(getCommentsQuery);

//     if (!getCommentsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
//     }
// });


module.exports = router;

