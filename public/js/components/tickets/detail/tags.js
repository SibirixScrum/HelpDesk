/*** @jsx React.DOM */
const React = require('react');
const Select = require('react-select');

const TicketDetailTags = React.createClass({

    getInitialState() {
        return {
            selectVal: null
        }
    },

    render() {
        return (
            <div className="ticket-tags">
                <div className="tag-list">
                    {this.props.tags ?
                     this.props.tags.map((tag, i) => <span key={i} className="tag-item"><nobr>{tag}
                         <i className="tag-del" onClick={e => {this.props.tagRemove(i)}}>⨯</i></nobr></span>) : null}
                </div>
                <div className="tag-add">
                    <Select
                        value={this.state.selectVal}
                        placeholder="Добавить тег"
                        allowCreate={true}
                        options={this.props.tagsReference.map(tag => { return { value: tag, label: tag } })}
                        onChange={val => {
                            val = val.trim();
                            if (-1 === this.props.tags.indexOf(val)) {
                                this.props.tagAdd(val);
                            }
                            this.setState({selectVal: null});
                        }}
                    />
                </div>
            </div>
        )
    }
});

module.exports = TicketDetailTags;
