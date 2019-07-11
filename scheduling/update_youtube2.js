const cron = require('node-cron');
const request = require('request');
const db = require('../module/utils/pool');
const youtube_config = require('../config/youtube_config');

const baseUrl = youtube_config.BASE_URL;
const apiKey = youtube_config.API_KEY;


// 이제 하루 지났으니 '오늘 랭크'는 '어제 랭크'로~
// 어제 랭크 <- 오늘 랭크
cron.schedule('0 0 0 * * *', () => {
const updateLastQuery = `UPDATE creator_rank SET last_category_view_rank = current_category_view_rank
                                                    , last_all_view_rank = current_all_view_rank
                                                    , last_category_subs_rank = current_category_subs_rank
                                                    , last_all_subs_rank = current_all_subs_rank
                                                    , last_day_all_subs_rank = cur_day_all_subs_rank 
                                                    , last_day_all_view_rank = cur_day_all_view_rank  
                                                    , last_day_category_subs_rank = cur_day_category_subs_rank 
                                                    , last_day_category_view_rank = cur_day_category_view_rank;`
const updateLastResult = db.queryParam_None(updateLastQuery)
    .then(result => {
        console.log('then');
        console.log(result);
    })
    .catch(err => {
        console.log(err);
    });
});

cron.schedule('0 0 0 * * *', () => {
    const selectCreatorQuery = "SELECT idx, name, channel_id FROM creator";
    const selectCreatorsResult = db.queryParam_None(selectCreatorQuery)
        .then(result => {
            return result[0];
        })
        .then(rows => {
            rows.forEach(row => {
                // console.log(row);
                const query = `part=snippet,statistics&id=${row.channel_id}&key=${apiKey}`;
                const requestUrl = baseUrl + query;
                httpGet(row.idx, requestUrl);
            });
        })
        .catch(err => {
            console.log(err);
        });
})

function httpGet(idx, url) {
        request(url, {
            json: true
        }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
            if (body.items[0]) {
                const { snippet, statistics } = body.items[0];

                update(snippet, statistics, idx);
            }
        });
    }

function update(snippet, statistics, idx) {
        const { title, description, publishedAt, thumbnails } = snippet;
        const { viewCount, subscriberCount, videoCount } = statistics;
        const thumbnail = thumbnails.medium.url;
        const createTime = publishedAt.replace('Z', '');
        const params = [title, description, createTime, viewCount, subscriberCount, viewCount, subscriberCount, idx];

        //today_youtube_view_cnt , today_youtube_subscriber_cnt
        const updateCreatorQuery = "UPDATE creator SET name=?, contents=?, create_time=?, today_youtube_view_cnt=?, today_youtube_subscriber_cnt=?,\
                view_grade_idx = (SELECT idx FROM view_grade vg WHERE vg.view_cnt <= ? ORDER BY idx DESC LIMIT 1),\
                follower_grade_idx = (SELECT idx FROM follower_grade fg WHERE fg.follower_cnt <= ? ORDER BY idx DESC LIMIT 1)\
                WHERE idx=?";
        const updateCreatorsResult = db.queryParam_Parse(updateCreatorQuery, params)
            .then(result => {
                console.log('then');
                console.log(result);
            })
            .catch(err => {
                console.log(err);
            });
    }