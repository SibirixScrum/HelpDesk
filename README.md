# HelpDesk

### Лицензия
GPL v3 http://www.gnu.org/licenses/gpl-3.0.ru.html

### Установка
```sh
mkdir helpdesk
cd ./helpdesk
git clone https://github.com/SibirixScrum/HelpDesk.git ./
npm i
```

### Настройка
```sh
cd ./config
cp ./config.example.js ./config.js
mcedit ./config.js
```

### Основые опции
- connectString: 'mongodb://localhost/helpdesk' — база в mongo. Будет создана при первом запуске, если еще не существует.
- exports.projects — настройки проектов.
- responsible: 'tester@example.com' — почта администратора проекта. Аккаунт создается автоматически. Пароль отправляется на почту.
- exports.socketIo: 'SECRETKEY' — секретный ключ для шифрования куков.
- exports.session.secret: 'SECRETKEY' — секретный ключ для шифрования сессий.
- exports.locales=['ru', 'en'] — доступные языки: английский и русский.
- en.json — английский язык.
- ru.json — русский язык.

### Запуск
```sh
node app.js
```

---

# HelpDesk

### Licence
GPL v3 http://www.gnu.org/licenses/gpl-3.0.en.html

### Installation
```sh
mkdir helpdesk
cd ./helpdesk
git clone https://github.com/SibirixScrum/HelpDesk.git ./
npm i
```

### Configuring
```sh
cd ./config
cp ./config.example.js ./config.js
mcedit ./config.js
```

### Basic configurations
- connectString: 'mongodb://localhost/helpdesk' — MongoDB database will be created (in case there isn’t any done yet by the time the program is launched for the first time). 
- exports.projects — projects settings.
- responsible: 'tester@example.com' — email of project Administrator. The account is created automatically, the password is sent to the email. 
- exports.socketIo: 'SECRETKEY' — a private key for cookies encryption.
- exports.session.secret: 'SECRETKEY' — a private key for sessions encryption.
- exports.locales=['ru', 'en'] — available languages: English and Russian.
- en.json — English.
- ru.json — Russian.


### Launch
```sh
node app.js
```
