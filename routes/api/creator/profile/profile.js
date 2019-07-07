
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
