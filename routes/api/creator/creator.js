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
const upload = require('../../../config/multer');
const defaultRes = require('../../../module/utils/utils');
const statusCode = require('../../../module/utils/statusCode');
const resMessage = require('../../../module/utils/responseMessage');
const db = require('../../../module/utils/pool');
const authUtil = require('../../../module/utils/authUtils');


// // 1. 크리에이터 생성 -> TEST 해야함
// // *** authUtil.isAdmin 추가해야함.
// router.post('/', upload.single('img'),  (req, res) => {
//     
//     const {name,followerCnt, viewCnt, grade, stat1, stat2, stat3, stat4,stat5} = req.body;
//     const profileUrl = req.file.location;
//     const params = [name, profileUrl, followerCnt, viewCnt, grade, stat1, stat2, stat3, stat4,stat5];

//         const postCreatorQuery = "INSERT INTO creator(name, profileUrl, followerCnt, viewCnt, grade, stat1, stat2, stat3, stat4,stat5) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//         const postCreatorsResult = db.queryParam_Parse(postCreatorQuery, params, function(result){
//             if (!result) {
//                 res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_INSERT_ERROR));
//             } else {
//                 res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_INSERT_SUCCESS));
//             }
//         });
// });

// //2. 크리에이터 수정 -> TEST 해야함
// // *** authUtil.isAdmin 추가해야함.
// router.put('/:creatorIdx',  upload.single('img'), (req, res) => {
//     
//     // const {creatorIdx} = req.params;
//     // const {comment} = req.body;
//     // const params = [creatorIdx];
//     const {name,followerCnt, viewCnt, grade, stat1, stat2, stat3, stat4,stat5} = req.body;
//     const profileUrl = req.file.location;
//     const params = [adminIdx, name, profileUrl, followerCnt, viewCnt, grade, stat1, stat2, stat3, stat4,stat5];

//     // creatorIdx 없거나 req.file 전부 없으면 에러 응답
//     if(!creatorIdx || (!adminIdx && !req.file)){
//         res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
//     }

//     let putCreatorQuery = "UPDATE creator SET ";
//     if(name) putCreatorQuery += ` name = '${name}',`;
//     if(req.file) putCreatorQuery += ` profile_url = '${req.file.location}',`;
//     if(followerCnt) putCreatorQuery += ` follower_cnt = '${followerCnt}',`;
//     if(viewCnt) putCreatorQuery += ` view_cnt = '${viewCnt}',`;
//     if(grade) putCreatorQuery += ` grade = '${grade}',`;
//     if(stat1) putCreatorQuery += ` stat1 = '${stat1}',`;
//     if(stat2) putCreatorQuery += ` stat1 = '${stat2}',`;
//     if(stat3) putCreatorQuery += ` stat1 = '${stat3}',`;
//     if(stat4) putCreatorQuery += ` stat1 = '${stat4}',`;
//     if(stat5) putCreatorQuery += ` stat1 = '${stat5}',`;

//     putCreatorQuery = putCreatorQuery.slice(0, putCreatorQuery.length-1);
//     putCreatorQuery += " WHERE idx = ? ";

//     db.queryParam_Parse(putCreatorQuery, params, function(result){
//         if (!result) {
//             res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_UPDATE_ERROR));
//         } else {
//             if(result.changedRows > 0){
//                 res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_UPDATE_SUCCESS));
//             }else{
//                 res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.CREATOR_UPDATE_NOTHING));
//             }
//         }
//     });
// });

// // 3. 크리에이터 삭제 -> TEST 해야함
// // *** authUtil.isAdmin 추가해야함.
// router.delete('/:creatorIdx', async(req, res) => {
//     const {creatorIdx} = req.params;

//     //방법1 select로 name찾아와서 삭제
//     // const getCreatorQuery = "SELECT name FROM creator WHERE creator_idx = ?";
//     // const getCreatorResult = await db.queryParam_Parse(getCreatorQuery, [creatorIdx]);

//     //방법2 req.body로 name 받아서 삭제해야하나?

//     const deleteCreatorQuery = "DELETE FROM creator WHERE creator_idx = ?";
//     const deleteCreatorResult = await db.queryParam_Parse(deleteCreatorQuery, [creatorIdx]);

//     if (!deleteCreatorResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_DELETE_ERROR));
//     } else {
//         if(deleteCommentResult.affectedRows > 0){
//             res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_DELETE_SUCCESS));
//         }else{
//             res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.CREATOR_DELETE_NOTHING));
//         }
//     }
// });

//4. 크리에이터 프로필 조회 ok
router.get('/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorPrifileQuery = "SELECT * FROM creator WHERE idx = ?";
    const getCreatorPrifileResult = await db.queryParam_Parse(getCreatorPrifileQuery, [creatorIdx]);

    if (!getCreatorPrifileResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, getCreatorPrifileResult));
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


// // //6 -1). 첫화면 실시간 핫크리에이터 조회 (1 ~ 10위)  => 상승세 기준 : 랭킹 (ex)7위에서 4위되면 상승
// router.get('/hot', async (req, res) => {
//     // SELECT empno, ename, sal,  
//     //  DENSE_RANK() OVER (ORDER BY sal DESC ) as rk
//     //  FROM emp;
//     // const getHotCreatorsQuery = "SELECT * FROM creator WHERE idx = ? ORDER BY view_cnt DESC";
//     const getHotCreatorsQuery = "SELECT  FROM creator WHERE idx = ? ORDER BY view_cnt DESC";
//     const getHotCreatorsResult = await db.queryParam_Parse(getHotCreatorsQuery);

//     if (!getHotCreatorsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_HOT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_HOT_SELECT_SUCCESS, getHotCreatorsResult));
//     }
// });

// //6 -2). 첫화면 실시간 핫크리에이터 조회 시 뜨는 화살표/검색수 숫자
//today_rank yesterday_rank 비교하면 됨.
// router.get('/hot', async (req, res) => {
//     // SELECT empno, ename, sal,  
//     //  DENSE_RANK() OVER (ORDER BY sal DESC ) as rk
//     //  FROM emp;
//     // const getHotCreatorsQuery = "SELECT * FROM creator WHERE idx = ? ORDER BY view_cnt DESC";
//     const getHotCreatorsQuery = "SELECT * FROM creator WHERE idx = ? ORDER BY view_cnt DESC";
//     const getHotCreatorsResult = await db.queryParam_Parse(getHotCreatorsQuery);

//     if (!getHotCreatorsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_HOT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_HOT_SELECT_SUCCESS, getHotCreatorsResult));
//     }
// });

// //6 -3). 첫화면 실시간 핫크리에이터 조회 밑에 트래픽 시간 조회
// router.get('/hot', async (req, res) => {
//     // SELECT empno, ename, sal,  
//     //  DENSE_RANK() OVER (ORDER BY sal DESC ) as rk
//     //  FROM emp;
//     const getHotCreatorsQuery = "SELECT * FROM creator WHERE idx = ? ORDER BY view_cnt DESC";
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
    console.log(GetHashtagIdx);

    if (!getHashtagIdxResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_SELECT_ERROR));
    } else {
        const getCreatorHashtagQuery = "SELECT creator_idx FROM creator_hashtag WHERE hashtag_idx = ?";
        const getCreatorHashtagResult = await db.queryParam_Parse(getCreatorHashtagQuery, [GetHashtagIdx]);

        if (!getCreatorHashtagResult) {
            console.log(getCreatorHashtagResult);
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
    console.log(GetCategoryIdx);

    if (!getCategoryIdxResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CATEGORY_SELECT_ERROR));
    } else {
        const getCreatorCategoryQuery = "SELECT creator_idx FROM creator_category WHERE hashtag_idx = ?";
        const getCreatorCategoryResult = await db.queryParam_Parse(getCreatorCategoryQuery, [GetCategoryIdx]);

        if (!getCreatorCategoryResult) {
            console.log(getCreatorCategoryResult);
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


//CREATOR_HASHTAG_DELETE_SUCCESS

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


// //16. 누적 조회수별 조회 (일일)
// router.get('/creators/view/today', async(req, res) => {
//     const {creatorIdx} = req.params;

//쿼리작성 참고
// Select DATEPART(dd, order_dt), count(order_no) From 주문테이블
// group by DATEPART(dd, order_dt)
// order by DATEPART(dd, order_dt)

//     const getCommentsQuery = "SELECT * FROM comment WHERE episode_idx = ?";
//     const getCommentsResult = await db.queryParam_Parse(getCommentsQuery, [creatorIdx]);

//     if (!getCommentsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
//     }
// });

// //17. 누적 조회수별 조회 (월별)
// router.get('/creators/view/month', async(req, res) => {
//     const {creatorIdx} = req.params;

//쿼리작성 참고
// Select DATEPART(mm, order_dt), count(order_no) From 주문테이블
// group by DATEPART(mm, order_dt)
// order by DATEPART(mm, order_dt)


//     const getCommentsQuery = "SELECT * FROM comment WHERE episode_idx = ?";
//     const getCommentsResult = await db.queryParam_Parse(getCommentsQuery, [creatorIdx]);

//     if (!getCommentsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
//     }
// });

// //18. 누적 조회수별 조회 (전체)
// router.get('/creators/view/all', async(req, res) => {
//     const {creatorIdx} = req.params;


//쿼리작성 참고
// Select DATEPART(yy, order_dt), count(order_no) From 주문테이블
// group by DATEPART(yy, order_dt)
// order by DATEPART(yy, order_dt) 


//     const getCommentsQuery = "SELECT * FROM comment WHERE episode_idx = ?";
//     const getCommentsResult = await db.queryParam_Parse(getCommentsQuery, [creatorIdx]);

//     if (!getCommentsResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.COMMENT_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getCommentsResult));
//     }
// });


module.exports = router;
