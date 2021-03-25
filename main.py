
from http.server import HTTPServer, BaseHTTPRequestHandler
import traceback
import json
import win32gui
import win32process
import os
import re
import base64
import requests

def getport():
    handle = win32gui.FindWindow('WTWindow', 'M3U8批量下载器【by:逍遥一仙】  V1.4.7')
    if handle:
        tid, pid = win32process.GetWindowThreadProcessId(handle)
        for each in os.popen('netstat -ano | findstr ' + str(pid)).read().split('\n'):
            if 'LISTENING' in each:
                port = re.findall('(?<=:)\d+', each)[0]
                return port
    else:
        print('M3U8批量下载器程序版本过低（1.4.7以下），或者程序未打开')
        return ''

port = getport()

class Resquest(BaseHTTPRequestHandler):
    def do_POST(self):
        response = self.rfile.read(int(self.headers['content-length']))
        response = json.loads(response)
        title = response['title']
        print('捕获标题：'+title)
        if 'm3u8text' in response.keys():
            data = json.dumps({
                'data': response['m3u8text']
            })
            postdata = title + ',base64:' + base64.b64encode(data.encode('GBK')).decode()
            posttocute(postdata, port)
        else:
            postdata = title + ',' + response['m3u8url']
            posttocute(postdata, port)

def posttocute(postdata, port):
    url = 'http://127.0.0.1:' + str(port) + '/'
    data = {
        "data": base64.b64encode(postdata.encode('GBK')).decode()
    }
    try:
        response = requests.post(url, data=data).json()
        if response['message'] == 'success':
            print('推送成功')
        else:
            print('推送失败')
            print(response)
    except:
        print('推送失败')

def main():
    if port:
        server = HTTPServer(('127.0.0.1', 7809), Resquest)
        print("Starting http server listen at 127.0.0.1:7809")
        server.serve_forever()
    else:
        input()

if __name__ == '__main__':
    try:
        main()
    except:
        input(traceback.format_exc())