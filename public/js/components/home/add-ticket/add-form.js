const React = require('react');

const Dropzone  = require('react-dropzone');
const extend    = require('extend');
const Projects  = require('../../tickets/sidebar/projects');
const FormMixin = require('../../../mixins/form-mixin');

const AddForm = React.createClass({
    tiny: null,
    mixins: [FormMixin],
    getInitialState() {
        return {
            activeProject: window.location.hostname.split('.')[0].toUpperCase(),
            form: {
                name: this.props.user && this.props.user.name ? this.props.user.name : '',
                email: this.props.user && this.props.user.email ? this.props.user.email : '',
                title: '',
                text: ''
            },
            errors: {
                name: {empty: false},
                email: {empty: false},
                title: {empty: false},
                text: {empty: false}
            },
            files: []
        }
    },

    onSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) return;

        this.setState({isLoading: true});
        let data = new FormData();
        data.append('name', this.state.form.name);
        data.append('email', this.state.form.email);
        data.append('title', this.state.form.title);
        data.append('text', this.tiny.getContent({format: 'raw'}));
        data.append('projectCode', this.state.activeProject);

        for (var i = 0; i < this.state.files.length; i++) {
            data.append("files[]", this.state.files[i]);
        }

        this.props.onSubmit({
            url: '/ticket/add',
            form: data
        });
    },

    onDrop(files) {
        const newFiles = this.state.files;
        files.forEach((file) => newFiles.push(file));

        this.setState({files: newFiles});
    },

    onUploadClick(e) {
        e.preventDefault();
        this.refs.dropzone.open();
    },

    onDeleteFile(i) {
        let files = this.state.files;
        files.splice(i, 1);

        this.setState({files})
    },

    componentDidMount() {
        tinymce.init({
            menubar: false,
            setup: function(ed) {
                ed.on('keyup', function() {
                    this.onFieldChange('text');
                }.bind(this));
            }.bind(this),
            statusbar: false,
            plugins: 'autoresize autolink',
            autoresize_max_height: 200,
            valid_elements: "@[src],img,br",
            autoresize_min_height: 120,
            selector: '#text',
            theme: 'modern',
            init_instance_callback: function(editor) {
                this.tiny = editor;
            }.bind(this)
        });

        React.findDOMNode(this.refs.name).focus();
    },

    componentWillUnmount() {
        if (this.tiny) {
            this.tiny.remove();
        }
    },

    focusFirst(ev) {
        if (ev.keyCode == 9 && !ev.shiftKey) {
            ev.preventDefault();
            React.findDOMNode(this.refs.name).focus();
        }
    },

    focusLast(ev) {
        if (ev.keyCode == 9 && ev.shiftKey) {
            ev.preventDefault();
            React.findDOMNode(this.refs.submit).focus();
        }
    },

    onToggleProject(code) {
        this.setState({activeProject: code});
    },

    render() {
        const onDeleteFile  = this.onDeleteFile;
        const onFieldChange = this.onFieldChange;
        const {user} = this.props;

        return (
            <form className={this.props.isSuccess ? 'success' : ''}
                  onSubmit={this.onSubmit}
                  action="javascript:void(0)"
                  method="post"
                  encType="multipart/form-data">
                <input type="hidden" name="sessid" value="<?= md5(time()) ?>"/>

                <div className="success-text">Тикет отправлен. <br/>Проверяйте почту.</div>

                {this.props.isPopup && Object.keys(this.props.projects).length > 1
                    ?   <div className="row">
                            <Projects noTitle={true}
                               allowedProjects={this.props.projects}
                               activeProjects={[this.state.activeProject]}
                               onToggleProject={this.onToggleProject}
                            />
                        </div>
                    : ''
                }

                <div className="row">
                    <label className={'col '+this.getClassName('name')}>
                        <span>Как к вам обратиться?</span>
                        <input
                            disabled={user && user.name ? 'true' : false}
                            onChange={() => onFieldChange('name')}
                            onKeyUp={() => onFieldChange('name')}
                            ref="name"
                            type="text"
                            defaultValue={user&&user.name ? user.name : ''}
                            name="name"
                            onKeyDown={this.focusLast}
                            />
                        <span className="error-text">Необходимо указать имя</span>
                    </label>
                    <label className={'col ' + this.getClassName('email')}>
                        <span>Email</span>
                        <input disabled={user&&user.name ? 'true' : false}
                               onChange={() => onFieldChange('email')}
                               onKeyUp={() => onFieldChange('email')}
                               ref="email"
                               type="text"
                               defaultValue={user&&user.email ? user.email : ''}
                               name="email"/>
                        <span className="error-text">Необходимо указать Email</span>
                    </label>
                </div>
                <div className="row">
                    <label className={this.getClassName('title')}>
                        <span>Тема обращения</span>
                        <input onChange={() => onFieldChange('title')}
                               onKeyUp={() => onFieldChange('title')}
                               ref="title"
                               type="text"
                               name="title"/>
                        <span className="error-text">Необходимо указать тему</span>
                    </label>
                </div>
                <div className="row">
                    <label className={this.getClassName('text')}>
                        <span>Описание проблемы</span>
                        <textarea id="text" ref="text" name="text"></textarea>
                        <span className="error-text">Необходимо описать проблему</span>
                    </label>
                </div>
                <div className="row-submit">
                    <input className={this.props.isLoading ? "btn btn-blue js-send loading" : "btn btn-blue js-send"}
                           type="submit"
                           onKeyDown={this.focusFirst}
                           ref="submit"
                           value="Отправить"/>
                    <label className="file-label">
                        <span style={{lineHeight: '36px'}} href="javascript:void(0);" onClick={this.onUploadClick}>Прикрепить файл</span>
                        <span className="file-list">
                            {this.state.files.map((file, i) => <File onDeleteFile={onDeleteFile} key={i} index={i} file={file}/>)}
                        </span>
                    </label>
                </div>
                <Dropzone style={{display: 'none'}} ref="dropzone" disableClick={true} onDrop={this.onDrop}/>
            </form>
        )
    }
});

const File = React.createClass({
    delete() {
        this.props.onDeleteFile(this.props.index);
    },
    render() {
        return (
            <div onClick={this.delete} className="added-file">{this.props.file.name}</div>
        )
    }
});

module.exports = AddForm;
