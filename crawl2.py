from bs4 import BeautifulSoup
import csv
import requests

def crawl_final(channel_id):
    video_info = []
    hot = []
    new = []
    list_url = 'https://www.youtube.com/channel/' + channel_id 
    html_doc = requests.get(list_url).text
    soup = BeautifulSoup(html_doc,'html.parser')
    hot_num = 1
    new_num = 2
    hot_cnt = 0
    new_cnt = 0
    hot_img_cnt = 0
    new_img_cnt = 0
    
#    wr.writerow([1, 'mkblog'])

    for li in soup.find_all('div',{"class":"shelf-wrapper clearfix"}):
        tag = li.find(class_ = "branded-page-module-title-text")
        
        

        if tag :
            for l in li.find_all('div',{"class":"yt-lockup-content"}):
                newTime = ''
                hotTime = ''
                newViewCnt = ''
                hotViewCnt = ''
                for t in l.select('a'):

                    if hot_num == 1 and hot_cnt <5:
#                        tmp = [t['title'],t['href']]
  #                      hot.append(tmp)
                        hot_cnt += 1
                        #print("tq")
                        #print(hot_cnt)
                
                        #print("https://www.youtube.com/"+t['href'])
                        #print(t.text)

                        
                        
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

                        
                        
                        hotLink = "https://www.youtube.com/"+t['href']
                        hotTitle = t.text
                        
                        hottmp = [channel_id,hotTitle,hotLink,hotTime,hotViewCnt,""]
                        hot.append(hottmp)
                        
                        #print("hotcontent")
                        #print(hottmp)
                    
                    elif new_num == 1 and new_cnt <5:
    #                    tmp = [t['title'],t['href']]
      #                  new.append(tmp)

                        #print("t")
                        new_cnt += 1
                        #print(new_cnt)
                        #print("https://www.youtube.com/"+t['href'])#링크+하기
                        #print(t.text)#제목

                
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
                            #print("newerr")
                            #print(new)
                            pass





                        
                        newLink = "https://www.youtube.com/"+t['href']
                        newTitle = t.text
                        
                        newtmp = [channel_id,newTitle,newLink,newTime,newViewCnt,""]
                                                
                        
                        new.append(newtmp)

                        
                        
            for a in soup.find_all('div',{"class":"yt-lockup-thumbnail"}):
                 
                for tt in a.select('img'):
                    if hot_num == 1 and hot_img_cnt <5 and tt is not None:
                        try:

                            #print("hotimg")
                            hot_img_cnt += 1
                            #썸네일
                            if tt['data-thumb'] is None:
                                img = ''

                            else:
                                img = tt['data-thumb']
                            
                            #print("img")
                            #print(img)
                            hot[hot_img_cnt-1][5] = img
                        except (IndexError, ValueError):
                            #print("hotimgerr")
                            #print(hot_img_cnt-1)
                            #print(hot)
                            pass

                        
                    elif new_num == 1 and new_img_cnt <5:
                        
                        try:


                            #print("newimg")
                            new_img_cnt += 1
                            if tt['data-thumb'] is None:
                                img = ''
                            else:
                                img = tt['data-thumb']

                            #print("img")
                            #print(img)

                            new[new_img_cnt-1][5] = img#1#2
                        except (IndexError, ValueError):
                            #print("newimgerr")
                            #print(new_img_cnt-1)
                            #print(new)
                            pass

            hot_num += 1
            new_num -= 1
            
        
        else :
            break

         
    
    return new,hot




def crawl():
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
            
                result = crawl_final(data[k])

                result_hot = result[0]
                result_new = result[1]
                #print("result")
                #print(result)

                try:
                    for i in range(len(result_hot)):
                        wr.writerow(result_hot[i])
                        wrn.writerow(result_new[i])
                except (IndexError, ValueError):
                    print("resulterr")
                    #print(new_img_cnt-1)
                    print("channel_id")
                    print(data[k])
                    pass
            
   


crawl()