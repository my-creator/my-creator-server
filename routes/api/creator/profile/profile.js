var express = require('express');
var router = express.Router();

const upload = require('../../../../config/multer');
const defaultRes = require('../../../../module/utils/utils');
const statusCode = require('../../../../module/utils/statusCode');
const resMessage = require('../../../../module/utils/responseMessage');
const db = require('../../../../module/utils/pool');
const authUtil = require('../../../../module/utils/authUtils');
const moment = require('moment');
const jwtUtil = require('../../../../module/utils/jwt');




//4. 크리에이터 프로필 조회 okdk
//크리에이터명 프로필사진 크리에이터설명 카테고리(먹방2위)  즐겨찾는유저(팬게시판 좋아요) 구독자 누적조회수 
//랭크 등급, 업적등급
//팬게시판 여부
//랭킹 경험치, 업적 경험치(마스터일땐 경험치 없다)
//랭킹 이미지,업적 이미지! 등급 이미지!!
//순위
//카테고리 먹방 2위!!

//search_time
router.get('/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;


    const getCreatorProfileQuery = `SELECT c.idx AS 'creator_idx',c.view_grade_idx,c.follower_grade_idx,c.profile_url,c.name AS'creator_name',c.youtube_subscriber_cnt,
c.youtube_view_cnt,c.follower_cnt,c.contents,c.channel_id,date_format(c.create_time,'%Y-%m-%d %h:%i') AS 'creator_create_time',
ca.name AS 'category_name',ca.idx AS 'category_idx', 
vg.name AS 'view_grade_name',vg.img_url AS 'view_grade_img_url',vg.view_cnt AS 'view_grade_view_cnt',
fg.name AS 'follower_grade_name',fg.level AS 'follower_grade_level',fg.img_url AS 'follower_grade_img_url',fg.follower_cnt AS 'follower_grade_follower_cnt',
b.idx AS 'board_idx' ,b.name AS 'board_name',b.type AS 'board_type'
    FROM creator c 
    INNER JOIN view_grade vg ON vg.idx = c.view_grade_idx 
    INNER JOIN follower_grade fg ON fg.idx = c.follower_grade_idx 
    INNER JOIN creator_category cc ON cc.creator_idx = c.idx 
    INNER JOIN category ca ON ca.idx = cc.category_idx 
    INNER JOIN board b ON b.creator_idx = c.idx
    WHERE c.idx = ?`;
    const getCreatorProfileResult = await db.queryParam_Parse(getCreatorProfileQuery, [creatorIdx]);

//    console.log(getCreatorProfileResult);
//    const result = getCreatorProfileResult[0];
    const result = JSON.parse(JSON.stringify(getCreatorProfileResult[0][0]));
    //console.log("Resutl");
//    console.log(result);

    const category_json = JSON.parse(JSON.stringify(getCreatorProfileResult));
    const categoryIdx = category_json[0][0].category_idx;
    const youtube_subscriber_cnt = category_json[0][0].youtube_subscriber_cnt;
    const follower_cnt = category_json[0][0].follower_grade_follower_cnt;
    const follower_grade_idx = category_json[0][0].follower_grade_idx;
    const follower_grade_level = category_json[0][0].follower_grade_level;
    const follower_grade_name = category_json[0][0].follower_grade_name;

    const youtube_view_cnt = category_json[0][0].youtube_view_cnt;
    const view_grade_name = category_json[0][0].view_grade_name;



    let flev = 0;
    if (!result) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    } else {
//        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, getCreatorPrifileResult));
        

        switch (follower_grade_name){
        case  "브론즈":
        flev = (youtube_subscriber_cnt - follower_cnt)/200*100;
            result["back_lank_exp"] = follower_cnt+99;
            break;
        case "실버" :
            result["back_lank_exp"] = follower_cnt+999;
            flev = (youtube_subscriber_cnt - follower_cnt)/2000*100;
            break;
        case "골드":
        flev = (youtube_subscriber_cnt - follower_cnt)/20000*100;
            result["back_lank_exp"] = follower_cnt+9999;
            break;
        case "플래티넘":
            result["back_lank_exp"] = follower_cnt+99999;
            flev = (youtube_subscriber_cnt - follower_cnt)/200000*100;
            break;
        case "다이아" :
            result["back_lank_exp"] = follower_cnt+999999;
             flev = (youtube_subscriber_cnt - follower_cnt)/2000000*100;
            break;
        default:
            flev = 0;
            result["back_lank_exp"] = 0;
        
    }


    let flex = 0;
    switch (view_grade_name){
        case  "F":
            flex = youtube_view_cnt/100000*100;
            result["back_lank2_exp"] = 100000;
            break;
        case "D" :
            flex = youtube_view_cnt/9000000*100;
            result["back_lank2_exp"] = 1000000;
            break;
        case "C":
            flex = youtube_view_cnt/90000000*100;
            result["back_lank2_exp"] = 10000000;
            break;
        case "A":
            flex = youtube_view_cnt/900000000*100;
            result["back_lank2_exp"] = 100000000;
            break;
        default :
            flev = 0;
            result["back_lank2_exp"] = 0;
           
    }



            //1등급이면 *2
            if(follower_grade_level  === 1){
                flev = flev*2;
            }

            //flev /= 10000;
            console.log("flev");
            console.log(flev);
            result["front_lank_exp"]=youtube_subscriber_cnt;
            result["front_lank2_exp"]=youtube_view_cnt;
            result["follower_grade_percent"]= parseInt(flev);
            
            result["view_grade_percent"]=parseInt(flex);
  //특정 카테고리별 크리에이터들 리스트
    const getCreatorsQuery=`SELECT cc.creator_idx ,c.*
    FROM creator_category cc 
    INNER JOIN creator c ON c.idx = cc.creator_idx 
    WHERE cc.category_idx = ?
    ORDER BY c.youtube_subscriber_cnt DESC`;

/*
#순위리스트
SELECT cc.creator_idx ,c.*
    FROM creator_category cc 
    INNER JOIN creator c ON c.idx = cc.creator_idx 
    WHERE cc.category_idx = 5
    ORDER BY c.youtube_subscriber_cnt DESC;
    */

    const getCreatorsResult = await db.queryParam_Parse(getCreatorsQuery,categoryIdx);
    const creators_json = JSON.parse(JSON.stringify(getCreatorsResult));


    if(!getCreatorsResult){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    }else{

    let cnt = 0;
   let cre = '';
        getCreatorsResult[0].forEach((creator)=>{
            cre = JSON.parse(JSON.stringify(creator));
            cree = cre.creator_idx;
            cnt += 1;
            if(creator.creator_idx == creatorIdx){
                const ans = cnt;//2
                result["category_lank"]= ans;


            }
        });

    const insertCreatorTimeQuery = `INSERT INTO creator_search(creator_idx,search_time ) VALUES(?,?)`; 
    const insertCreatorTimeResult = await db.queryParam_Parse(insertCreatorTimeQuery,[creatorIdx,moment().format("YYYY-MM-DD HH:mm")]);

    if(!insertCreatorTimeResult){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_PROFILE_ERROR));
    }else{
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_PROFILE_SUCCESS, result));
    }

    }
    }
});



//크리에이터 프로필의 스탯조회 okdk
/*    
SELECT cs.score,s.name
FROM creator_stat cs
INNER JOIN stat s ON s.idx = cs.stat_idx
WHERE cs.creator_idx = 1717;

*/
router.get('/stat/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;

    const getCreatorStatQuery = `SELECT AVG(cs.score) AS 'stat_score',s.name , s.idx AS 'stat_idx'
FROM creator_stat cs
INNER JOIN stat s ON s.idx = cs.stat_idx
WHERE cs.creator_idx = ?
GROUP BY cs.stat_idx`;
    const getCreatorStatResult = await db.queryParam_Parse(getCreatorStatQuery, [creatorIdx]);

    const result = JSON.parse(JSON.stringify(getCreatorStatResult[0]));



    if (!getCreatorStatResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_STAT_ERROR));
    } else {

        //avg 쿼리
        const getCreatorStatAvgQuery = `SELECT AVG(cs.score) AS 'avg_stat',
        COUNT(cs.score) AS 'join_cnt_stat'
FROM creator_stat cs
INNER JOIN stat s ON s.idx = cs.stat_idx
WHERE cs.creator_idx = ?`;

        const getCreatorStatAvgResult = await db.queryParam_Parse(getCreatorStatAvgQuery, [creatorIdx]);
        const avg_json = JSON.parse(JSON.stringify(getCreatorStatAvgResult));


    if (!getCreatorStatAvgResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_STAT_ERROR));
    } else {
        const avg = JSON.parse(JSON.stringify(getCreatorStatAvgResult[0]));
        result.push(avg[0]);
    }

        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_STAT_SUCCESS, result));
    }
});



//크리에이터 프로필의 스탯 등록창 조회 okdk
router.get('/stat/detail/:creatorIdx', async (req, res) => {
    const { creatorIdx } = req.params;
//소통 매력 실력 고막 개성
//설명
    let getStatDetailQuery  = `SELECT DISTINCT s.*
FROM creator_stat cs
INNER JOIN stat s ON s.idx = cs.stat_idx
WHERE cs.creator_idx = ?`;
    
    const getStatDetailResult = await db.queryParam_Parse(getStatDetailQuery,[creatorIdx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (!getStatDetailResult) { //쿼리문이 실패했을 때
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_STAT_DETAIL_ERROR));
    } else if(getStatDetailResult.length === 0){
        res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.CREATOR_SELECT_STAT_DETAIL_ERROR));
    }else{ //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.CREATOR_SELECT_STAT_DETAIL_SUCCESS,getStatDetailResult[0]));
    }
});


//크리에이터 프로필의 스탯 등록 okdk
router.post('/stat/detail/:creatorIdx', authUtil.isLoggedin, async(req, res) => {
    
    let statIdx = [];
    let score = [];
    statIdx[0] = req.body.statIdx1;
    statIdx[1] = req.body.statIdx2;
    statIdx[2]= req.body.statIdx3;
    statIdx[3] = req.body.statIdx4;
    statIdx[4]= req.body.statIdx5;

    const creatorIdx = parseInt(req.params.creatorIdx);
    const userIdx = req.decoded.user_idx;
    
    score[0] = parseFloat(req.body.score1);
    score[1] = parseFloat(req.body.score2);
    score[2]= parseFloat(req.body.score3);
    score[3] = parseFloat(req.body.score4);
    score[4]= parseFloat(req.body.score5);



    if (!score[1] || !score[2] || !score[3] || !score[4] || !score[0] || !statIdx[1] || !statIdx[2] || !statIdx[3] || !statIdx[4] || !statIdx[0] || !userIdx || !creatorIdx) {
        return res.status(200).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    }

    console.log(userIdx,creatorIdx,score[1],score[2],score[3],score[4],score[0],statIdx[1],statIdx[2],statIdx[3],statIdx[4],statIdx[0]);
    
    let insertStatResult = [];
    for(var i = 0;i<5;i++){
        const insertStatQuery = "INSERT INTO creator_stat(stat_idx, creator_idx, user_idx,score) VALUES(?, ?, ?,?)";
        insertStatResult[i] = await db.queryParam_Parse(insertStatQuery, [statIdx[i],creatorIdx,userIdx,score[i]]);
        };


    if (!insertStatResult[0] ||!insertStatResult[1] || !insertStatResult[2] || !insertStatResult[3] || !insertStatResult[4]) {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.STAT_INSERT_ERROR));
        } else {
                res.status(201).send(defaultRes.successTrue(statusCode.OK, resMessage.STAT_INSERT_SUCCESS));
    }
    });


    







//해쉬태그 등록 okdk
router.post('/stat/hashtag/:creatorIdx', authUtil.isLoggedin, async(req, res) => {
    

    const creatorIdx = parseInt(req.params.creatorIdx);
    const userIdx = req.decoded.user_idx;
    const hashtagName = req.body.hashtagName;
    //해쉬태그 있는지
    const gethashtagQuery = "SELECT idx FROM hashtag WHERE name = ?";
    const gethashtagResult = await db.queryParam_Parse(gethashtagQuery, [hashtagName]);

    
    if(gethashtagResult[0][0]){
        let hashtagIdx_json = JSON.parse(JSON.stringify(gethashtagResult));
        hashtagIdx = hashtagIdx_json[0][0].idx || null;
    }else{
        hashtagIdx = null;
    }
        

     if(!hashtagIdx || !gethashtagResult[0][0]){//해쉬태그 없는 경우 //해쉬 태그 

        const insertHashtagQuery = "INSERT INTO hashtag(name) VALUES(?)";
        const insertHashtagResult = await db.queryParam_Parse(insertHashtagQuery,[hashtagName]);

        if(insertHashtagResult[0].insertId < 1)
        {
            res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.STAT_HASHTAG_INSERT_ERROR));
        }
        else{
            const insertCreatorHashtagQuery = "INSERT INTO creator_hashtag(creator_idx, hashtag_idx) VALUES(?, ?)";
            const insertCreatorHashtagResult = await db.queryParam_Parse(insertCreatorHashtagQuery,[creatorIdx,insertHashtagResult[0].insertId]);

         
            if(!insertCreatorHashtagResult)
            {
                res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.STAT_HASHTAG_INSERT_ERROR));
            }
            else{
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.STAT_HASHTAG_INSERT_SUCCESS));
            }


        }
            
    }else{//해쉬태그 있는 경우 //creator_hashtag에만 등록
        const insertStatHashtagQuery = "INSERT INTO creator_hashtag(creator_idx, hashtag_idx) VALUES(?, ?)";
        const insertStatHashtagResult = await db.queryParam_Parse(insertStatHashtagQuery,[creatorIdx,hashtagIdx]);

        if(!insertStatHashtagResult)
        {
            return res.status(200).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.STAT_HASHTAG_INSERT_ERROR));
        }
        else{

            return res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.STAT_HASHTAG_INSERT_SUCCESS));
        }

    }
    
});





module.exports = router;