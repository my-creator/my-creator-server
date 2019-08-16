const db = require('../module/utils/pool');


const updateLastAllQuery = `UPDATE creator_rank SET last_category_view_rank = current_category_view_rank
, last_category_subs_rank = current_category_subs_rank;`;
const updateLastDayHotQuery = `UPDATE creator_dayhot_rank SET last_category_subs_rank = cur_category_subs_rank
, last_category_view_rank = cur_category_view_rank;`;

const updateLastAllResult = db.queryParam_None(updateLastAllQuery)
.then(result => {
    console.log('then1');
    console.log(result);
})
.catch(err => {
    console.log(err);
});
const updateLastDayHotResult = db.queryParam_None(updateLastDayHotQuery)
.then(result => {
    console.log('then2');
    console.log(result);
})
.catch(err => {
    console.log(err);
});

// // 카테고리-일간-구독자  creator_dayhot_rank     last_category_subs_rank cur_category_subs_rank
// const selectCreatorQuery1 =
// `SELECT idx, youtube_subscriber_cnt, last_subscriber_cnt, category_idx
// FROM creator c INNER JOIN creator_category ON c.idx = creator_category.creator_idx;`;
// const selectCreatorsResult1 = db.queryParam_None(selectCreatorQuery1)
// .then(result => {
//     return result[0];
// })
// .then(rows => {
//     rows.forEach(row => {
//         let rank = 1;
//         let thisDiff = row.youtube_subscriber_cnt - row.last_subscriber_cnt;
//         rows.forEach(row2 => {
//             if (row.category_idx === row2.category_idx) {
//                 let tempDiff = row2.youtube_subscriber_cnt - row2.last_subscriber_cnt;
//                 if (tempDiff > thisDiff) {
//                     rank++;
//                 }
//             }
//         });
//         const update_query = `UPDATE creator_dayhot_rank SET cur_category_subs_rank = ${rank} WHERE creator_idx = ${row.idx}; `;
//         const updateLastResult = db.queryParam_None(update_query);
//     });
//     // console.log(update_query);
// })
// .catch(err => {
//     console.log(err);
// });


// // 카테고리-일간-조회수  creator_dayhot_rank     last_category_view_rank cur_category_view_rank
// const selectCreatorQuery2 = `SELECT idx, youtube_view_cnt, last_view_cnt, category_idx
// FROM creator c INNER JOIN creator_category ON c.idx = creator_category.creator_idx;`;
// const selectCreatorsResult2 = db.queryParam_None(selectCreatorQuery2)
// .then(result => {
//     return result[0];
// })
// .then(rows => {
//     rows.forEach(row => {
//         let rank = 1;
//         let thisDiff = row.youtube_view_cnt - row.last_view_cnt;
//         rows.forEach(row2 => {
//             if (row.category_idx === row2.category_idx) {
//                 let tempDiff = row2.youtube_view_cnt - row2.last_view_cnt;
//                 if (tempDiff > thisDiff) {
//                     rank++;
//                 }
//             }
//         });
//         const update_query = `UPDATE creator_dayhot_rank SET cur_category_view_rank = ${rank} WHERE creator_idx = ${row.idx}; `;
//         const updateLastResult = db.queryParam_None(update_query);
//     });
//     // console.log(update_query);
// })
// .catch(err => {
//     console.log(err);
// });

// // 카테고리-전체-구독자 creator_rank last_category_subs_rank current_category_subs_rank
// const selectCreatorQuery3 = `SELECT idx, youtube_subscriber_cnt, last_subscriber_cnt, category_idx
// FROM creator c INNER JOIN creator_category ON c.idx = creator_category.creator_idx;`;
// const selectCreatorsResult3 = db.queryParam_None(selectCreatorQuery3)
// .then(result => {
//     return result[0];
// })
// .then(rows => {
//     rows.forEach(row => {
//         let rank = 1;
//         let thisDiff = row.youtube_subscriber_cnt - row.last_subscriber_cnt;
//         rows.forEach(row2 => {
//             if (row.category_idx === row2.category_idx) {
//                 let tempDiff = row2.youtube_subscriber_cnt - row2.last_subscriber_cnt;
//                 if (tempDiff > thisDiff) {
//                     rank++;
//                 }
//             }
//         });
//         const update_query = `UPDATE creator_rank SET current_category_subs_rank = ${rank} WHERE creator_idx = ${row.idx}; `;
//         const updateLastResult = db.queryParam_None(update_query);
//     });
//     // console.log(update_query);
// })
// .catch(err => {
//     console.log(err);
// });


// // 카테고리-전체-조회수  creator_rank테이블 last_category_view_rank current_category_view_rank
// const selectCreatorQuery4 = `SELECT idx, youtube_view_cnt, last_view_cnt, category_idx
// FROM creator c INNER JOIN creator_category ON c.idx = creator_category.creator_idx;`;
// const selectCreatorsResult4 = db.queryParam_None(selectCreatorQuery4)
// .then(result => {
//     return result[0];
// })
// .then(rows => {
//     rows.forEach(row => {
//         let rank = 1;
//         let thisDiff = row.youtube_view_cnt - row.last_view_cnt;
//         rows.forEach(row2 => {
//             if (row.category_idx === row2.category_idx) {
//                 let tempDiff = row2.youtube_view_cnt - row2.last_view_cnt;
//                 if (tempDiff > thisDiff) {
//                     rank++;
//                 }
//             }
//         });
//         const update_query = `UPDATE creator_rank SET current_category_view_rank = ${rank} WHERE creator_idx = ${row.idx}; `;
//         const updateLastResult = db.queryParam_None(update_query);
//     });
//     // console.log(update_query);
// })
// .catch(err => {
//     console.log(err);
// });
