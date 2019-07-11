const db = require('../module/utils/pool');

const selectCreatorQuery = "SELECT idx, youtube_view_cnt FROM creator c;";
    const selectCreatorsResult = db.queryParam_None(selectCreatorQuery)
        .then(result => {
            return result[0];
        })
        .then(rows => {
            rows.forEach(row => {
                let rank = 1;
                rows.forEach(row2 => {
                    if(row2.youtube_view_cnt > row.youtube_view_cnt){
                        rank++;
                    }
                });
                const update_query = `UPDATE creator_rank SET current_all_subs_rank = ${rank} WHERE creator_idx = ${row.idx}; `;
                const updateLastResult = db.queryParam_None(update_query);
            });
        })
        .catch(err => {
            console.log(err);
        });