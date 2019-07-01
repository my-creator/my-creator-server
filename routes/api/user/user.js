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
/*

//회원정보 조회 미들웨어 사용
router.get('/:idx', authUtil.isLoggedin, (req, res) => {
    //isloggedin->checktoken -> jwt verify -> 
   //if문 로그인했는지
    const id = req.params.idx;
    const getMembershipByIdQuery = 'select id,passwd,name,nickname,sex,birth from user where id = ?';
    const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [id]);

   //res로 넘어가는건지 확인
    if(!getMembershipResult){
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USERINFO_SELECT_SUCCESS,getUserInfoResult));
    }else{
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USERINFO_SELECT_FAIL,getUserInfoResult));=======
const upload = require('../../../config/multer');
const defaultRes = require('../../../module/utils/utils');
const statusCode = require('../../../module/utils/statusCode');
const resMessage = require('../../../module/utils/responseMessage');
const db = require('../../../module/utils/pool');
const authUtil = require('../../../module/utils/authUtils');

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

*/

//회원 정보 조회(진행 중)
router.get('/:useridx', async (req, res) => {
const passwd = req.body.passwd;
 const idx = req.params.userIdx;

    if (!idx ) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipByIdQuery = 'SELECT * FROM user WHERE idx = ?';
    const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [idx]);

    if (!getMembershipByIdResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_SELECT_FAIL));
    } else if (getMembershipByIdResult.length === 0) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
    } else { //쿼리문이 성공했을 때

        const firstMembershipByIdResult=getMembershipByIdResult;


        console.log(getMembershipByIdResult);
        
        
        console.log(firstMembershipByIdResult);

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

                const getUserInfoQuery = 'select id,passwd,name,nickname,sex,birth FROM user WHERE idx = ?';
                const getUserInfoResult = await db.queryParam_Parse(getUserInfoQuery,[idx]);

                //query 에러
                if(!getUserInfoResult){
                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
                }else if(getUserInfoResult === 0){
                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USERINFO_SELECT_FAIL));
                }else{//쿼리문 성공시
                    res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USERINFO_SELECT_SUCCESS,getUserInfoResult));
                }


                
            }
        });
    }
});



//회원정보 수정 미들웨어 사용
router.post('/', authUtil.isLoggedin,  (req, res) => {
    
    const {id,name,nickname,sex,birth} = req.body;


    // body나 params 없으면 에러 응답
    if(!id || (!name && !nickname && !sex && !birth)){
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }
    
    let putUserQuery = "UPDATE user SET ";
    if(name) putUserQuery+= ` name = '${name}',`;
    if(nickname) putUserQuery+= ` nickname = '${nickname}',`;
    if(sex) putUserQuery+= ` sex = '${sex}',`;
    if(birth) putUserQuery+= ` birth = '${birth}',`;


    putUserQuery = putUserQuery.slice(0, putUserQuery.length-1);
    
    putUserQuery += " WHERE id = ?";
    
    

    db.queryParam_Parse(putUserQuery, id, function(result){


        if (!result) {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_UPDATE_ERROR));
        } else {
            if(result.length  === 0){
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_UPDATE_NOTHING));
            }else{
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_UPDATE_SUCCESS));
            }
        }
    });
});



// 회원 탈퇴(진행 중) -isLoggedin안에있는 userid를 불러오는지/ 직접 idx를 body나 params에 불러오는지
router.delete('/', authUtil.isLoggedin,  async(req, res) => {
    
    
    const deleteUserQuery = "DELETE FROM user WHERE id = ?";
    const deleteUserResult = await db.queryParam_Parse(deleteUserQuery, [id]);

    if (!deleteUserResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.USER_DELETE_ERROR));
    } else {
        if(deleteUserResult.affectedRows > 0){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USER_DELETE_SUCCESS));
        }else{
            res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.USER_DELETE_NOTHING));
        }
    }
});




//로그인
router.post('/signin', async (req, res) => {

 const {id, passwd} = req.body;

    if (!id || !passwd) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipByIdQuery = 'SELECT * FROM user WHERE id LIKE ?';
    const getMembershipByIdResult = await db.queryParam_Parse(getMembershipByIdQuery, [id]);

    if (!getMembershipByIdResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_SELECT_FAIL));
    } else if (getMembershipByIdResult.length === 0) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SIGN_IN_FAIL));
    } else { //쿼리문이 성공했을 때
        
        const firstMembershipByIdResult=JSON.parse(JSON.stringify(getMembershipByIdResult[0]));

        encrypt.getHashedPassword(passwd, firstMembershipByIdResult[0].salt, res, async (hashedPassword) => {
            
            if (firstMembershipByIdResult[0].passwd !== hashedPassword) {
                // 비밀번호가 틀렸을 경우
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SIGN_IN_FAIL));
            } else { 
                // 로그인 정보가 일치할 때
                // password, salt 제거
                delete firstMembershipByIdResult.passwd;
                delete firstMembershipByIdResult.salt;

                // 토큰 발급
                const jwtToken = jwtUtil.sign(firstMembershipByIdResult);
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATE_TOKEN, { "token" : jwtToken}));
            }
        });
    }
});

//회원가입 id passwd name nickname sex birth
router.post('/signup', async (req, res) => {
    const {id,passwd,name,nickname,sex,birth} = req.body;


    if (!id || !passwd || !name) {
        res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    const getMembershipQuery = "SELECT * FROM user WHERE id = ?";
    const getMembershipResult = await db.queryParam_Parse(getMembershipQuery, [id]);


    if(!getMembershipResult){//insert 실패
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
    } else if (getMembershipResult[0].length > 0) { //Id 존재 
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_DUPLICATE));
    } else {
        
        encrypt.getSalt(res, async (salt) => {
            encrypt.getHashedPassword(passwd, salt, res, async (hashedPassword) => {        

                const insertMembershipQuery = "INSERT INTO user (id,name,nickname,sex,birth, passwd,salt) VALUES (?, ?, ?, ?,?,?,?)";
                const insertMembershipResult = await db.queryParam_Parse(insertMembershipQuery, [id,name,nickname,sex,birth,hashedPassword,salt]);



                if (!insertMembershipResult) {
                    res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.MEMBERSHIP_INSERT_FAIL));
                } else { //쿼리문이 성공했을 때
                    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.MEMBERSHIP_INSERT_SUCCESS));
                }
            });
        });
    }

});



module.exports = router;
