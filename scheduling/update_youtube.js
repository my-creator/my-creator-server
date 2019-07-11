const request = require('request');
const db = require('../module/utils/pool');
const youtube_config = require('../config/youtube_config');
const cron = require('node-cron');

const baseUrl = youtube_config.BASE_URL;
const apiKey = youtube_config.API_KEY;

cron.schedule('0 0 12 * * *', async() => {
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
    .catch(err=>{
        console.log(err);
    });
});

function httpGet(idx, url) {
    request(url, {
        json: true
    }, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        if(body.items[0]){
            const {snippet, statistics} = body.items[0];

            update(snippet, statistics, idx);
        }
    });
}

function update(snippet, statistics, idx){
    const {title, description, publishedAt, thumbnails} = snippet;
    const {viewCount, subscriberCount, videoCount} = statistics;
    const thumbnail = thumbnails.medium.url;
    const createTime = publishedAt.replace('Z','');
    const params = [title, description, createTime, viewCount, subscriberCount, viewCount, subscriberCount, idx];

    //console.log(title);
    // console.log(description);
    // console.log(createTime);
    // console.log(thumbnail);
    // console.log(viewCount);
    // console.log(subscriberCount);
    // console.log(videoCount);

    
    //랭킹부분 구독자수별, 조회수별 일간핫 랭킹 구하기 위한 스케줄링 
    // yesterday = today
    // 
    // const updateYesterdayQuery = `UPDATE creator SET yesterday_youtube_subscriber_cnt=?, yesterday_youtube_view_cnt=?`
    // const todayData = [subscriberCount, viewCount];
    // const updateCreatorsResult = db.queryParam_Parse(updateYesterdayQuery, todayData)
    //     .then(result => {
    //         console.log('then');
    //         console.log(result);
    //     })
    //     .catch(err => {
    //         console.log(err);
    //     });


    //today_youtube_view_cnt , today_youtube_subscriber_cnt
    const updateCreatorQuery = "UPDATE creator SET name=?, contents=?, create_time=?, youtube_view_cnt=?, youtube_subscriber_cnt=?,\
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