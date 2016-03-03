exports.port = '3000';
exports.serverName = 'localhost:' + exports.port;

exports.appRoot = __dirname + '/../';       // Relative to this file. Usually no need to change this
exports.tmpDir = exports.appRoot + 'temp/'; // Uploaded files temp folder

/**
 * Database, mongodb
 */
exports.db = {
    connectString: 'mongodb://localhost/helpdesk'
};

/**
 * SocketIO auth timeouts
 */
exports.socketIo = {
    expire: 60 * 5,        // in seconds
    timeout: 15000,        // in milliseconds
    secret: 'SECRET'       // todo Fill secret key
};

/**
 * Session storage (in mongodb)
 */
exports.session = {
    maxAge: 30 * 60 * 1000, // in seconds
    secret: 'SECRET'        // todo Fill secret key
};

/**
 * Project list
 */
exports.projects = [
    {
        code:    'HELPDESK',                  // Project code
        domain:  'localhost:3000',            // Project domain (each project should have it's own domain)
        name:    'Helpdesk',                  // Project name
        title:   'This is a test',            // Title for form
        letters: 'HD',                        // Short project code, used in ticket numbers
        responsible: 'example@example.com',   // Email of responsible. Auto-creates user account with this email and sends password to it
        email: { // Mail parsing service
            login: "",     // todo Fill email login
            password: "",  // todo Fill email password
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            sign: 'Helpdesk',
            checkInterval: 30, // in seconds
            smtpHost: 'smtp.gmail.com',
            smtpPort: 465,
            smtpSecure: true,
            keepAlive: false // Persistent connection
        },
        files: [                              // Array of files for project, use for documentation
            /*{
                name: 'Displayed text',
                path: '/docs/manual.pdf' // File path, relative to www/public/
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

exports.projectColors = [
    'ff0036', 'ffae00', 'ffe400', '96ff00', '00a2ff', '005aff', '8400ff',
    'ff0078', 'ff9600', 'f6ff00', 'ccf801', '00ccff', '065cec', 'a800ff',
    'ff00c6', 'ff7e00', 'd2ff00', 'e3eb00', '00eaff', '0957d9', 'b716fa'
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
    editor: {
        allowedTags: "<p><span><b><strong><i><em><br><h1><h2><h3><h4><h5><h6><ul><ol><li><s><sub><sup><code>"
    },
    page: {
        limit: 100 // Load tickets in one page
    }
};

// Create tickets from new emails (without existent ticket number)
exports.createTicketFromEmail = true;
// Default project to add new tickets created from emails
exports.ticketFromEmailProject = 'HD';
