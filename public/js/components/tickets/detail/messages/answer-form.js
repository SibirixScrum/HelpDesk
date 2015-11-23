/*** @jsx React.DOM */
const isIE9    = require('../../../ie-check');
const React    = require('react');
const request  = require('superagent');
const Dropzone = require('react-dropzone');

const _filesConfig = APP.files;

const ENTER_KEY = 13;

let _tiny;
let _focusTimeout = false;

const TicketAnswerForm = React.createClass({
    getInitialState() {
        return {
            dragHover: false,
            filesError: false,
            text: '',
            isLoading: false,
            files: [],
            textIsEmpty: false
        }
    },
    onSubmit() {
        const text = _tiny.getContent();

        if (!text) {
            this.setState({textIsEmpty: true});
            return;
        }

        if (this.state.filesError) {
            this.setState({textIsEmpty: true, isLoading: false});
            this.props.showModal({text: this.state.filesError});
        }

        this.setState({isLoading: true});

        let req = request
            .post('/message/add/')
            .set('Accept', 'application/json');

        if (isIE9) {
            req.send({
                projectCode: this.props.ticket.project,
                number: this.props.ticket.number,
                text: text,
                nocache: Date.now()
            });
        } else {
            req
                .field('projectCode', this.props.ticket.project)
                .field('number', this.props.ticket.number)
                .field('text', text)
                .field('nocache', Date.now());
        }

        if (this.state.files.length) {
            this.state.files.forEach(function(file) {
                req.attach('files[]', file, file.name);
            });
        }

        req.end(this._responseHandler.bind(this));
    },
    _responseHandler(err, res) {
        if (err) {
            let resp = JSON.parse(err.response.text);
            this.setState({filesError: resp.message, isLoading: false});
            this.props.showModal({text: resp.message});
            return;
        }

        const response = res.xhr.response || res.xhr.responseText;

        res = JSON.parse(response);

        let state = {isLoading: false};

        if (res.result) {
            state.files = [];
            _tiny.setContent('');
        }

        if (isIE9) {
            window.location.href = '/tickets/' + `${this.props.ticket.project}-${this.props.ticket.number}`;
        }

        this.setState(state)
    },
    onTextKeyUp(e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === ENTER_KEY) {
            e.preventDefault();
            this.onSubmit();
            return;
        }

        this.setState({textIsEmpty: false});
    },
    onTextChange() {
        this.setState({textIsEmpty: false});
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

    onUploadClick() {
        this.refs.dropzone.open();
    },
    onDeleteFile(i) {
        let files = this.state.files;
        files.splice(i, 1);

        this.setState({files})
    },
    onTextKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === ENTER_KEY) e.preventDefault();
    },
    componentDidMount() {
        tinymce.init({
            selector: '#answer',
            menubar: false,
            setup: function(ed) {
                ed.on('keyup', (e) => this.onTextKeyUp(e));
                ed.on('keydown', (e) => this.onTextKeyDown(e));
                ed.on('change', () => this.onTextChange('text'));
            }.bind(this),
            toolbar: "undo redo | styleselect bold italic | alignleft aligncenter alignright | bullist numlist",
            statusbar: false,
            autoresize_max_height: 200,
            valid_elements: APP.allowedTags,
            extended_valid_elements: "span[style],p[style]",
            autoresize_min_height: 120,
            theme: 'modern',
            init_instance_callback: function(editor) {
                _tiny = editor;
            }
        });
    },
    componentWillReceiveProps(props) {
        if (!props.isLoading) {
            _focusTimeout = setTimeout(function() {
                _tiny.focus();
            }, 600);
        }
    },
    componentWillUnmount() {
        clearTimeout(_focusTimeout);
        _tiny.remove();
    },
    onFileDragEnter() {
        this.setState({dragHover: true})
    },
    onFileDragLeave() {
        this.setState({dragHover: false});
    },

    render() {
        const onDeleteFile = this.onDeleteFile;
        return (
            <div className="answer">
                <form action="javascript:void(0)" method="post" encType="multipart/form-data">
                    <div className={this.state.textIsEmpty ? "textarea-wrap error" : "textarea-wrap"}>
                        <textarea id="answer" name="text" ref="text"></textarea>
                        <span className="error-text">Необходимо написать ответ</span>
                    </div>
                    <a onClick={this.onSubmit}
                       className={this.state.isLoading ? "btn btn-blue js-send loading" : "btn btn-blue js-send"}
                       href="javascript:void(0)">Отправить</a>
                    <span className="sub">или нажмите Ctrl+Enter</span>
                    {isIE9 ? '' : <Dropzone onDragEnter={this.onFileDragEnter}
                                                        onDragLeave={this.onFileDragLeave}
                                                        className={this.state.dragHover ? "drag-hover dropzone-drop" : "dropzone-drop"}
                                                        ref="dropzone"
                                                        disableClick={true}
                                                        onDrop={this.onDrop}>
                                    <label className="file-label">
                                        <a onClick={this.onUploadClick} href="javascript:void(0);" className="file">Прикрепить
                                            файл</a>
                                    <span className="files">
                                        {this.state.files.map((file, i) => {
                                            return <File onDeleteFile={onDeleteFile} key={i} index={i} file={file}/>
                                        })}
                                    </span>
                                    </label>
                                </Dropzone>}
                </form>
            </div>
        )
    }
});

const File = React.createClass({
    render() {
        return (
            <div onClick={() => this.props.onDeleteFile(this.props.index)}
                 className="added-file">{this.props.file.name}</div>
        )
    }
});

module.exports = TicketAnswerForm;
