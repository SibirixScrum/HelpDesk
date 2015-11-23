/*** @jsx React.DOM */

const isIE9     = require('../../ie-check');
const React     = require('react');
const Dropzone  = require('react-dropzone');
const extend    = require('extend');
const Projects  = require('../../tickets/sidebar/projects');
const FormMixin = require('../../../mixins/form-mixin');

const _filesConfig = APP.files;
const TAB_KEY      = 9;

const AddForm = React.createClass({
    tiny: null,
    mixins: [FormMixin],
    getInitialState() {
        return {
            activeProject: window.location.hostname.split('.')[0].toUpperCase(),
            dragHover: false,
            form: {
                name: this.props.user && this.props.user.name ? this.props.user.name : '',
                email: this.props.user && this.props.user.email ? this.props.user.email : '',
                title: '',
                text: ''
            },
            errors: {
                name: {empty: false},
                email: {empty: false, emailInvalid: false},
                title: {empty: false},
                text: {empty: false}
            },
            files: []
        };
    },

    onSubmit(e) {
        e.preventDefault();

        if (this.props.isSuccess || !this.validateForm()) return;

        this.setState({isLoading: true});

        let data     = this.state.form;
        data.files   = this.state.files;
        data.project = this.state.activeProject;

        this.props.onSubmit({
            url: '/ticket/add',
            form: data
        });
    },

    onDrop(files) {
        const newFiles = this.state.files;
        let filesError = false;
        files.forEach(function(file) {
            let ext = file.name.split('.')[file.name.split('.').length - 1];

            if (newFiles.length >= _filesConfig.maxCount) {
                filesError = 'Пожалуйста, не более ' + _filesConfig.maxCount + ' файлов.';
            } else if (file.size > _filesConfig.maxSize) {
                filesError = 'Пожалуйста, файлы не более ' + Math.round(_filesConfig.maxSize / 1000000) + 'Мб.';
            } else if (_filesConfig.extensions.indexOf(ext) === -1) {
                let exts   = _filesConfig.extensions.join(', ');
                filesError = 'Извините, но я понимаю только следующие расширения файлов: ' + exts;
            } else {
                newFiles.push(file)
            }
        });

        this.setState({files: newFiles, filesError, dragHover: false});

        if (filesError) this.props.showModal({text: filesError});
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

    componentWillReceiveProps(props) {
        if (props.isPopup) {
            setTimeout(function() {
                React.findDOMNode(this.refs.title).focus();
            }.bind(this), 700);
        }

        if (props.isSuccess) {
            this.tiny.setContent('');
            this.setState({
                form: {
                    name: this.props.user && this.props.user.name ? this.props.user.name : '',
                    email: this.props.user && this.props.user.email ? this.props.user.email : '',
                    title: '',
                    text: ''
                },
                errors: {
                    name: {empty: false},
                    email: {empty: false, emailInvalid: false},
                    title: {empty: false},
                    text: {empty: false}
                },
                files: []
            });
        }
    },

    componentDidMount() {
        tinymce.init({
            menubar: false,
            setup: function(ed) {
                ed.on('keyup', function() {
                    this.onFieldChange('text');
                }.bind(this));
                ed.on('keydown', function(e) {
                    if (!ed.getContent() && e.keyCode === 13) {
                        e.preventDefault();
                        return false;
                    }
                }.bind(this));
            }.bind(this),
            toolbar: "undo redo | styleselect bold italic | alignleft aligncenter alignright | bullist numlist",
            statusbar: false,
            autoresize_max_height: 200,
            valid_elements: APP.allowedTags,
            extended_valid_elements: "span[style],p[style]",
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
        if (ev.keyCode == TAB_KEY && !ev.shiftKey) {
            ev.preventDefault();
            let el = this.props.user.name ? this.refs.title : this.refs.name;
            React.findDOMNode(el).focus();
        }
    },

    focusLast(ev) {
        if (ev.keyCode == TAB_KEY && ev.shiftKey) {
            ev.preventDefault();
            React.findDOMNode(this.refs.submit).focus();
        }
    },

    closePopup(e) {
        e.preventDefault();
        this.props.closePopup();
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

                <div className="success-text">{this.props.isSuccess}</div>

                {this.props.isPopup && this.props.projects && Object.keys(this.props.projects).length > 1
                    ? <div className="row">
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
                            value={this.state.form.name}
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
                               value={this.state.form.email}
                               defaultValue={user&&user.email ? user.email : ''}
                               name="email"/>
                        <span className="error-text">Необходимо указать валидный Email</span>
                    </label>
                </div>
                <div className="row">
                    <label className={this.getClassName('title')}>
                        <span>Тема обращения</span>
                        <input onChange={() => onFieldChange('title')}
                               onKeyUp={() => onFieldChange('title')}
                               ref="title"
                               type="text"
                               value={this.state.form.title}
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
                <div className="row-submit clearfix">
                    <input className={this.props.isLoading ? "btn btn-blue js-send loading" : "btn btn-blue js-send"}
                           type="submit"
                           onClick={this.props.isSuccess && this.props.closePopup ? this.closePopup : function(){}}
                           onKeyDown={this.focusFirst}
                           ref="submit"
                           value="Отправить"/>
                    {isIE9 ? '' : <Dropzone activeClassName="drag-hover"
                                            className="dropzone-drop"
                                            ref="dropzone"
                                            disableClick={true}
                                            onDrop={this.onDrop}>
                                    <label className="file-label">
                                        <span style={{lineHeight: '36px'}} href="javascript:void(0);" onClick={this.onUploadClick}>Прикрепить файл</span>
                                        <span className="file-list">
                                            {this.state.files.map((file, i) => {
                                                return <File onDeleteFile={onDeleteFile} key={i} index={i} file={file}/>
                                            })}
                                        </span>
                                    </label>
                                </Dropzone>
                    }
                </div>
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
