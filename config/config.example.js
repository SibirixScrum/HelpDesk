exports.port = '3000';
exports.serverName = 'localhost:' + exports.port;

exports.appRoot = __dirname + '/../';       // Relative to this file. Usually no need to change this
exports.tmpDir = exports.appRoot + 'temp/'; // Uploaded files temp folder

/**
 * Database, mongodb
 */
exports.db = {
    connectString: 'mongodb://localhost/helpdesk',
    host:   'localhost',
    dbname: 'helpdesk'
};

/**
 * SocketIO auth timeouts
 */
exports.socketIo = {
    expire: 60 * 5, // in seconds
    timeout: 15000, // in milliseconds
    secret: ''      // todo Fill secret key
};

/**
 * Session storage (in mongodb)
 */
exports.session = {
    maxAge: 30 * 60 * 1000, // in seconds
    secret: ''              // todo Fill secret key
};

/**
 * Mail parsing uses IMAP protocol
  */
exports.email = {
    login: "",     // todo Fill email login
    password: "",  // todo Fill email password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    sign: 'Helpdesk',
    checkInterval: 30 // in seconds
};

/**
 * Project list
 */
exports.projects = [
    {
        code:    'SCRUMBAN',                  // Project code
        domain:  'scrumban.helpdesk:3000',    // Project domain (each project should have it's own domain)
        name:    'Scrumban',                  // Project name
        title:   'ЦЕНТР ПОДДЕРЖКИ',           // Title for form
        letters: 'SB',                        // Short project code, used in ticket numbers
        color:   '#3896ff',                   // Project color for list
        responsible: 'tester@example.com',    // Email of responsible. Auto-creates user account with this email and sends password to it
        files: [                              // Array of files for project, use for documentation
            /*{
                name: 'Displayed text',
                path: '/docs/scrumban-b24-handbook.pdf' // File path, relative to www/public/
            }, {
                name: '',
                path: ''
            },*/
        ]
    }/*
    , {
        code: 'PROJECT2',
        ...
    }*/
];

// Time to mark tickets with red color
exports.markDateRed = 60 * 60 * 24 * 3; // 3 days
exports.files = {
    maxSize:  5 * 1024 * 1024,  // In bytes
    maxCount: 10,
    extensions: [
        'jpg', 'jpeg', 'gif', 'png', 'bmp', // images
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'ods', 'odt', 'txt' // Documents
    ]
};

exports.tickets = {
    page: {
        limit: 1000 // Load in one page
    }
};