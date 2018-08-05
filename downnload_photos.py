import re, time
from bs4 import BeautifulSoup
from urllib.request import urlretrieve

with open ("bkgrnd_src_html.txt", "r") as htmlfile:
    data=htmlfile.readlines()

url_list = []

for line in data :
    soup = BeautifulSoup(line, 'html.parser')
    results = soup.find_all('img', class_='_2zEKz')
    for result in results :
        urls =  re.findall('src="(.*)" ', str(result))
        for url in urls:
            url_list.append(url)

bkgrnd_num = 1

for url in url_list:

    if bkgrnd_num <= 20:
        bkgrnd_num = bkgrnd_num + 1
        continue

    try:
        urlretrieve(url, filename = 'bkgrnd_'+str(bkgrnd_num)+'.jpg')
    except:
        pass

    time.sleep(20)

    print('Saved '+str(bkgrnd_num)+' of 560')

    bkgrnd_num = bkgrnd_num + 1




