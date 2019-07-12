const db = require('../module/utils/pool');

for(var i=1;i<4320;i++){
    const selectCreatorQuery = "INSERT INTO real_time_rank(creator_idx, offset, rank) SELECT idx, ?, 0 FROM creator;";
    const selectCreatorsResult = db.queryParam_Parse(selectCreatorQuery , [i]);
}

