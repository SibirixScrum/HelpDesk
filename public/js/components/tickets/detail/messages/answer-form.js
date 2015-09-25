/*** @jsx React.DOM */
const React    = require('react');
const reqwest  = require('reqwest');
const Dropzone = require('react-dropzone');

const ENTER_KEY = 13;

let _tiny;

const TicketAnswerForm = React.createClass({
    getInitialState() {
        return {
            text: '',
            isLoading: false,
            files: [],
            textIsEmpty: false
        }
    },
    onSubmit() {
        const text = _tiny.getContent({format: 'raw'});

        if (!text) {
            this.setState({textIsEmpty: true});
            return;
        }

        let data = new FormData();
        data.append('projectCode', this.props.ticket.project);
        data.append('number', this.props.ticket.number);
        data.append('text', text);

        for (var i = 0; i < this.state.files.length; i++) {
            data.append("files[]", this.state.files[i]);
        }

        this.setState({isLoading: true});

        reqwest({
            url: '/message/add/',
            method: 'post',
            data: data,
            type: 'json',
            contentType: false,
            processData: false,
            success: function(res) {
                let state = {isLoading: false};

                if (res.result) {
                    state.files = [];
                    _tiny.setContent('');
                }

                this.setState(state)
            }.bind(this)
        })
    },
    onTextKeyUp(e) {
        if (e.ctrlKey && e.keyCode === ENTER_KEY) {
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
        files.forEach((file) => newFiles.push(file));

        this.setState({files: newFiles});
    },
    onUploadClick() {
        this.refs.dropzone.open();
    },
    onDeleteFile(i) {
        let files = this.state.files;
        files.splice(i, 1);

        this.setState({files})
    },
    componentDidMount() {
        tinymce.init({
            selector: '#answer',
            menubar : false,
            setup: function(ed) {
                ed.on('keyup', (e) => this.onTextKeyUp(e));
                ed.on('change', () => this.onTextChange('text'));
            }.bind(this),
            statusbar: false,
            plugins: 'autoresize autolink',
            autoresize_max_height: 200,
            valid_elements: "@[src],img,br",
            autoresize_min_height: 120,
            theme: 'modern',
            init_instance_callback : function(editor) {
                _tiny = editor;
            }
        })
    },
    componentWillUnmount() {
        _tiny.remove();
    },
    render() {
        const onDeleteFile = this.onDeleteFile;
        return (
            <div className="answer">
                <form action="javascript:void(0)" method="post" encType="multipart/form-data">
                    <textarea id="answer" name="text" ref="text"></textarea>
                    <a onClick={this.onSubmit}
                       className={this.state.isLoading ? "btn btn-blue js-send loading" : "btn btn-blue js-send"}
                       href="javascript:void(0)">Отправить</a>
                    <span>или нажмите Ctrl+Enter</span>
                    <label className="file-label">
                        <a onClick={this.onUploadClick} href="javascript:void(0);" className="file">Прикрепить файл</a>
                        <span className="files">
                            {this.state.files.map((file, i) => <File onDeleteFile={onDeleteFile}
                                                                     key={i}
                                                                     index={i}
                                                                     file={file}/>)}
                        </span>
                    </label>
                    <Dropzone style={{display: 'none'}} ref="dropzone" disableClick={true} onDrop={this.onDrop}/>
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
