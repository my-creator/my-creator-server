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
router.post('/', authUtil.isAdmin, upload.single('img'),  (req, res) => {
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


//2. 크리에이터 수정  ok
router.put('/:creatorIdx', authUtil.isAdmin,  upload.single('img'), (req, res) => {
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
router.delete('/:creatorIdx', authUtil.isAdmin, async(req, res) => {
    const {creatorIdx} = req.params;

    const deleteCreatorQuery = "DELETE FROM creator WHERE idx = ?";
    const deleteCreatorResult = await db.queryParam_Parse(deleteCreatorQuery, [creatorIdx]);

    if (!deleteCreatorResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_DELETE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_DELETE_SUCCESS));
    }
});

//4. 크리에이터 프로필 조회
//크리에이터명 프로필사진 크리에이터설명 카테고리(먹방2위)  즐겨찾는유저(팬게시판 좋아요) 구독자 누적조회수 
//랭크 등급, 업적등급
//팬게시판 여부
//랭킹 경험치, 업적 경험치(마스터일땐 경험치 없다)
//랭킹 이미지,업적 이미지!!!! 등급 이미지!!!!!!!!!!!
//순위
//카테고리 먹방 2위!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
router.get('/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorPrifileQuery = `SELECT c.*,h.name AS 'category', bc.creator_idx AS 'is_board' 
    FROM (( (creator c INNER JOIN creator_category cc ON c.idx = cc.creator_idx) 
    INNER JOIN hashtag h ON h.idx = cc.hashtag_idx)
    INNER JOIN board_creator bc ON bc.creator_idx = c.idx) WHERE c.idx = ?`;
    const getCreatorPrifileResult = await db.queryParam_Parse(getCreatorPrifileQuery, [creatorIdx]);

    if (!getCreatorPrifileResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, getCreatorPrifileResult));
    }
});


//4. 크리에이터 대표 영상 조회     -----> test해야함
//view_cnt 기준으로 정렬 DESC
router.get('/:creatorIdx/popularvideo', async (req, res) => {
    const { creatorIdx } = req.params;

    const getPopularVideoQuery = "SELECT * FROM video WHERE creator_idx = ? ORDER BY view_cnt DESC";
    const getPopularVideoResult = await db.queryParam_Parse(getPopularVideoQuery, [creatorIdx]);

    if (!getPopularVideoResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_POPULARVIDEO_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_POPULARVIDEO_SELECT_SUCCESS, getPopularVideoResult));
    }
});

//5. 크리에이터 최신 영상 조회      -----> test해야함
//create_time기준으로 정렬 DESC
router.get('/:creatorIdx/newvideo', async (req, res) => {
    const { creatorIdx } = req.params;

    const getPopularVideoQuery = "SELECT * FROM video WHERE creator_idx = ? ORDER BY create_time DESC";
    const getPopularVideoResult = await db.queryParam_Parse(getPopularVideoQuery, [creatorIdx]);

    if (!getPopularVideoResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_NEWVIDEO_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_NEWVIDEO_SELECT_SUCCESS, getPopularVideoResult));
    }
});

//크리에이터 프로필의 스탯조회
//토탈 3.6점해야함!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//192명 참여
//스탯5개

router.get('/stat/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorPrifileQuery = `SELECT cs.idx,cs.creator_idx,
    COUNT(cs.user_idx) AS'stat_vote_cnt',AVG(cs.stat1) AS'stat1',AVG(cs.stat2)AS'stat2',AVG(cs.stat3)AS'stat3',
    AVG(cs.stat4)AS'stat4',AVG(cs.stat5)AS'stat5'
    FROM creator_stat cs WHERE cs.creator_idx = `;
    const getCreatorPrifileResult = await db.queryParam_Parse(getCreatorPrifileQuery, [creatorIdx]);

    if (!getCreatorPrifileResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, getCreatorPrifileResult));
    }
});


//크리에이터 프로필의 스탯 등록(능력평점 참여)
//5개 중 하나라도 미입력시 미입력나오게!!!!!!
//크리에이터 설명 해시태그 #먹방 #대식가는 나중에
//크리에이터 프로필의 스탯 등록 (해쉬태그 등록)
//해쉬태그 설명!!!!!!!!!!! 단어 하나!!!!!!!!!!!!!!!!!!!!!!

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


//참고 구독자수별 차트 조회 ok
router.get('/famous', async (req, res) => {
    const getFollowerQuery = "SELECT idx FROM creator ORDER BY follower_cnt DESC";
    const getFollowerResult = await db.queryParam_Parse(getFollowerQuery);

    if (!getFollowerResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FOLLOWER_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.FOLLOWER_SELECT_SUCCESS, getFollowerResult));
    }
});

//6. 카테고리별 크리에이터 구독자수 랭킹
// 1. 카테고리  구분
// 2.그거에 해당하는 구독자수

router.get('/category/view/rank', async (req, res) => {
    const { category } = req.query;

    const getCategoryIdxQuery = `SELECT idx FROM hashtag WHERE name = ${category}`;
    const getCategoryIdxResult = await db.queryParam_None(getCategoryIdxQuery);

    const GetCategoryIdx = getCategoryIdxResult[0].name;

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

//8. 특정 크리에이터 구독자수 조회 ok  ==> 우선 보류
// router.get('/followers/:creatorIdx', async (req, res) => {
//     const { creatorIdx } = req.params;

//     const getCreatorFollowerQuery = "SELECT follower_cnt FROM creator WHERE idx = ?";
//     const getCreatorFollowerResult = await db.queryParam_Parse(getCreatorFollowerQuery, [creatorIdx]);

//     if (!getCreatorFollowerResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_FOLLOWER_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_FOLLOWER_SELECT_SUCCESS, getCreatorFollowerResult));
//     }
// });

//9. 크리에이터 검색 ok
router.get('/search', async (req, res) => {
    const { name } = req.query;

    const getCreatorSearchQuery = "SELECT * FROM creator WHERE name = ?";
    const getCreatorSearchResult = await db.queryParam_Parse(getCreatorSearchQuery, [name]);

// const getCreatorSearchQuery = "SELECT * FROM creator WHERE name LIKE %${name}%";
// const getCreatorSearchResult = await db.queryParam_Parse(getCreatorSearchQuery);

    if (!getCreatorSearchResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_LIST_BY_NAME_SELECT_ERROR));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_LIST_BY_NAME_SELECT_SUCCESS, getCreatorSearchResult));
    }
});


//10. 해시태그별 크리에이터 목록 조회  ok  => 보류.....ㅠㅠㅠㅠㅠㅠㅠ
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


// //11. 카테고리별 크리에이터 목록 조회 ok => 보류.....ㅠㅠㅠㅠㅠㅠㅠ
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
router.post('/:creatorIdx/hashtag', authUtil.isAdmin, async (req, res) => {
    const { creatorIdx } = req.params;
    const { hashtag } = req.body;

    const getCreatorHashtagQuery = "SELECT name FROM hashtag WHERE name = ? ";
    const getCreatorHashtagResult = await db.queryParam_Parse(getCreatorHashtagQuery, hashtag);
    if (!getCreatorHashtagResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.HASHTAG_SELECT_ERROR));
    } else {
        const postCreatorHashtagQuery = "INSERT INTO creator_hashtag (creator_idx, hashtag_idx) VALUES(?, ?)";
        const postCreatorHashtagResult = db.queryParam_Parse(postCreatorHashtagQuery, [creatorIdx, hashtagIdx], function (result) {
            if (!result) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_HASHTAG_INSERT_ERROR));
            } else {
                res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_HASHTAG_INSERT_SUCCESS));
            }
        });
    }
});

// //13. 크리에이터 해시태그 삭제 -> test해야함
router.delete('/:creatorIdx/hashtag/:hashtagIdx', authUtil.isAdmin, async (req, res) => {
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
router.post('/:creatorIdx/category/:categoryIdx', authUtil.isAdmin, (req, res) => {
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
router.delete('/:creatorIdx/category/:categoryIdx', authUtil.isAdmin, async(req, res) => {
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

