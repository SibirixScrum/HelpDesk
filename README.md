# HelpDesk

### Ћицензи€
GPL v3 http://www.gnu.org/licenses/gpl-3.0.ru.html

### ”становка
```sh
mkdir helpdesk
cd ./helpdesk
git clone https://github.com/SibirixScrum/HelpDesk.git ./
npm i
```

### Ќастройка
```sh
cd ./config
cp ./config.example.js ./config.js
mcedit ./config.js
```

### ќсновые опции
- connectString: 'mongodb://localhost/helpdesk' Ч база в mongo. Ѕудет создана при первом запуске, если еще не существует.
- exports.projects Ч настройки проектов.
- responsible: 'tester@example.com' почта администратора проекта. јккаунт создаетс€ автоматически. ѕароль отправл€етс€ на почту.
- exports.socketIo: 'SECRETKEY' Ч секретный ключ дл€ шифровани€ куков.
- exports.session.secret: 'SECRETKEY' Ч секретный ключ дл€ шифровани€ сессий.

### «апуск
```sh
node app.js
```
