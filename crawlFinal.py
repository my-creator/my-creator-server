
from bs4 import BeautifulSoup
import csv
import requests



def new_crawl(channel_id):
    new = []
    list_url = 'https://www.youtube.com/channel/' + channel_id + '/videos?view=0&sort=dd&flow=grid'
    html_doc = requests.get(list_url).text
    soup = BeautifulSoup(html_doc,'html.parser')
    new_cnt = 0
    new_img_cnt = 0
    #print("new")
    #print(newSoup)

    '''
    <div class="yt-lockup-content">
<h3 class="yt-lockup-title"><a aria-describedby="description-id-411364" class="yt-uix-sessionlink yt-uix-tile-link spf-link yt-ui-ellipsis yt-ui-ellipsis-2" data-sessionlink="ei=4dtYXdLTEIiu4QLMr7SQCw&amp;feature=c4-videos-u" dir="ltr" href="/watch?v=DIc-jArbbIM" rel="nofollow" title="야발!!!!!!!!!! 어떤 자식이야!!!! 대.폭.망 다 접어💀｜러스트 3일차 #3">야발!!!!!!!!!! 어떤 자식이야!!!! 대.폭.망 다 접어💀｜러스트 3일차 #3</a><span class="accessible-description" id="description-id-411364"> - 길이: 29분</span></h3>
<div class="yt-lockup-meta">

    #print(soup)

    for l in soup.find_all('div',{"class":"clearfix branded-page-gutter-padding appbar-content-trigger"}):
            a = l.select('li:nth-child(2) a')
            #print("a")
            #print(a[0])
            href = a[0]['href']
            #print("href")
            #print(href)
            #https://www.youtube.com/user/d7297ut/videos
            #https://www.youtube.com/user/d7297ut/videos?view=0&sort=p&flow=grid
            #업로드한동영상 최신순 https://www.youtube.com/channel/UCeXDmNuOug_VmHY88sZkVSA/videos?view=0&sort=dd&flow=grid
            #업로드한 동영상 인기순 https://www.youtube.com/channel/UCeXDmNuOug_VmHY88sZkVSA/videos?view=0&sort=p&flow=grid
            hotVideoPath =  'https://www.youtube.com' + href+"?view=0&sort=p&flow=grid"
            break

    html_doc = requests.get(hotVideoPath).text
    hotSoup = BeautifulSoup(html_doc,'html.parser')
    print("new")
    print(newSoup)

    
    <div class="yt-lockup-content">
<h3 class="yt-lockup-title"><a aria-describedby="description-id-411364" class="yt-uix-sessionlink yt-uix-tile-link spf-link yt-ui-ellipsis yt-ui-ellipsis-2" data-sessionlink="ei=4dtYXdLTEIiu4QLMr7SQCw&amp;feature=c4-videos-u" dir="ltr" href="/watch?v=DIc-jArbbIM" rel="nofollow" title="야발!!!!!!!!!! 어떤 자식이야!!!! 대.폭.망 다 접어💀｜러스트 3일차 #3">야발!!!!!!!!!! 어떤 자식이야!!!! 대.폭.망 다 접어💀｜러스트 3일차 #3</a><span class="accessible-description" id="description-id-411364"> - 길이: 29분</span></h3>
<div class="yt-lockup-meta">



    '''

    for l in soup.find_all('div',{"class":"yt-lockup-content"}):
                newTime = ''
                newViewCnt = ''
                for t in l.select('a'):
                    try:
                            timeAndViewCnt = l.select('ul li')
                            if '전' in timeAndViewCnt[0].text:
                                newTime = timeAndViewCnt[0].text
                                newViewCnt = timeAndViewCnt[1].text.replace('조회수',"").replace('회',"").replace(',',"").replace(' ',"")
                            else:
                                newTime = timeAndViewCnt[1].text
                                newViewCnt = timeAndViewCnt[0].text.replace('조회수',"").replace('회',"").replace(',',"").replace(' ',"")

                    except (IndexError, ValueError):
                            #print("hoterr")
                        newTime = ''
                        newViewCnt = 0
                            #print("hoterr")
                            #print(hot)
                        pass

                    if 'watch' in t['href'] and new_cnt < 5:
                        newLink = "https://www.youtube.com"+t['href']
                        newTitle = t.text.replace('\n'," ")
                        
                        newtmp = [channel_id,newTitle,newLink,newTime,newViewCnt,""]
                        new.append(newtmp)
                        
                        new_cnt += 1
                    else:
                        break    

    for a in soup.find_all('div',{"class":"yt-lockup-thumbnail"}):
                 
                for tt in a.select('img'):
                    if  new_img_cnt <5 and tt is not None:
                        try:

                            #print("hotimg")
                            new_img_cnt += 1
                            #썸네일
                            if tt['src'] is None:
                                img = ''

                            else:
                                img = tt['src']
                            
                            #print("img")
                            #print(img)
                            new[new_img_cnt-1][5] = img
                        except (IndexError, ValueError):
                            #print("hotimgerr")
                            #print(hot_img_cnt-1)
                            #print(hot)
                            pass


    print("new")
    print(new)
    return new





def hot_crawl(channel_id):
    hot = []
    list_url = 'https://www.youtube.com/channel/' + channel_id + '/videos?view=0&sort=p&flow=grid'
    html_doc = requests.get(list_url).text
    soup = BeautifulSoup(html_doc,'html.parser')
    hot_cnt = 0
    hot_img_cnt = 0


    for l in soup.find_all('div',{"class":"yt-lockup-content"}):
                hotTime = ''
                hotViewCnt = ''
                for t in l.select('a'):
                    try:
                            timeAndViewCnt = l.select('ul li')
                            if '전' in timeAndViewCnt[0].text:
                                hotTime = timeAndViewCnt[0].text
                                hotViewCnt = timeAndViewCnt[1].text.replace('조회수',"").replace('회',"").replace(',',"").replace(' ',"")
                            else:
                                hotTime = timeAndViewCnt[1].text
                                hotViewCnt = timeAndViewCnt[0].text.replace('조회수',"").replace('회',"").replace(',',"").replace(' ',"")

                    except (IndexError, ValueError):
                            #print("hoterr")
                        hotTime = ''
                        hotViewCnt = 0
                            #print("hoterr")
                            #print(hot)
                        pass

                    if 'watch' in t['href'] and hot_cnt < 5:
                        hotLink = "https://www.youtube.com"+t['href']
                        hotTitle = t.text.replace('\n'," ")
                        
                        hottmp = [channel_id,hotTitle,hotLink,hotTime,hotViewCnt,""]
                        hot.append(hottmp)
                        
                        hot_cnt += 1
                    else:
                        break    

    for a in soup.find_all('div',{"class":"yt-lockup-thumbnail"}):
                 
                for tt in a.select('img'):
                    if  hot_img_cnt <5 and tt is not None:
                        try:

                            #print("hotimg")
                            hot_img_cnt += 1
                            #썸네일
                            if tt['src'] is None:
                                img = ''

                            else:
                                img = tt['src']
                            
                            #print("img")
                            #print(img)
                            hot[hot_img_cnt-1][5] = img
                        except (IndexError, ValueError):
                            #print("hotimgerr")
                            #print(hot_img_cnt-1)
                            #print(hot)
                            pass


    print("channel_id")
    print(channel_id)
    print("hot")
    print(hot)

    return hot






def crawl_final():
    with open('channelCsv.csv', 'r') as f:
        data = f.read().split(",")
#    data.replace('"',"")
  #  data.replace('[',"")
   # data.replace(']',"")

    for i in range(len(data)):
        data[i] = data[i].replace('"',"").replace("[","").replace("]","")
    
    
    print(len(data))


    with open('hotoutput.csv', 'w', encoding='utf-8', newline='') as hot_f:
        with open('newoutput.csv', 'w', encoding='utf-8', newline='') as new_f:
            wr = csv.writer(hot_f)
            wrn = csv.writer(new_f)
    
    #for k in range(len(data):
            for k in range(len(data)):
            
#                result = crawl_final(data[k])
                result_hot = hot_crawl(data[k])
                result_new = new_crawl(data[k])
                #print("result")
                #print(result)
                try:
                    for i in range(5):
                        wr.writerow(result_hot[i])
                        wrn.writerow(result_new[i])
                except (IndexError, ValueError):
                    print("resulterr")
                    #print(new_img_cnt-1)
                    print("channel_id")
                    print(data[k])
                    pass
            
   

crawl_final()
#new_crawl2('UCYooECrv-fIXlPaDwEIaveA')