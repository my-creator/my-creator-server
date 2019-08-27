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


//마이페이지 조회 ok 
router.get('/mypage/:userIdx',  authUtil.isLoggedin,  async (req, res) => {
    const { userIdx } = req.params;
    const getMypageQuery = 'SELECT nickname, profile_url FROM user WHERE idx = ?';
    const getMypageResult = await db.queryParam_Parse(getMypageQuery, [userIdx]);

    if (!getMypageResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_MYPAGE_SELECT_FAIL));
    } else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_MYPAGE_SELECT_SUCCESS, getMypageResult[0]));
    }
});

// //내가 쓴 글 조회
// router.get('/posts/:userIdx', /* authUtil.isLoggedin, */ async(req, res)=>{
//     const {userIdx} = req.params;
//     const getMyPostsQuery = 'SELECT FROM user WHERE idx = ?';
//     const Result = await db.queryParam_Parse(Query, [userIdx]);

//     if(!Result){
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage));
//     }else{
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage , Result[0]));
//     }
// });


// //내가 쓴 댓글 조회
// router.get('/replies/:userIdx', /* authUtil.isLoggedin, */ async(req, res)=>{
//     const {userIdx} = req.params;
//     const getMyReqliesQuery = '';
//     const Result = await db.queryParam_Parse(Query, [userIdx]);

//     if(!Result){
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage));
//     }else{
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage , Result[0]));
//     }
// });

//프로필 이미지 수정 ok
router.put('/profile/:userIdx',  authUtil.isLoggedin,  upload.single('img'), async (req, res) => {
    const { userIdx } = req.params;

    const profileUrl = req.file.location;

    let updateProfileQuery = "UPDATE user SET ";
    if (req.file) updateProfileQuery += ` profile_url = '${profileUrl}'`;
    updateProfileQuery += " WHERE idx = ? ";

    db.queryParam_Parse(updateProfileQuery, [userIdx], function (updateProfileResult) {
        if (!updateProfileResult) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_PROFILE_UPDATE_ERROR));
        } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_PROFILE_UPDATE_SUCCESS));
        }
    });
});

//닉네임 수정 && 중복 check ok
router.put('/nickname/:userIdx',  authUtil.isLoggedin,  async (req, res) => {
    const { userIdx } = req.params;
    const { nickname } = req.body;

    const getNicknameQuery = "SELECT nickname FROM user WHERE nickname = ?";
    const getNicknameResult = await db.queryParam_Parse(getNicknameQuery, [nickname]);

    if (!getNicknameResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_MYPAGE_SELECT_ERROR));
    }
    else if (getNicknameResult[0].length > 0) {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_NiCKNAME_DUPLICATE));
    }
    else {
        const updateNicknameQuery = "UPDATE user SET nickname = ? WHERE idx = ?"

        db.queryParam_Parse(updateNicknameQuery, [nickname, userIdx], function (updateNicknameResult) {
            if (!updateNicknameResult) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_NICKNAME_UPDATE_ERROR));
            } else {
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_NICKNAME_UPDATE_SUCCESS));
            }
        });
    }
});




//회원정보 조회 미들웨어 사용
// router.get('/:idx', authUtil.isLoggedin, (req, res) => {
//     //isloggedin->checktoken -> jwt verify -> 
//    //if문 로그인했는지
//     const id = req.params.idx;
//     const getMembershipByIdQuery = 'select id,passwd,name,nickname,sex,birth from user where id = ?';
//     const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [id]);

//    //res로 넘어가는건지 확인
//     if(!getMembershipResult){
//         res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USERINFO_SELECT_SUCCESS,getUserInfoResult));
//     }else{
//         res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USERINFO_SELECT_FAIL,getUserInfoResult));=======
//     }
// });

// // 메인화면 베너 이미지 조회
// router.get('/', async(req, res) => {
//     const getBannersQuery = "SELECT * FROM banner";
//     const getBannersResult = await db.queryParam_None(getBannersQuery);

//     if (!getBannersResult) {
//         res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.BANNER_SELECT_ERROR));
//     } else {
//         res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.BANNER_SELECT_SUCCESS, getBannersResult));

//     }

// });


//authUtil.isLoggedin 추가해야됨!
//회원 정보 조회 okdk
router.get('/:userIdx', async (req, res) => {
    const passwd = req.body.passwd;
    const idx = req.params.userIdx;

    if (!idx) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipByIdQuery = 'SELECT * FROM user WHERE idx = ?';
    const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [idx]);

    if (!getMembershipByIdResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_SELECT_FAIL));
    } else if (getMembershipByIdResult.length === 0) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
    } else { //쿼리문이 성공했을 때

        const firstMembershipByIdResult = JSON.parse(JSON.stringify(getMembershipByIdResult[0]));

        encrypt.getHashedPassword(passwd, firstMembershipByIdResult[0].salt, res, async (hashedPassword) => {
            if (firstMembershipByIdResult[0].passwd !== hashedPassword) {
                // 비밀번호가 틀렸을 경우
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
            } else {
                // 로그인 정보가 일치할 때
                // password, salt 제거
                delete firstMembershipByIdResult[0].passwd;
                delete firstMembershipByIdResult[0].salt;
                //로그인 정보 일치할때 정보 가져오기 

                const getUserInfoQuery = 'select id,passwd,name,nickname,gender,birth,profile_url FROM user WHERE idx = ?';
                const getUserInfoResult = await db.queryParam_Parse(getUserInfoQuery, [idx]);


                //query 에러
                if (!getUserInfoResult) {

                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
                } else if (getUserInfoResult === 0) {

                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
                } else {//쿼리문 성공시

                    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USERINFO_SELECT_SUCCESS, getUserInfoResult[0]));
                }



            }
        });
    }
});



//회원정보 수정 okdk
//id,pw 중복 확인!!!!!!!!!!!!!!!!!!!!!!!!!!!
//유저가 쓴 게시글 모음?
router.post('/', authUtil.isLoggedin, (req, res) => {

    const { name, nickname, gender, birth, profile_url } = req.body;
    const idx = req.decoded.user_idx;

    // body나 params 없으면 에러 응답
    if (!idx || (!name && !nickname && !gender && !birth && !profile_url)) {
        res.status(400).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    let putUserQuery = "UPDATE user SET ";
    if (name) putUserQuery += ` name = '${name}',`;
    if (nickname) putUserQuery += ` nickname = '${nickname}',`;
    if (gender) putUserQuery += ` gender = '${gender}',`;
    if (birth) putUserQuery += ` birth = '${birth}',`;
    if (profile_url) putUserQuery += ` profile_url = '${profile_url}',`;


    putUserQuery = putUserQuery.slice(0, putUserQuery.length - 1);

    putUserQuery += " WHERE idx = ?";

    db.queryParam_Parse(putUserQuery, idx, function (result) {
        if (!result) {
            res.status(400).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_UPDATE_ERROR));
        } else {
            if (result.length === 0) {
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_UPDATE_NOTHING));
            } else {
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_UPDATE_SUCCESS));
            }
        }
    });
});



// 회원 탈퇴 OKDK
router.delete('/', authUtil.isLoggedin, async (req, res) => {
    const idx = req.decoded.user_idx;

    const deleteUserQuery = "DELETE FROM user WHERE idx = ?";
    const deleteUserResult = await db.queryParam_Parse(deleteUserQuery, [idx]);

    if (!deleteUserResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_DELETE_ERROR));
    } else {
        if (deleteUserResult.length === 0) {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_DELETE_NOTHING));
        } else {
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_DELETE_SUCCESS));
        }
    }
});

module.exports = router;
